const keepAlive = require('./server');
//import keepAlive from './server.js';
// Import all the packages
const dotenv = require('dotenv').config();
//import dotenv from 'dotenv';
//dotenv.config();
const { TwitterClient } = require('twitter-api-client');
//import { TwitterClient } from 'twitter-api-client';
const axios = require('axios');
//import axios from 'axios';
const fs = require('fs');
//import fs from 'fs';
const Jimp = require('jimp');
//import Jimp from 'jimp';
const sharp = require('sharp');
//import sharp from 'sharp';

// Twitter Auth Credential
const twitterClient = new TwitterClient({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  accessToken: process.env.CONSUMER_KEY,
  accessTokenSecret: process.env.CONSUMER_SECRET,
});

// Current dateTime function
const timezone = 8; // add 7 based on GMT+7 location

function currentTime() {
  var today = new Date();
  today.setUTCHours(today.getHours() + timezone);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["- S u n -", "- M o n -", "- T u e -", "- W e d -", "- T h u -", "- F r i -", "- S a t -"];

  let day = days[today.getDay()];
  let date = today.getDate();
  let month = months[today.getMonth()];
  let year = today.getFullYear();
  let fullDate = today.getDate() + " " + month + " " + today.getFullYear();

  let hours = ("0" + today.getHours()).slice(-2);
  let minutes = ("0" + today.getMinutes()).slice(-2);
  let seconds = ("0" + today.getSeconds()).slice(-2);
  let fullTime = hours + ':' + minutes;

  return [day, date, month, year, fullDate, fullTime, seconds];
}

// Greeting text function
async function hello() {
  let helloText = "";

  var today = new Date();
  today.setUTCHours(today.getHours() + timezone);
  const h = today.getHours();
  const helloTypes = ["Wake up,", "Hi, there..", "", "Hi, have a", "Zzzz... (-. -)", "Wayahe..."];

  if (h >= 4 && h < 6) {helloText = helloTypes[0];} // Wake up, Ealy Bird..
  else if (h >= 6 && h < 10) {helloText = helloTypes[1];} // Hi, there.. G' Morning!
  else if (h >= 10 && h < 15) {helloText = helloTypes[2];} // Fine afternoon..
  else if (h >= 15 && h < 19) {helloText = helloTypes[3];} // Hi, have a nice evening.
  else if (h >= 19 && h < 21) {helloText = helloTypes[2];} // Nighty Night!
  else if (h >= 21 && h < 24) {helloText = helloTypes[4];} // Zzzz... Nighty night!
  else helloText = helloTypes[5]; // Wayahe... Lingsir wengi~

  return helloText;
}

async function greeting() {
  let greetingText = "";

  var today = new Date();
  today.setUTCHours(today.getHours() + timezone);
  const h = today.getHours();
  const greetingTypes = ["Early Bird..", "G' Morning!", "Fine afternoon..", "Nice Evening", "Nighty Night!", "Lingsir wengi~"];

  if (h >= 4 && h < 6) {greetingText = greetingTypes[0];} // Early Bird
  else if (h >= 6 && h < 10) {greetingText = greetingTypes[1];} // G' Morning!
  else if (h >= 10 && h < 15) {greetingText = greetingTypes[2];} // Fine afternoon..
  else if (h >= 15 && h < 19) {greetingText = greetingTypes[3];} // Nice Evening.
  else if (h >= 19 && h < 24) {greetingText = greetingTypes[4];} // Nighty Night!
  else greetingText = greetingTypes[5]; // Lingsir wengi~

  return greetingText;
}

// Function to get recent folowers
async function getLatestFollowers() {
  const data = await twitterClient.accountsAndUsers.followersList({
    screen_name: process.env.TWITTER_HANDLE,
    count: 5,
  });
  console.log(`Fetch recent followers...`);

  // Downloading avatar image...
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
    downloadAlbumImage();
  });
  console.log(`Downloading avatar...`);
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
          .grayscale()
          .resize(96, 96)
          .composite([{
            input: circleShape,
            blend: 'dest-in'
          }])
          .toFile(image_path));
      })
  );
  console.log(`Resizing avatar...`);
}

// Function to crop image
const width = 96,
  r = width / 2,
  circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);

// Fetch recent track from LastFM
async function getLastFm() {
  const response = await axios.get(process.env.LASTFM);
  return response;
}

// Get nowPlaying status
async function nowPlaying() {
  let nowPlaying = ""
  await getLastFm()
  .then(response => {
    var latestTrack = response.data.recenttracks.track[0];
    // detect if the track has attributes associated with it
    var np = latestTrack["@attr"];
    // if nowplaying attr is undefined
    if (typeof np === 'undefined') {
      nowPlaying = ("Recently Played");
    } else {
      nowPlaying = ("Curently Listening");
    }
  })
  .catch(err => console.log(err))
  return nowPlaying;
}

// Get recent song title
async function getRecentTitle() {
  let trackTitle = ""
  await getLastFm()
  .then(response => {
    var latestTrack = response.data.recenttracks.track[0];
    trackTitle = latestTrack.name;
  })
  .catch(err => console.log(err))
  console.log('Get recent title...'); 
  return trackTitle;
}

// Get recent song artist
async function getRecentArtist() {
  let trackArtist = ""
  await getLastFm()
  .then(response => {
    var latestTrack = response.data.recenttracks.track[0];
    trackArtist = latestTrack.artist["#text"];
  })
  .catch(err => console.log(err))
  console.log('Get recent artist...'); 
  return trackArtist;
}

// Download album image
async function downloadAlbumImage() {
  await getLastFm()
  .then(response => {
    var latestTrack = response.data.recenttracks.track[0];
    const trackCover = latestTrack.image[3]["#text"];

    axios({
      url: trackCover,
      responseType: 'arraybuffer',
    }).then(
      (response) =>
        new Promise((resolve, reject) => {
          resolve(sharp(response.data)
            .grayscale()
            .resize(50, 50)
            .toFile(`trackCover.png`));
        })
    ).then(() => {
      drawBanner();
    });
  })
  console.log(`Downloading album cover...`);
}

// Additional credit text
let credit = 'This header image has been generated using special code by @sgitsp';

// Function to draw image
async function drawBanner() {
  const [day, date, month, year, fullDate, fullTime, seconds] = currentTime();
  const images = ['1500x500-default.png', '0.png', '1.png', '2.png', '3.png', '4.png', 'trackCover.png'];
  const promiseArray = [];
  const dayFont = await Jimp.loadFont('fonts/CaviarDreams_white-64.ttf.fnt');
  const timeFont = await Jimp.loadFont("fonts/Caviar_Dreams_Bold_64.fnt");
  const dateFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const monthFont = await Jimp.loadFont("fonts/CaviarDreams_white-32.ttf.fnt");
  const nowPlayingFont = await Jimp.loadFont("fonts/CaviarDreams_white-16.fnt");
  // const listeningFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
  const listeningFont = await Jimp.loadFont("fonts/CaviarDreamsBold_white-16.fnt");
  images.forEach((image) => promiseArray.push(Jimp.read(image)));
  promiseArray.push(hello());
  promiseArray.push(greeting());
  promiseArray.push(nowPlaying());
  promiseArray.push(getRecentTitle());
  promiseArray.push(getRecentArtist());
  promiseArray.push(Jimp.loadFont(Jimp.FONT_SANS_16_WHITE));

  Promise.all(promiseArray).then(
    ([banner, imageOne, imageTwo, imageThree, imageFour, imageFive, imageAlbum, hello, greeting, nowPlaying, trackTitle, trackArtist]) => {
      banner.composite(imageOne, 1032, 157);
      banner.composite(imageTwo, 1154, 157);
      banner.composite(imageThree, 1274, 157);
      banner.composite(imageFour, 1099, 266);
      banner.composite(imageFive, 1215, 266);
      banner.composite(imageAlbum, 1435, 435);
      console.log(`Recent followers added!`);
      banner.print(monthFont, 138, 0, {
        text: hello,
        alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 210);
      banner.print(dayFont, 136, 0, {
        text: greeting,
        alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 280);
      console.log(hello + ' ' + greeting);
      banner.print(dayFont, 0, 0, {
        text: day, // sunday
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 198);
      banner.print(timeFont, 0, 0, {
        text: fullTime,  // 14:12 WIB
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 295);
      banner.print(monthFont, 0, 0, {
        text: date + ' ' + month + ' ' + year, // 17 Januari 1996
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 344);
      /*banner.print(monthFont, 10, 0, {
        text: month,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1580, 307); // January*/
      console.log(`Local time updated!`);
      banner.print(nowPlayingFont, 0, 0, {
        text: nowPlaying,
        alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1385, 416);
      banner.print(listeningFont, 0, 0, {
        text: trackTitle,
        alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1424, 459);
      banner.print(listeningFont, 0, 0, {
        text: trackArtist,
        alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1424, 479);
      console.log(nowPlaying + ' ' + '"' + trackTitle + '"' + ' ' + 'by' + ' ' + trackArtist);
      console.log(`Last sync: ${day} ${fullDate} | ${fullTime}:${seconds} (UTC+${timezone})`);
      banner.write('1500x500-draw.png', function() {
        if (process.env.NODE_ENV === 'production') {
          uploadBanner();
        };
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
keepAlive(); // for webserver
getLatestFollowers(); // for bot trigger

// Set loop interval
setInterval(() => {
  getLatestFollowers();
  currentTime();
}, 60000); // every 1 min (60000)

/* ---------------------------------
every min interval in milliseconds
1.0 = 60000
1.7 = 102000
2.5 = 150000
2.7 = 162000
2.9 = 174000
3.0 = 180000
  --------------------------------- */
