const arxiv = require('arxiv-api');
const winkNLP = require('wink-nlp');
const its = require('wink-nlp/src/its.js');
const as = require('wink-nlp/src/as.js');
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

// async function tweetWithImg(text, retry = 0) {
//   const mediaId = await TwitterClient.v1.uploadMedia('./media.png').catch(e => {
//     console.log(e);
//     return null;
//   });
//   if (!mediaId) {
//     console.log('media id is not found');
//     if (retry < 3) {
//       return tweetWithImg(text, retry + 1);
//     } else {
//       return console.log(`tweet failed ${text}`);
//     }
//   }
//   await TwitterClient.v2.tweet({ "text": text, "media": { "media_ids": [mediaId] } }).catch(e => console.log(e));
// }

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
  console.log(`[${newPapers.length}] new papers found`);

  let tweetThreads = [];
  for (let i = newPapers.length - 1; i >= 0; i--) {
    const paper = newPapers[i];
    let { title, summary } = paper;
    title = latexReplacer(title.replace(/[\n ]+/g, ' '));
    summary = latexReplacer(summary.replace(/[\n ]+/g, ' '));
    const doc = nlp.readDoc(paper.summary);
    const tokensWithTag = doc.tokens().out().zip(doc.tokens().out(its.pos))
    const frequentPropn = tokensWithTag.filter(_ => _[1] === 'PROPN')
      .map(_ => _[0])
      .reduce((acc, v) => {
        acc[v] = (acc[v] || 0) + 1;
        return acc;
      }, {})
    const top4Propn = Object.entries(frequentPropn).sort((a, b) => b[1] - a[1]).map(_ => _[0]).slice(0, 4);
    const summaryJP = (await axios.get(`https://script.google.com/macros/s/${process.env.Google_Token_Api}/exec?text=${encodeURI(summary)}&source=en&target=ja`).catch(e => {
      console.log(e);
      return { data: { text: null } }
    })).data.text;
    if (!summaryJP) return;
    await createImage(summaryJP); // creat at [./media.png]
    // tweetWithImg(`${title}\n${paper.id}\nkeywords: ${top4Propn.join(', ')}`);
    const mediaId = await TwitterClient.v1.uploadMedia('./media.png').catch(e => console.log(e));
    if (mediaId) {
      const text = `${title}\n${paper.id}\nkeywords: ${top4Propn.join(', ')}`;
      tweetThreads.push({ text, media: { media_ids: [mediaId] }, reply_settings: "mentionedUsers" });
      console.log(`pushed[${i}]: ${paper.id}`);
    } else {
      console.log(`fail pushed[${i}]: ${paper.id}`);
    }
    // Threadの最大数は25らしいので25ごとにツイート
    if (tweetThreads.length >= 25 || (tweetThreads.length > 0 && i === 0)) {
      await TwitterClient.v2.tweetThread(tweetThreads).catch(e => console.log(e));
      tweetThreads = [];
    }
    await sleep(60 * 1000);
  }

  return papers[0] ? new Date(papers[0].published) : startTime;
}

async function helper() {
  let latestFeedTime = new Date(Date.now());
  let beLft = latestFeedTime;
  while (true) {
    latestFeedTime = await main(latestFeedTime);
    const sleetMinutes = (beLft === latestFeedTime) ? 15 : SearchMax;
    beLft = latestFeedTime;
    await sleep(sleetMinutes * 60 * 1000);
  }
}

helper();