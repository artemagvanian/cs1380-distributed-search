/** @typedef {import("../types").Callback} Callback */

/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {any} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @callback Reducer
 * @param {any} key
 * @param {Array} value
 * @returns {object}
 */

/**
 * @typedef {Object} MRConfig
 * @property {Mapper} map
 * @property {Reducer} reduce
 * @property {string[]} keys
 */


global.mrStatus = {};

/*
  Note: The only method explicitly exposed in the `mr` service is `exec`.
  Other methods, such as `map`, `shuffle`, and `reduce`, should be dynamically
  installed on the remote nodes and not necessarily exposed to the user.
*/

function mr(config) {
  const context = {
    gid: config.gid || 'all',
  };

  /**
   * @param {MRConfig} configuration
   * @param {Callback} cb
   * @return {void}
   */
  function exec(configuration, cb = () => { }) {
    const mrService = {};

    const mrServiceName = 'mr-' + Math.random().toString(36).substring(2);

    mrService.worker = (config, callback) => {
      if (config.message != 'receive') {
        global.distribution.util.log(`worker received message ${config.message}`);
      }

      callback(null);

      const message = config.message;
      if (message == 'map') {
        const keys = config.keys;
        const func = config.func;
        const coordinator = config.coordinator;
        const serviceName = config.serviceName;
        const gid = config.gid;

        const requests = [];

        for (let i = 0; i < keys.length; i++) {
          requests.push(new Promise((resolve, reject) => {
            global.distribution.local.store.get({key: keys[i], gid}, (e, v) => {
              if (e == null) {
                try {
                  func(keys[i], v, (r) => {
                    resolve(r);
                  });
                } catch (e) {
                  reject(new Error('map failed'));
                }
              } else {
                reject(new Error('file not found'));
              }
            });
          }));
        }

        Promise.allSettled(requests).then((result) => {
          const processed = result.flatMap((r) => r.status == 'fulfilled' ? r.value : []);
          global.distribution.local.store.put(processed, {key: serviceName + 'mapped', gid}, (e) => {
            if (e != null) {
              global.distribution.util.log(e, 'error');
            }
            const r = {node: coordinator, service: serviceName, method: 'coordinator'};
            global.distribution.local.comm.send([
              {
                message: 'doneMapping',
                node: global.nodeConfig,
                serviceName,
              }], r, (e) => {
              if (e != null) {
                global.distribution.util.log(e, 'error');
              }
              global.distribution.util.log(`worker done mapping; mapped ${processed.length} items`);
            });
          });
        });
      } else if (message == 'shuffle') {
        const nodes = config.nodes;
        const coordinator = config.coordinator;
        const serviceName = config.serviceName;
        const gid = config.gid;

        new Promise((resolve, reject) => {
          global.distribution.local.store.get({key: serviceName + 'mapped', gid}, (e, mapped) => {
            if (e != null) {
              reject(e);
            } else {
              resolve(mapped);
            }
          });
        }).then((mapped) => {
          const entryToNode = new Map();
          for (const entry of mapped) {
            const [key, value] = Object.entries(entry)[0];
            const kid = global.distribution.util.id.getID(key);
            const nids = Object.values(nodes).map((node) => global.distribution.util.id.getNID(node));
            const node = nodes[global.distribution.util.id.rendezvousHash(kid, nids).substring(0, 5)];
            if (entryToNode.has(node)) {
              const entries = entryToNode.get(node);
              entries.push([key, value]);
              entryToNode.set(node, entries);
            } else {
              entryToNode.set(node, [[key, value]]);
            }
          }
          return Promise.resolve([...entryToNode.entries()]);
        }).then((entryToNodeEntries) => {
          const requests = [];
          for (let i = 0; i < entryToNodeEntries.length; i++) {
            const [node, entries] = entryToNodeEntries[i];
            const message = [{entries, serviceName, gid, message: 'receive'}];
            const remote = {node, service: serviceName, method: 'worker'};
            requests.push(new Promise((resolve) => {
              global.distribution.local.comm.send(message, remote, (e) => {
                if (e != null) {
                  global.distribution.util.log(e, 'error');
                }
                resolve();
              });
            }));
          }
          return Promise.all(requests);
        }).then(() => {
          global.distribution.local.store.del({key: serviceName + 'mapped', gid}, (e) => {
            if (e != null) {
              global.distribution.util.log(e, 'error');
            }
            const r = {node: coordinator, service: serviceName, method: 'coordinator'};
            global.distribution.local.comm.send([
              {
                message: 'doneShuffling',
                node: global.nodeConfig,
                serviceName: config.serviceName,
              }], r, (e) => {
              if (e != null) {
                global.distribution.util.log(e, 'error');
              }
              global.distribution.util.log(`worker done shuffling`);
            });
          });
        });
      } else if (message == 'receive') {
        const entries = config.entries;
        const serviceName = config.serviceName;
        const gid = config.gid;

        global.distribution.local.store.get({key: serviceName + 'received', gid}, (e, r) => {
          if (e != null) {
            r = {};
          }
          for (const [key, value] of entries) {
            if (key in r) {
              r[key].push(value);
            } else {
              r[key] = [value];
            }
          }
          global.distribution.local.store.put(r, {key: serviceName + 'received', gid}, (e) => {
            if (e != null) {
              global.distribution.util.log(e, 'error');
            }
          });
        });
      } else if (message == 'reduce') {
        const func = config.func;
        const coordinator = config.coordinator;
        const serviceName = config.serviceName;
        const gid = config.gid;

        let processed = {};

        new Promise((resolve) => {
          global.distribution.local.store.get({key: serviceName + 'received', gid}, (e, v) => {
            const received = v || {};
            resolve(Object.entries(received));
          });
        }).then((received) => {
          const requests = [];
          for (let i = 0; i < received.length; i++) {
            requests.push(new Promise((resolve) => {
              const [key, value] = received[i];
              try {
                func(key, value, (r) => {
                  processed = Object.assign(processed, r);
                  resolve();
                });
              } catch (e) {
                global.distribution.util.log(e, 'error');
                resolve();
              }
            }));
          }
          return Promise.allSettled(requests);
        }).then(() => {
          global.distribution.local.store.del({key: serviceName + 'received', gid}, () => {
            const r = {node: coordinator, service: serviceName, method: 'coordinator'};
            global.distribution.local.comm.send([
              {
                message: 'doneReducing',
                node: global.nodeConfig,
                serviceName: config.serviceName,
                result: processed,
              }], r, (e) => {
              if (e != null) {
                global.distribution.util.log(e, 'error');
              }
              global.distribution.util.log(`worker done reducing; reduced ${Object.keys(processed).length} items`);
            });
          });
        });
      }
    };

    mrService.coordinator = (config, callback) => {
      global.distribution.util.log(`coordinator received message ${JSON.stringify(config)}`);

      const message = config.message;
      const serviceName = config.serviceName;
      const node = config.node;
      const gid = global.mrStatus[serviceName].gid;
      if (message == 'doneMapping') {
        global.mrStatus[serviceName].doneMapping.push(node);
        if (Object.keys(global.mrStatus[serviceName].nodes).length == global.mrStatus[serviceName].doneMapping.length) {
          const remote = {service: serviceName, method: 'worker'};
          global.distribution[gid].comm.send([
            {
              message: 'shuffle',
              coordinator: global.nodeConfig,
              serviceName, gid,
              nodes: global.mrStatus[serviceName].nodes,
            }], remote, (e) => {
            if (e != {}) {
              for (const node in e) {
                global.distribution.util.log(`${node}: ${e[node]}`, 'error');
              }
            }
            global.distribution.util.log('coordinator: start shuffle phase');
          });
        }
      } else if (message == 'doneShuffling') {
        global.mrStatus[serviceName].doneShuffling.push(node);
        if (Object.keys(global.mrStatus[serviceName].nodes).length == global.mrStatus[serviceName].doneShuffling.length) {
          const remote = {service: serviceName, method: 'worker'};
          global.distribution[gid].comm.send([
            {
              message: 'reduce',
              coordinator: global.nodeConfig,
              serviceName, gid,
              func: configuration.reduce,
            }], remote, (e) => {
            if (e != {}) {
              for (const node in e) {
                global.distribution.util.log(`${node}: ${e[node]}`, 'error');
              }
            }
            global.distribution.util.log('coordinator: start reduce phase');
          });
        }
      } else if (message == 'doneReducing') {
        global.mrStatus[serviceName].doneReducing.push(node);
        global.mrStatus[serviceName].result.push(...Object.entries(config.result).map(([k, v]) => {
          const r = {};
          r[k] = v;
          return r;
        }));
        if (Object.keys(global.mrStatus[serviceName].nodes).length == global.mrStatus[serviceName].doneReducing.length) {
          global.distribution[gid].routes.rem(serviceName, (e) => {
            if (e != {}) {
              for (const node in e) {
                global.distribution.util.log(`${node}: ${e[node]}`, 'error');
              }
            }
            global.mrStatus[serviceName].cb(null, global.mrStatus[serviceName].result);
          });
        }
      }

      callback(null);
    };

    global.mrStatus[mrServiceName] = {
      nodes: [],
      doneMapping: [],
      doneShuffling: [],
      doneReducing: [],
      result: [],
      gid: context.gid,
      cb,
    };

    const remote = {service: mrServiceName, method: 'worker'};
    global.distribution.local.routes.put(mrService, mrServiceName, (e) => {
      if (e != null) {
        global.distribution.util.log(e, 'error');
      }
      global.distribution[context.gid].routes.put(mrService, mrServiceName, (e) => {
        if (e != {}) {
          for (const node in e) {
            global.distribution.util.log(`${node}: ${e[node]}`, 'error');
          }
        }
        global.distribution.local.groups.get(context.gid, (e, nodes) => {
          if (e != null) {
            cb(e);
          } else {
            global.mrStatus[mrServiceName].nodes = nodes;
            global.distribution[context.gid].comm.send([
              {
                message: 'map',
                coordinator: global.nodeConfig,
                serviceName: mrServiceName,
                gid: context.gid,
                keys: configuration.keys,
                func: configuration.map,
              }], remote, (e) => {
              if (e != {}) {
                for (const node in e) {
                  global.distribution.util.log(`${node}: ${e[node]}`, 'error');
                }
              }
              global.distribution.util.log('coordinator: start mapping phase');
            });
          }
        });
      });
    });
  }

  return {exec};
};

module.exports = mr;
