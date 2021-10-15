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

// Current dateTime Function
function currentTime() {
  var today = new Date();
  today.setUTCHours(today.getHours() + 7); // add 7 hour based on GMT+7 location
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
  /*console.log('Time now:', time, 'WIB')*/
  return [day, date, month, year, fullDate, fullTime, seconds];
}

// Function to get recent folowers
async function getLatestFollowers() {
  const data = await twitterClient.accountsAndUsers.followersList({
    screen_name: process.env.TWITTER_HANDLE,
    count: 4,
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
    drawBanner();
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
async function getRecentTrack() {
  let listening = ""
  await axios.get(process.env.LASTFM).then(response => {
    var latestTrack = response.data.recenttracks.track[0];
    // detect if the track has attributes associated with it
    var nowplaying = latestTrack["@attr"];
    let trackTitle = latestTrack.name;
    let trackArtist = latestTrack.artist["#text"];
    let trackCover = latestTrack.image[3]["#text"];
    
    // if nowplaying attr is undefined
    if (typeof nowplaying === 'undefined') {
      listening = ("Recently Played:" + ' ' + '"' + trackTitle + '"' + ' ' + 'by' + ' ' + trackArtist);
    } else {
      listening = ("Curently listening to" + ' ' + '"' + trackTitle + '"' + ' ' + 'by' + ' ' + trackArtist);
    }
    console.log('Get recent track...');
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
  const [day, date, month, year, fullDate, fullTime, seconds] = currentTime();
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
      console.log(`Generating new header...`);
      banner.composite(imageOne, 1008, 113);
      banner.composite(imageTwo, 1092, 217);
      banner.composite(imageThree, 1200, 154);
      banner.composite(imageFour, 1284, 258);
      console.log(`Recent followers added!`);
      banner.print(dayFont, 0, 0, {
        text: day, // sunday
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 159);
      banner.print(timeFont, 0, 0, {
        text: fullTime,  // 14:12 WIB
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 253);
      banner.print(monthFont, 0, 0, {
        text: date + ' ' + month + ' ' + year, // 17 Januari 1996
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 296); 
      /*banner.print(monthFont, 10, 0, {
        text: month,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1580, 307); // January*/
      console.log(`Local time updated!`);
      banner.print(listeningFont, 0, 0, {
        text: listening,
        alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1445, 483);
      console.log(listening);
      console.log(`Last sync: ${day} ${fullDate} | ${fullTime}:${seconds} (UTC+7)`);
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
// Set interval
//setInterval(currentTime, 60000); // every 1 min
setInterval(() => {
  getLatestFollowers();
  currentTime();
}, 120000); // every 2 min 
