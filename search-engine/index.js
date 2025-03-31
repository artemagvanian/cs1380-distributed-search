const readline = require('readline');
const distribution = require('../config.js');
const utils = require('./utils.js');

const BASE_PORT = 7110;

function countMap(_, value, cb) {
  const words = global.distribution.local.search.convertToText(value);
  const wordMap = {};
  for (const word of words) {
    if (!(word in wordMap)) {
      wordMap[word] = 1;
    }
  }
  const wordCounts = [];
  for (const word in wordMap) {
    const o = {};
    o[word] = wordMap[word];
    wordCounts.push(o);
  }
  cb(wordCounts);
};

function countReduce(key, values, cb) {
  const o = {};
  o[key] = values.reduce((acc, elt) => acc + elt);
  cb(o);
};

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
          distribution.search.mr.exec(
              {keys: urls, map: countMap, reduce: countReduce},
              (e, wordCounts) => {
                utils.perror(e);
                const numDocuments = urls.length;
                const idf = {};
                for (const entry of wordCounts) {
                  const word = Object.keys(entry)[0];
                  idf[word] = Math.log10(numDocuments / entry[word]);
                }
                distribution.local.store.put(idf, {key: 'idf', gid: 'search'}, (e) => {
                  utils.perror(e);
                  const r = {service: 'search', method: 'computeTF'};
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
