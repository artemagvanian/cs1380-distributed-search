const distribution = require('../config.js');
const utils = require('./utils.js');

const BASE_PORT = 7110;
const START_URL = process.argv[2];

// https://cs.brown.edu/courses/csci1380/sandbox/3

function map(key, value, cb) {
  const urls = global.distribution.local.search.findURLs(key, value);
  const os = urls.map((url) => {
    const o = {};
    o[url] = '';
    return o;
  });
  cb(os);
};

function reduce(key, _, cb) {
  function perror(e) {
    if (e != null) {
      global.distribution.util.log(e, 'error');
    }
  }
  global.distribution.local.store.get({gid: 'search', key}, (e) => {
    if (e != null) {
      global.distribution.local.search.fetchURL(key, (e, v) => {
        perror(e);
        global.distribution.local.store.put(v, {gid: 'search', key}, (e) => {
          perror(e);
          const o = {};
          o[key] = '';
          cb(o);
        });
      });
    } else {
      cb({});
    }
  });
};

function store(dataset, cb, idx = 0) {
  const o = dataset[idx];
  const key = Object.keys(o)[0];
  const value = o[key];
  distribution.search.store.put(value, key, (e) => {
    utils.perror(e);
    if (idx + 1 == dataset.length) {
      cb();
    } else {
      store(dataset, cb, idx + 1);
    }
  });
}

function crawl(dataset, cb, total = []) {
  if (total.length == 0) {
    total = utils.getKeys(dataset);
  }
  distribution.search.mr.exec({keys: dataset.map((o) => Object.keys(o)[0]), map, reduce}, (e, v) => {
    utils.perror(e);
    if (Object.keys(v).length != 0) {
      total.push(...utils.getKeys(v));
      crawl(v, cb, total);
    } else {
      cb(total);
    }
  });
};

distribution.node.start((server) => {
  const config = {gid: 'search'};
  const group = utils.mkGroup(3, BASE_PORT);
  distribution.local.groups
      .put(config, group, (e) => {
        utils.perror(e);
        distribution.local.search.fetchURL(START_URL, (e, urlData) => {
          utils.perror(e);

          const datum = {};
          datum[START_URL] = urlData;
          const dataset = [datum];

          store(dataset, () => {
            crawl(dataset, (total) => {
              for (const item of total) {
                console.log(item);
              }
              server.close();
            });
          });
        });
      });
});
