const distribution = require('../config.js');
const util = distribution.util;

let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

const crawlGroup = {};
crawlGroup[util.id.getSID(n1)] = n1;
crawlGroup[util.id.getSID(n2)] = n2;
crawlGroup[util.id.getSID(n3)] = n3;

distribution.node.start((server) => {
  localServer = server;
  const crawlConfig = {gid: 'crawl'};
  distribution.local.status.spawn(n1, (e, v) => {
    distribution.local.status.spawn(n2, (e, v) => {
      distribution.local.status.spawn(n3, (e, v) => {
        distribution.local.groups
            .put(crawlConfig, crawlGroup, (e, v) => {
              const mapper = (key, value, cb) => {
                const urls = global.distribution.local.search.findURLs(key, value);
                const os = urls.map((url) => {
                  const o = {};
                  o[url] = '';
                  return o;
                });
                cb(os);
              };

              const reducer = (key, values, cb) => {
                global.distribution.local.store.get({gid: 'crawl', key}, (e, v) => {
                  if (e != null) {
                    global.distribution.local.search.fetchURL(key, (e, v) => {
                      if (e == null) {
                        global.distribution.local.store.put(v, {gid: 'crawl', key}, (e, v) => {
                          const o = {};
                          o[key] = '';
                          cb(o);
                        });
                      }
                    });
                  } else {
                    cb({});
                  }
                });
              };

              distribution.local.search.fetchURL('https://cs.brown.edu/courses/csci1380/sandbox/1/', (e, v) => {
                if (e != null) {
                  console.error(e);
                }

                let dataset = [
                  {'https://cs.brown.edu/courses/csci1380/sandbox/1/': v},
                ];

                const doMapReduce = () => {
                  distribution.crawl.mr.exec({keys: dataset.map((e) => Object.keys(e)[0]), map: mapper, reduce: reducer}, (e, v) => {
                    dataset = v;
                    if (Object.keys(dataset).length != 0) {
                      doMapReduce();
                    } else {
                      const remote = {service: 'status', method: 'stop'};
                      remote.node = n1;
                      distribution.local.comm.send([], remote, (e, v) => {
                        remote.node = n2;
                        distribution.local.comm.send([], remote, (e, v) => {
                          remote.node = n3;
                          distribution.local.comm.send([], remote, (e, v) => {
                            localServer.close();
                          });
                        });
                      });
                    }
                  });
                };

                let cntr = 0;

                dataset.forEach((o) => {
                  const key = Object.keys(o)[0];
                  const value = o[key];
                  distribution.crawl.store.put(value, key, (e, v) => {
                    cntr++;
                    if (cntr === dataset.length) {
                      doMapReduce();
                    }
                  });
                });
              });
            });
      });
    });
  });
});
