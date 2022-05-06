// https://note.affi-sapo-sv.com/nodejs-drawtext-compress-output_.php
module.exports = async (text) => {
  const TextToSVG = require("text-to-svg");
  const textToSVG = TextToSVG.loadSync('./YuGothR001.ttf');
  const svgOptions = { x: 0, y: 0, fontSize: 32, anchor: "top", attributes: { fill: "black", stroke: "black" } };
  // const svgData = textToSVG.getSVG(text, svgOptions);
  // const { width, height } = textToSVG.getMetrics(text, svgOptions);
  const MAXWIDTH = 1260;
  const MAXHEIGHT = 960;
  const LINESPACING = 14;

  const textSVGs =
    [...text].reduce(
      (acc, val) => {
        if (acc[0].lastText === null) return acc;
        const text = acc[0].lastText + val;
        const { width, height } = textToSVG.getMetrics(text, svgOptions);
        if (width > MAXWIDTH) { // 行内に収まらなかった
          acc[0].svgBuffer.push({
            svg: textToSVG.getSVG(acc[0].lastText, svgOptions),
            top: acc[0].allHeight
          });
          acc[0].lastText = val;
          acc[0].allHeight += height + LINESPACING;
          if (acc[0].allHeight + height > MAXHEIGHT) acc[0].lastText = null;
        } else {
          acc[0].lastText = text;
        }
        return acc;
      }, [{ lastText: "", allHeight: 0, svgBuffer: [] }]
    ).reduce((n, svgData) => {
      const { lastText, allHeight, svgBuffer, } = svgData;
      if (lastText !== null && lastText.length > 0) {
        svgBuffer.push({
          svg: textToSVG.getSVG(lastText, svgOptions),
          top: allHeight
        });
        svgData.allHeight = allHeight + textToSVG.getMetrics(lastText, svgOptions).height;
      }
      return svgData;
    }, null);

  const sharp = require("sharp");
  const TOPX = 0;
  const LEFTY = 10;
  const newTopX = (MAXHEIGHT - textSVGs.allHeight) / 2;
  const compositeArgs = textSVGs.svgBuffer.map(
    svgData => ({
      input: Buffer.from(svgData.svg),
      top: Math.floor(TOPX + svgData.top + newTopX),
      left: LEFTY,
    })
  );

  const imgBuffer =
    await sharp("base.png")
      .composite(compositeArgs)
      .png({ compressionLevel: 9, quality: 0 })
      .toBuffer();

  const imageminPngquant = require("imagemin-pngquant");
  const fs = require('fs').promises;

  const pngBuffer =
    await imageminPngquant({
      speed: 1,
      quality: [1, 1]
    })(imgBuffer);

  await fs.writeFile("./media.png", pngBuffer);
}

