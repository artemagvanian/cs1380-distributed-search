global.nodeConfig = {
  ip: '10.128.0.3',
  port: 8080,
};

const distribution = require('../config.js');
const utils = require('./utils.js');
const natural = require('natural');
const nodeConfig = require('./node_config.json');

// const BASE_PORT = 7110;

distribution.node.start((server) => {
  const term = natural.PorterStemmer.stem(process.argv[2].replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase());
  const config = {gid: 'search'};
  const group = utils.mkGroupFromConfig(nodeConfig);
  distribution.local.groups
      .put(config, group, (e) => {
        utils.perror(e);

        const r = {service: 'search', method: 'queryTF'};
        distribution.search.comm.send([term], r, (e, tfs) => {
          if (e != {}) {
            for (const node in e) {
              global.distribution.util.log(`${node}: ${e[node]}`, 'error');
            }
          }
          const r = {service: 'search', method: 'queryIDF'};
          distribution.search.comm.send([term], r, (e, idfs) => {
            if (e != {}) {
              for (const node in e) {
                global.distribution.util.log(`${node}: ${e[node]}`, 'error');
              }
            }
            let nDocuments = 0;
            let nOccurrences = 0;
            for (const node in idfs) {
              const [documentsPerNode, occurrencesPerNode] = idfs[node];
              nDocuments += documentsPerNode;
              nOccurrences += occurrencesPerNode;
            }
            const results = {};
            for (const node in tfs) {
              for (const url in tfs[node]) {
                results[url] = tfs[node][url] * Math.log10(nDocuments / nOccurrences);
              }
            }
            const toDisplay = Object.entries(results).sort((a, b) => b[1] - a[1]);
            console.log(toDisplay);
            server.close();
          });
        });
      });
});
