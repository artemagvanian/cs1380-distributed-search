const distribution = require('../config.js');
const util = distribution.util;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const BASE_PORT = 7110;
const START_URL = 'https://cs.brown.edu/courses/csci1380/sandbox/3/';

function perror(e) {
  if (e != null) {
    global.distribution.util.log(e, 'error');
  }
}

function mkGroup(n) {
  const nodes = [];
  for (let i = 0; i < n; i++) {
    nodes.push({ip: '127.0.0.1', port: BASE_PORT + i});
  }

  const group = {};
  for (const node of nodes) {
    group[util.id.getSID(node)] = node;
  }

  return [nodes, group];
}

function spawn(nodes, cb) {
  if (nodes.length != 0) {
    distribution.local.status.spawn(nodes[0], (e) => {
      perror(e);
      spawn(nodes.slice(1), cb);
    });
  } else {
    cb();
  }
}

function stop(nodes, cb) {
  if (nodes.length != 0) {
    const remote = {service: 'status', method: 'stop'};
    remote.node = nodes[0];
    distribution.local.comm.send([], remote, (e) => {
      perror(e);
      stop(nodes.slice(1), cb);
    });
  } else {
    cb();
  }
}

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
    perror(e);
    if (idx + 1 == dataset.length) {
      cb();
    } else {
      store(dataset, cb, idx + 1);
    }
  });
}

function crawl(dataset, cb, total = []) {
  if (total.length == 0) {
    total = dataset;
  }
  distribution.search.mr.exec({keys: dataset.map((o) => Object.keys(o)[0]), map, reduce}, (e, v) => {
    perror(e);
    if (Object.keys(v).length != 0) {
      total.push(...v);
      crawl(v, cb, total);
    } else {
      cb(total);
    }
  });
};

distribution.node.start((server) => {
  const config = {gid: 'search'};
  const [nodes, group] = mkGroup(3);
  spawn(nodes, () => {
    distribution.local.groups
        .put(config, group, (e) => {
          perror(e);
          distribution.local.search.fetchURL(START_URL, (e, urlData) => {
            perror(e);

            const datum = {};
            datum[START_URL] = urlData;
            const dataset = [datum];

            store(dataset, () => {
              crawl(dataset, (total) => {
                console.log(`crawled ${total.length} items`);
                stop(nodes, () => {
                  server.close();
                });
              });
            });
          });
        });
  });
});
