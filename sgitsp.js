// Import all the packages
import dotenv from 'dotenv';
dotenv.config();
import { TwitterClient } from 'twitter-api-client';
import axios from 'axios';
import fs from 'fs';
import Jimp from 'jimp';
import sharp from 'sharp';

// Twitter Auth Credential
const twitterClient = new TwitterClient({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  accessToken: process.env.CONSUMER_KEY,
  accessTokenSecret: process.env.CONSUMER_SECRET,
});

// Curent Date Function
var today = new Date();
today.setUTCHours(today.getHours() + 7); // add 7 hour based on GMT+7 location
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const days = ["- S u n -", "- M o n -", "- T u e -", "- W e d -", "- T h u -", "- F r i -", "- S a t -"];
//let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
let day = days[today.getDay()]; // Wednesday
let date = today.getDate(); // 17
let month = months[today.getMonth()]; // January
let year = today.getFullYear(); // 1996
let fullDate = today.getDate() + " " + month + " " + today.getFullYear(); // 17 January 1996

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

// Function to get recent folowers
async function getLatestFollowers() {
  const data = await twitterClient.accountsAndUsers.followersList({
    screen_name: process.env.TWITTER_HANDLE,
    count: 4,
  });
  console.log(`Fetch recent followers...`);

// Download avatar image...
  let count = 0;
  const downloads = new Promise((resolve, reject) => {
    data.users.forEach((user, index, arr) => {
      downloadImage(user.profile_image_url_https.replace('_normal', ''), `${index}.png`).then(() => {
        count++;
        if (count === arr.length) resolve();
      });
    });
  })

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
    let trackCover = latestTrack.image[3]["#text"];
    // detect if the track has attributes associated with it
    var nowplaying = latestTrack["@attr"]
    
    // if nowplaying attr is undefined
    if (typeof nowplaying === 'undefined') {
      listening = ("Recently Played:" + ' ' + '"' + trackTitle + '"' + ' ' + 'by' + ' ' + trackArtist);
    } else {
      listening = ("Curently listening to" + ' ' + '"' + trackTitle + '"' + ' ' + 'by' + ' ' + trackArtist);
    }
    console.log(listening);
    /*downloadAlbumImage(trackCover, `trackCover.png`);*/
  });
  return listening;
}

// Download album cover
/* async function downloadAlbumImage(url, image_path) {
  await axios({
    url,
    responseType: 'arraybuffer',
  }).then(
    (response) =>
      new Promise((resolve, reject) => {
        resolve(sharp(response.data)
          .resize(50, 50)
          .toFile(image_path));
      })
  );
  console.log(`Downloading album cover...`);
}*/

// Additional credit text
let credit = 'This header image has been generated using special code by @sgitsp';

// Function to draw image
async function drawBanner() {
  const images = ['1500x500-default.png', '0.png', '1.png', '2.png', '3.png'];
  const promiseArray = [];
  const dayFont = await Jimp.loadFont('fonts/CaviarDreams_white-64.ttf.fnt');
  const timeFont = await Jimp.loadFont("fonts/Caviar_Dreams_Bold_64.fnt");
  const dateFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const monthFont = await Jimp.loadFont("fonts/CaviarDreams_white-32.ttf.fnt");
  const listeningFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
  images.forEach((image) => promiseArray.push(Jimp.read(image)));
  promiseArray.push(getRecentTrack());
  promiseArray.push(Jimp.loadFont(Jimp.FONT_SANS_16_WHITE));

  Promise.all(promiseArray).then(
    ([banner, imageOne, imageTwo, imageThree, imageFour, listening, font]) => {
      banner.composite(imageOne, 1064, 22);
      banner.composite(imageTwo, 1160, 88);
      banner.composite(imageThree, 1265, 40);
      banner.composite(imageFour, 1352, 118);
      console.log(`Recent followers added!`);
      banner.print(dayFont, 10, 0, {
        text: day,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1580, 159); // sunday
      banner.print(timeFont, 10, 0, {
        text: currentTime(new Date),
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1580, 253); // 14:12
      banner.print(monthFont, 10, 0, {
        text: date + ' ' + month + ' ' + year,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1580, 296); // 17 Januari 1996
      /*banner.print(monthFont, 10, 0, {
        text: month,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1580, 307); // January*/
      console.log(`Local time updated!`);
      banner.print(listeningFont, 0, 465, {
        text: listening,
        alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT
      }, 1445, 483);
      console.log(`Generating new header...`);
      console.log(`Last sync: ${day}, ${fullDate} (${currentTime(new Date)} UTC+7)`);
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

setInterval(currentTime, 60000); // time update every 1 min
setInterval(() => {
  getLatestFollowers();
}, 60000); // every 1 min 
