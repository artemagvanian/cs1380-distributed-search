const distribution = require('../config.js');
const utils = require('./utils.js');

const BASE_PORT = 7110;
const START_URL = process.argv[2];
const FILTER_URLS = process.argv[3];

function mapStencil(key, value, cb) {
  const urls = global.distribution.local.search.findURLs(key, value, FILTER_URLS);
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

function crawl(dataset, cb) {
  const urls = utils.getKeys(dataset);
  for (const item of urls) {
    console.log(item);
  }

  const serializedMap = global.distribution.util.serialize(mapStencil).replace('FILTER_URLS', FILTER_URLS);
  const map = global.distribution.util.deserialize(serializedMap);

  distribution.search.mr.exec({keys: urls, map, reduce}, (e, v) => {
    utils.perror(e);
    if (Object.keys(v).length != 0) {
      crawl(v, cb);
    } else {
      cb();
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
            crawl(dataset, () => {
              server.close();
            });
          });
        });
      });
});
