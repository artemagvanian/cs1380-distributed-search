const distribution = require('../config.js');
const utils = require('./utils.js');
const natural = require('natural');

const BASE_PORT = 7110;

distribution.node.start((server) => {
  const term = natural.PorterStemmer.stem(process.argv[2].replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase());
  const config = {gid: 'search'};
  const group = utils.mkGroup(3, BASE_PORT);
  distribution.local.groups
      .put(config, group, (e) => {
        utils.perror(e);
        distribution.local.store.get({key: 'idf', gid: 'search'}, (e, idf) => {
          utils.perror(e);
          const r = {service: 'search', method: 'queryTF'};
          distribution.search.comm.send([term], r, (e, tfs) => {
            if (e != {}) {
              for (const node in e) {
                global.distribution.util.log(`${node}: ${e[node]}`, 'error');
              }
            }
            const results = {};
            for (const node in tfs) {
              for (const url in tfs[node]) {
                results[url] = tfs[node][url] / idf[term];
              }
            }
            const toDisplay = Object.entries(results).sort((a, b) => b[1] - a[1]);
            console.log(toDisplay);
            server.close();
          });
        });
      });
});
