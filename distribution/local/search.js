const {JSDOM} = require('jsdom');
const {URL} = require('url');
const https = require('https');
const {convert} = require('html-to-text');
const natural = require('natural');

function toWordStream(html) {
  return convert(html).replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().split(/\s+/).map((w) => natural.PorterStemmer.stem(w));
}

function findURLs(baseUrl, stringHtml, filterUrls) {
  if (baseUrl.endsWith('index.html')) {
    baseUrl = baseUrl.slice(0, baseUrl.length - 'index.html'.length);
  } else {
    baseUrl += '/';
  }

  const parsedHtml = new JSDOM(stringHtml);
  const anchors = parsedHtml.window.document.querySelectorAll('a[href]');
  const urls = [];
  for (const anchor of anchors) {
    try {
      const url = new URL(anchor.getAttribute('href'), baseUrl).toString();
      urls.push(url);
    } catch (e) {
      global.distribution.util.log(e, 'error');
    }
  }

  return urls.filter((url) => filterUrls.reduce((acc, elt) => acc || url.startsWith(elt), false));
}

function fetchURL(url, cb) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return cb(e);
  }

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

function computeTF(keys, cb) {
  const tf = {};

  const process = (i) => {
    if (i < keys.length) {
      global.distribution.local.store.get({gid: 'search', key: keys[i]}, (e, v) => {
        if (e == null) {
          const words = toWordStream(v);
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
        }
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

function queryTF(key, cb) {
  global.distribution.local.store.get({gid: 'search', key: 'tf'}, (e, tf) => {
    if (e != null) {
      global.distribution.util.log(e, 'error');
      cb(e);
    } else {
      if (key in tf) {
        cb(null, tf[key]);
      } else {
        cb(null, []);
      }
    }
  });
}

function computeIDF(keys, cb) {
  const idf = {};
  let n = 0;

  const process = (i) => {
    if (i < keys.length) {
      global.distribution.local.store.get({gid: 'search', key: keys[i]}, (e, v) => {
        if (e == null) {
          const words = toWordStream(v);
          for (const word of words) {
            if (!(word in idf)) {
              idf[word] = 0;
            }
            idf[word]++;
          }
          n++;
        }
        process(i + 1);
      });
    } else {
      global.distribution.local.store.put([n, idf], {gid: 'search', key: 'idf'}, (e) => {
        if (e != null) {
          global.distribution.util.log(e, 'error');
        }
        cb(null);
      });
    }
  };
  process(0);
}

function queryIDF(key, cb) {
  global.distribution.local.store.get({gid: 'search', key: 'idf'}, (e, [n, idf]) => {
    if (e != null) {
      global.distribution.util.log(e, 'error');
      cb(e);
    } else {
      if (key in idf) {
        cb(null, [n, idf[key]]);
      } else {
        cb(null, 0);
      }
    }
  });
}

module.exports = {findURLs, fetchURL, computeTF, queryTF, computeIDF, queryIDF};
