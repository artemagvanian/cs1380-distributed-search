const cheerio = require('cheerio');
const {URL} = require('url');
const {convert} = require('html-to-text');
const natural = require('natural');
const normalizeUrl = require('normalize-url');

function toWordStream(html) {
  return convert(html).replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().split(/\s+/).map((w) => natural.PorterStemmer.stem(w));
}

function findURLs(baseUrl, stringHtml, filterUrls) {
  const $ = cheerio.load(stringHtml);
  const anchors = $('a');

  const urls = [];
  for (const anchor of anchors) {
    try {
      const url = normalizeUrl(new URL($(anchor).attr('href'), baseUrl).toString(), {
        forceHttps: true,
        stripHash: true,
        removeDirectoryIndex: true,
      });
      if (filterUrls.reduce((acc, elt) => acc || url.startsWith(elt), false)) {
        urls.push(url);
      }
    } catch (e) {
      global.distribution.util.log(e, 'error');
    }
  }

  return urls;
}

function fetchURL(url, cb) {
  const MAX_RETRIES = 3;
  const fetchWithRetries = (retries = 0) => {
    fetch(url).then((res) => {
      return res.text();
    }, (e) => {
      if (retries < MAX_RETRIES) {
        setTimeout(() => fetchWithRetries(retries + 1), 100 * Math.pow(2, retries));
      } else {
        cb(e);
      }
    }).then((data) => {
      cb(null, data);
    }, (e) => {
      if (retries < MAX_RETRIES) {
        setTimeout(() => fetchWithRetries(retries + 1), 100 * Math.pow(2, retries));
      } else {
        cb(e);
      }
    });
  };
  fetchWithRetries();
}

function computeTF(keys, cb) {
  const tf = {};

  let processed = 0;
  const DISPLAY_RATE = 1000;
  const promises = [];

  for (const key of keys) {
    promises.push(new Promise((resolve) => {
      global.distribution.local.store.get({gid: 'search', key}, (e, v) => {
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
            tf[word][key] = freq / nw;
          });
        }
        processed++;
        if (processed % DISPLAY_RATE == 0 || processed == keys.length) {
          global.distribution.util.log(`tf: processed ${processed} out of ${keys.length} documents`);
        }
        resolve();
      });
    }));
  }

  Promise.allSettled(promises).then(() => {
    global.distribution.local.store.put(tf, {gid: 'search', key: 'tf'}, (e) => {
      if (e != null) {
        global.distribution.util.log(e, 'error');
      }
      cb(null);
    });
  });
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

  let processed = 0;
  const DISPLAY_RATE = 1000;
  const promises = [];

  for (const key of keys) {
    promises.push(new Promise((resolve) => {
      global.distribution.local.store.get({gid: 'search', key}, (e, v) => {
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
        processed++;
        if (processed % DISPLAY_RATE == 0 || processed == keys.length) {
          global.distribution.util.log(`idf: processed ${processed} out of ${keys.length} documents`);
        }
        resolve();
      });
    }));
  }

  Promise.allSettled(promises).then(() => {
    global.distribution.local.store.put([n, idf], {gid: 'search', key: 'idf'}, (e) => {
      if (e != null) {
        global.distribution.util.log(e, 'error');
      }
      cb(null);
    });
  });
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
