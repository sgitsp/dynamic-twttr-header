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

// Curent Date
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var today = new Date();
/*let time = today.getHours() + ":" + today.getMinutes()/* + ":" + today.getSeconds()*/;
let day = days[today.getDay()];
let month = months[today.getMonth()]
let date = today.getDate() + " " + month + " " + today.getFullYear();

function digiTime(date) {
  var hours = ("0" + today.getHours()).slice(-2);
  var minutes = ("0" + today.getMinutes()).slice(-2);
  var ampm = hours >= 12 ? 'PM' : 'AM';
  /*hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;*/
  let time = hours + ':' + minutes/* + ' ' + ampm*/;
  return time;
}

// Function to get latest folowers
async function getLatestFollowers() {
  const data = await twitterClient.accountsAndUsers.followersList({
    screen_name: process.env.TWITTER_HANDLE,
    count: 3,
  });
  console.log(`Fetch latest followers...`);

// Download avatar image...
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

// Function to resize downloaded avatar
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
  console.log(`Crop and rezise avatar images...`);
}

// Function to crop image
const width = 96,
    r = width / 2,
    circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);

// Function to get latest article via feed.xml
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

// Additional credit text
let credit = 'This header image has been generated using special code by @sgitsp';

// Function to draw image
async function drawBanner() {
  const images = ['1500x500-default.png', '0.png', '1.png', '2.png'];
  const promiseArray = [];
  const dayFont = await Jimp.loadFont('fonts/TimeandSpace-Regular.ttf.fnt');
  const timeFont = await Jimp.loadFont("fonts/Caviar_Dreams_Bold_64.fnt");
  const dateFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE)
  images.forEach((image) => promiseArray.push(Jimp.read(image)));
  //promiseArray.push(getLatestArticleHeadline());
  promiseArray.push(Jimp.loadFont(Jimp.FONT_SANS_16_WHITE));

  Promise.all(promiseArray).then(
    ([banner, imageOne, imageTwo, imageThree/*, headline*/, font]) => {
      banner.composite(imageOne, 1082, 45);
      banner.composite(imageTwo, 1193, 45);
      banner.composite(imageThree, 1304, 45);
      console.log(`3 latest followers added`);
      banner.print(dayFont, 585, 110, day);
      banner.print(timeFont, 380, 92, digiTime(new Date).toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
      banner.print(dateFont, 584, 132, date);
      console.log(`Additional cosmetic added`);
      banner.print(font, 500, 465, credit);
      console.log(`Generating new header...`);
      console.log(`Last sync: ${day}, ${date} (${digiTime(new Date).toLocaleString("en-US", {timeZone: "Asia/Jakarta"})})`);
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
      console.log('Upload to Twitter done!');
    });
}

// Set interval in milisecond 1 min = 60000
getLatestFollowers();
setInterval(() => {
  getLatestFollowers();
}, 120000);
