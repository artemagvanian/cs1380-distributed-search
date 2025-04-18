global.nodeConfig = {
  ip: '10.128.0.3',
  port: 8080,
};

const readline = require('readline');
const distribution = require('../config.js');
const utils = require('./utils.js');
const nodeConfig = require('./node_config.json');

// const BASE_PORT = 7110;

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
    const group = utils.mkGroupFromConfig(nodeConfig);
    distribution.local.groups
        .put(config, group, (e) => {
          utils.perror(e);
          global.distribution.util.log('computing tf');
          const r = {service: 'search', method: 'computeTF'};
          distribution.search.comm.send([urls], r, (e) => {
            if (e != {}) {
              for (const node in e) {
                global.distribution.util.log(`${node}: ${e[node]}`, 'error');
              }
            }
            global.distribution.util.log('computing idf');
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
