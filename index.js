const axios = require('axios');
const cheerio = require('cheerio');
const Fs = require('fs');
const Path = require('path')

const url = "https://listenaminute.com";

const downloadFile = async (path) => {
  try {
    const subUrl = `${url}/${path[0]}/${path}`;
    const res = await axios({
      url: subUrl,
      method: 'GET',
      responseType: 'stream'
    });
    return res.data.pipe(Fs.createWriteStream(
      Path.resolve(__dirname, 'data', path)
    ))
  } catch (err) {
    console.log('Failed: ', path);
  }
}
downloadFile('refugees.mp3');

const getFileNameFromLink = async (link) => {
  try {
    const res = await axios.get(`${url}/${link}`);
    const html = res.data;
    const $ = cheerio.load(html);
    const links = $('div.audio > audio > source');

    return $(links[0]).attr('src');
  } catch (err) {
    console.log('Failed: ', `${url}/${link}`);
  }
}

axios.get(url).then(async (res) => {
  const html = res.data;
  const $ = cheerio.load(html);
  const links = $('table > tbody > tr a');
  const linkTails = [];
  links.each(function () {
    const text = $(this).text();
    linkTails.push($(this).attr('href'));
  });
  await linkTails.reduce((rs, link) => rs.then(async () => {
    const path = await getFileNameFromLink(link);
    if (path) {
      await downloadFile(path)
    }
  }), Promise.resolve())
}).catch(err => console.log(err))