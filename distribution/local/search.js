const {JSDOM} = require('jsdom');
const {URL} = require('url');
const https = require('https');

function findURLs(baseUrl, stringHtml) {
  if (baseUrl.endsWith('index.html')) {
    baseUrl = baseUrl.slice(0, baseUrl.length - 'index.html'.length);
  } else {
    baseUrl += '/';
  }

  const parsedHtml = new JSDOM(stringHtml);
  const anchors = parsedHtml.window.document.querySelectorAll('a[href]');
  const urls = [];
  for (const anchor of anchors) {
    urls.push(new URL(anchor.getAttribute('href'), baseUrl).toString());
  }

  return urls;
}

function fetchURL(url, cb) {
  const parsedUrl = new URL(url);

  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname,
  };

  const req = https.get(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      cb(null, data);
    });
  });

  req.on('error', (error) => {
    cb(error);
  });

  req.end();
}

module.exports = {findURLs, fetchURL};
