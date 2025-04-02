const readline = require('readline');
const distribution = require('../config.js');
const utils = require('./utils.js');

const BASE_PORT = 7110;

const rl = readline.createInterface({
  input: process.stdin,
});

const urls = [];
rl.on('line', (line) => {
  urls.push(line);
});

rl.on('close', () => {
  distribution.node.start((server) => {
    const config = {gid: 'search'};
    const group = utils.mkGroup(3, BASE_PORT);
    distribution.local.groups
        .put(config, group, (e) => {
          utils.perror(e);
          distribution.local.store.put(urls.length, {key: 'n', gid: 'search'}, (e) => {
            utils.perror(e);
            const r = {service: 'search', method: 'computeTF'};
            distribution.search.comm.send([urls], r, (e) => {
              if (e != {}) {
                for (const node in e) {
                  global.distribution.util.log(`${node}: ${e[node]}`, 'error');
                }
              }
              const r = {service: 'search', method: 'computeIDF'};
              distribution.search.comm.send([urls], r, (e) => {
                if (e != {}) {
                  for (const node in e) {
                    global.distribution.util.log(`${node}: ${e[node]}`, 'error');
                  }
                }
                server.close();
              });
            });
          });
        });
  });
});
