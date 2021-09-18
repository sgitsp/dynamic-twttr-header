// Import all the packages
import dotenv from 'dotenv';
dotenv.config();
import { TwitterClient } from 'twitter-api-client';
import axios from 'axios';
import fs from 'fs';
import Jimp from 'jimp';
import sharp from 'sharp';

// Twitter auth credential
const twitterClient = new TwitterClient({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  accessToken: process.env.CONSUMER_KEY,
  accessTokenSecret: process.env.CONSUMER_SECRET,
});

// Curent Date Function
var today = new Date();
today.setUTCHours(today.getHours() + 7); // add 7 hour based on GMT+7 location
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
let day = days[today.getDay()];
let month = months[today.getMonth()];
let date = today.getDate() + " " + month + " " + today.getFullYear();

function currentTime(date) {
  var today = new Date();
  today.setUTCHours(today.getHours() + 7); // add 7 hour based on GMT+7 location
  let hours = ("0" + today.getHours()).slice(-2);
  let minutes = ("0" + today.getMinutes()).slice(-2);
  let seconds = ("0" + today.getSeconds()).slice(-2);
  let time = hours + ':' + minutes;
  /*console.log('Time now:', time, 'WIB')*/
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

// Fetch Recent Track from Lastfm
async function getRecentTrack() {
  let listening = ""
  await axios.get(process.env.LASTFM).then(response => {
    var latestTrack = response.data.recenttracks.track[0]
    let trackTitle = latestTrack.name;
    let trackArtist = latestTrack.artist["#text"];
    // detect if the track has attributes associated with it
    var nowplaying = latestTrack["@attr"]
    
    // if nowplaying is undefined
    if (typeof nowplaying === 'undefined') {
      listening = ("Recently Played:" + ' ' + '"' + trackTitle + '"' + ' ' + 'by' + ' ' + trackArtist);
    } else {
      listening = ("Now Playing:" + ' ' + '"' + trackTitle + '"' + ' ' + 'by' + ' ' + trackArtist);
    }
    console.log(listening);
  });
  return listening;
}

// Additional credit text
let credit = 'This header image has been generated using special code by @sgitsp';

// Function to draw image
async function drawBanner() {
  const images = ['1500x500-default.png', '0.png', '1.png', '2.png'];
  const promiseArray = [];
  const dayFont = await Jimp.loadFont('fonts/CaviarDreams.32.fnt');
  const timeFont = await Jimp.loadFont("fonts/Caviar_Dreams_Bold_64.fnt");
  const dateFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE)
  const listeningFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE)
  images.forEach((image) => promiseArray.push(Jimp.read(image)));
  promiseArray.push(getRecentTrack());
  promiseArray.push(Jimp.loadFont(Jimp.FONT_SANS_16_WHITE));

  Promise.all(promiseArray).then(
    ([banner, imageOne, imageTwo, imageThree, listening, font]) => {
      banner.composite(imageOne, 1082, 45);
      banner.composite(imageTwo, 1193, 45);
      banner.composite(imageThree, 1304, 45);
      console.log(`3 latest followers added`);
      banner.print(dayFont, 585, 98, day);
      banner.print(timeFont, 380, 92, currentTime(new Date));
      banner.print(dateFont, 584, 138, date);
      console.log(`Additional cosmetic added`);
      banner.print(listeningFont, 0, 465, {
        text: listening,
        alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
        alignmentX: Jimp.VERTICAL_ALIGN_BOTTOM,
      }, 1445, 459);
      console.log(`Generating new header...`);
      console.log(`Last sync: ${day}, ${date} (${currentTime(new Date)} UTC+7)`);
      banner.write('1500x500-draw.png',function () {
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

// Starter
getLatestFollowers();
setInterval(currentTime, 60000); // every 1 min
setInterval(() => {
  getLatestFollowers();
}, 60000); // every 1 min 
