const arxiv = require('arxiv-api');
const winkNLP = require('wink-nlp');
const its = require('wink-nlp/src/its.js');
const model = require('wink-eng-lite-model');
const nlp = winkNLP(model);
const axios = require('axios');
require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const TwitterClient = new TwitterApi({
  appKey: process.env.Twitter_Api_Key,
  appSecret: process.env.Twitter_Api_Secret,
  accessToken: process.env.Twitter_Token_Access,
  accessSecret: process.env.Twitter_Token_Secret
});

const createImage = require('./createImage');
const latexReplacer = require('./latexReplacer');

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
Array.prototype.zip = function (...args) {
  const new_array = [];
  for (let i = 0; i < this.length; i++) {
    new_array.push([this[i], ...args.map(arg => arg[i])]);
  }
  return new_array;
}

const SearchMax = 100;

async function main(startTime) {
  const papers = await arxiv.search({
    searchQueryParams: [{ include: [{ name: 'cs.CL', prefix: 'cat' }] }],
    start: 0,
    maxResults: SearchMax,
    sortBy: 'submittedDate',
    sortOrder: 'descending'
  }).catch(e => { console.log(e); return [] });
  const newPapers = papers
    .filter(_ => _.categories[0].term === 'cs.CL')
    .filter(_ => new Date(_.published) > startTime);
  console.log(`[${newPapers.length}] new papers found at [${(new Date()).toLocaleString()}]`);

  const tweetThreads = [];
  for (let i = newPapers.length - 1; i >= 0; i--) {
    const paper = newPapers[i];
    const { title, summary } = paper;
    const escapedTitle = latexReplacer(title.replace(/[\n ]+/g, ' '));
    const escapedSummary = latexReplacer(summary.replace(/[\n ]+/g, ' '));
    const doc = nlp.readDoc(escapedSummary);
    const tokensWithTag = doc.tokens().out().zip(doc.tokens().out(its.pos))
    const frequentPropn = tokensWithTag
      .filter(_ => _[1] === 'PROPN')
      .map(_ => _[0])
      .reduce((acc, v) => {
        acc[v] = (acc[v] || 0) + 1;
        return acc;
      }, {})
    const top4Propn = Object.entries(frequentPropn).sort((a, b) => b[1] - a[1]).map(_ => _[0]).slice(0, 4);
    const transResult = await axios.get(`https://script.google.com/macros/s/${process.env.Google_Token_Api}/exec?text=${encodeURI(escapedSummary)}&source=en&target=ja`)
      .catch(e => {
        console.log(e);
        return { data: { text: null } }
      })
    const summaryJP = transResult.data.text;

    let mediaId = null;
    if (summaryJP) {
      await createImage(summaryJP); // creat at [./media.png]  
      mediaId = await TwitterClient.v1.uploadMedia('./media.png').catch(e => console.log(e));
    } else {
      console.log('summary JP not found');
    }
    if (mediaId) {
      const text = `${escapedTitle}\n${paper.id}\nkeywords: ${top4Propn.join(', ')}`;
      if (tweetThreads.length === 0) {
        tweetThreads.push({ text, media: { media_ids: [mediaId] }, reply_settings: "mentionedUsers" });
      } else {
        tweetThreads.push({ text, media: { media_ids: [mediaId] } });
      }
      console.log(`pushed [${i}]: ${paper.id}`);
    } else {
      console.log(`failed push [${i}]: ${paper.id}`);
    }
    // Threadの最大数は25らしいので25ごとにツイート
    if (tweetThreads.length >= 25 || (tweetThreads.length > 0 && i === 0)) {
      await TwitterClient.v2.tweetThread(tweetThreads).catch(e => console.log(e));
      console.log(`tweeted [${tweetThreads.length}]`);
      tweetThreads.length = 0;
    }
    await sleep(30 * 1000);
  }
  return papers[0] ? new Date(papers[0].published) : startTime;
}

async function helper() {
  let latestFeedTime = new Date();
  let beLft = latestFeedTime;
  while (true) {
    latestFeedTime = await main(latestFeedTime).catch(e => console.log(e));
    const sleetMinutes = (beLft === latestFeedTime) ? 15 : SearchMax;
    beLft = latestFeedTime;
    await sleep(sleetMinutes * 60 * 1000);
  }
}

helper();