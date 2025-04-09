global.nodeConfig = {
  ip: '10.128.0.3',
  port: 8080,
};

const distribution = require('../config.js');
const utils = require('./utils.js');
const nodeConfig = require('./node_config.json');

const START_URL = process.argv[2];
const FILTER_URLS = process.argv[3];

function makeMap() {
  function mapStencil(key, value, cb) {
    const urls = global.distribution.local.search.findURLs(key, value, FILTER_URLS);
    const os = urls.map((url) => {
      const o = {};
      o[url] = '';
      return o;
    });
    cb(os);
  };

  const serializedMap = global.distribution.util.serialize(mapStencil).replace('FILTER_URLS', FILTER_URLS);
  return global.distribution.util.deserialize(serializedMap);
}


function reduce(key, _, cb) {
  global.distribution.local.store.get({gid: 'search', key}, (e) => {
    if (e != null) {
      global.distribution.local.search.fetchURL(key, (e, v) => {
        if (e != null) {
          cb({});
        } else {
          global.distribution.local.store.put(v, {gid: 'search', key}, (e) => {
            if (e == null) {
              const o = {};
              o[key] = '';
              cb(o);
            } else {
              cb({});
            }
          });
        }
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

  distribution.search.mr.exec({keys: urls, map: makeMap(), reduce}, (e, v) => {
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
  const group = utils.mkGroupFromConfig(nodeConfig);
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
