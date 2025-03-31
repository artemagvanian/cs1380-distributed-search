const {JSDOM} = require('jsdom');
const {URL} = require('url');
const https = require('https');
const {convert} = require('html-to-text');
const natural = require('natural');

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

function convertToText(html) {
  return convert(html).replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().split(/\s+/).map((w) => natural.PorterStemmer.stem(w));
}

function computeTF(keys, cb) {
  const tf = {};

  const process = (i) => {
    if (i < keys.length) {
      global.distribution.local.store.get({gid: 'search', key: keys[i]}, (_, v) => {
        const words = convertToText(v);
        const nw = words.length;

        Object.entries(words.reduce((acc, elt) => {
          if (elt in acc) {
            acc[elt]++;
          } else {
            acc[elt] = 1;
          }
          return acc;
        }, {})).forEach(([word, freq]) => {
          if (!(word in tf)) {
            tf[word] = {};
          }
          tf[word][keys[i]] = freq / nw;
        });
        process(i + 1);
      });
    } else {
      global.distribution.local.store.put(tf, {gid: 'search', key: 'tf'}, (e) => {
        if (e != null) {
          global.distribution.util.log(e, 'error');
        }
        cb(null);
      });
    }
  };

  process(0);
}

module.exports = {findURLs, fetchURL, convertToText, computeTF};
