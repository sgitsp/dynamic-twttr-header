// Import all the packages
import dotenv from 'dotenv';
dotenv.config();
import { TwitterClient } from 'twitter-api-client';
import axios from 'axios';
import fs from 'fs';
import Jimp from 'jimp';
import { parseString } from 'xml2js';
import sharp from 'sharp';

// Twitter auth credential
const twitterClient = new TwitterClient({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  accessToken: process.env.CONSUMER_KEY,
  accessTokenSecret: process.env.CONSUMER_SECRET,
});

// Function to crop circle image
const width = 96,
    r = width / 2,
    circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);

// Function to get latest folowers
async function getLatestFollowers() {
  const data = await twitterClient.accountsAndUsers.followersList({
    screen_name: process.env.TWITTER_HANDLE,
    count: 3,
  });
// Download avatar...
  let count = 0;
  const downloads = new Promise((resolve, reject) => {
    data.users.forEach((user, index, arr) => {
      downloadImage(user.profile_image_url_https.replace('_normal', ''), `${index}.png`).then(() => {
        count++;
        if (count === arr.length) resolve();
      });
    });
  });

  downloads.then(() => {
    drawBanner();
  });
}

// Resize downloaded images
async function downloadImage(url, image_path) {
  await axios({
    url,
    responseType: 'arraybuffer',
  }).then(
    (response) =>
      new Promise((resolve, reject) => {
        resolve(sharp(response.data)
          .resize(96, 96)
          .composite([{
            input: circleShape,
            blend: 'dest-in'
          }])
          .toFile(image_path));
      })
  );
}

/*
async function getLatestArticleHeadline() {
  let title = '';
  await axios.get(process.env.SITEMAP).then((data) => {
    parseString(data.data, function (err, data) {
      title = data.lfm.recenttracks.track[0].artist['text'];
    });
  });
  return title;
}
*/

// Function to draw image
async function drawBanner() {
  const images = ['1500x500-default.png', '0.png', '1.png', '2.png'];
  const promiseArray = [];
  images.forEach((image) => promiseArray.push(Jimp.read(image)));
  //promiseArray.push(getLatestArticleHeadline());
  //promiseArray.push(Jimp.loadFont(Jimp.FONT_SANS_32_BLACK));

  Promise.all(promiseArray).then(
    ([banner, imageOne, imageTwo, imageThree, headline, font]) => {
      console.log(`Current headline: ${headline}`);
      banner.composite(imageOne, 1082, 45);
      banner.composite(imageTwo, 1193, 45);
      banner.composite(imageThree, 1304, 45);
      //banner.print(font, 410, 410, headline);
      banner.write('1500x500-draw.png', function () {
        uploadBanner();
      });
    }
  );
}

// Function to upload banner
async function uploadBanner() {
  const base64 = await fs.readFileSync('1500x500-draw.png', { encoding: 'base64' });
  await twitterClient.accountsAndUsers
    .accountUpdateProfileBanner({
      banner: base64,
    })
    .then((d) => {
      console.log('Upload to Twitter done');
    });
}

getLatestFollowers();
setInterval(() => {
  getLatestFollowers();
}, 120000);
