const axios = require('axios');
const cheerio = require('cheerio');
const Fs = require('fs');
const Path = require('path')

const URL = 'https://www.rong-chang.com/speak/';

const downloadFile = async (url) => {
  try {
    console.log(3, url);
    if (!url) return;
    const res = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    const paths = url.split('/');
    const fileName = paths[paths.length - 1];
    console.log(Path.resolve(__dirname, 'data', fileName));
    return res.data.pipe(Fs.createWriteStream(
      Path.resolve(__dirname, 'data', fileName)
    ))
  } catch (err) {
    console.log('Failed: ', url);
  }
}
// downloadFile('refugees.mp3');

const crawlerDetailPage = async (url) => {
  try {
    const res = await axios.get(url);
    const html = res.data;
    const $ = cheerio.load(html);
    const links = $('p.MsoNormal audio#audio');

    return $(links[0]).attr('src').slice(3);
  } catch (err) {
    console.log('Failed: ', url);
  }
}

const crawlSubListWebsite = async (url) => {
  try {
    console.log(1, url);
    if (!url) return;
    const res = await axios.get(url);
    const html = res.data;
    const $ = cheerio.load(html);
    const links = $('p.MsoNormal a');
    const linkTails = [];
    links.each(function () {
      const text = $(this).text();
      linkTails.push($(this).attr('href'));
    });
    const linkFiles = await Promise.all(linkTails.map((link) => crawlerDetailPage(URL + link)));
    for (const linkFile of linkFiles) {
      await downloadFile(URL + linkFile);
    }
  } catch (error) {
    console.log(error);
  }
}

const crawlWebsite = async (url) => {
  try {
    console.log(0, url);
    const res = await axios.get(url);
    const html = res.data;
    const $ = cheerio.load(html);
    const links = $('p.MsoNormal a');
    const linkTails = [];
    links.each(function () {
      const text = $(this).text();
      linkTails.push($(this).attr('href'));
    });
    await linkTails.reduce((rs, link) => rs.then(res => crawlSubListWebsite(url + link)), Promise.resolve())
  } catch (error) {
    console.log(error);
  }
}

crawlWebsite(URL);