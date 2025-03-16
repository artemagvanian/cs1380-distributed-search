const distribution = require('../config.js');
const id = distribution.util.id;

const NUM_SAMPLES = 1000;

const obs = new PerformanceObserver((items) => {
  for (const item of items.getEntries()) {
    console.log(`${item.name}: duration = ${item.duration} ms, throughput = ${item.duration / NUM_SAMPLES} ms/document`);
  }
});
obs.observe({type: 'measure'});

function randomString() {
  return Math.random().toString(36).substring(2);
}

let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

const mygroupGroup = {};
mygroupGroup[id.getSID(n1)] = n1;
mygroupGroup[id.getSID(n2)] = n2;
mygroupGroup[id.getSID(n3)] = n3;

distribution.node.start((server) => {
  localServer = server;
  const mygroupConfig = {gid: 'mygroup'};
  distribution.local.status.spawn(n1, (e, v) => {
    distribution.local.status.spawn(n2, (e, v) => {
      distribution.local.status.spawn(n3, (e, v) => {
        // Create some groups
        distribution.local.groups
            .put(mygroupConfig, mygroupGroup, (e, v) => {
              const mapper = (key, value) => {
                const chars = value.replace(/\s+/g, '').split('');
                const out = [];
                chars.forEach((char) => {
                  const o = {};
                  o[char] = 1;
                  out.push(o);
                });
                return out;
              };

              const reducer = (key, values) => {
                const out = {};
                out[key] = values.reduce((sum, v) => sum + v, 0);
                return out;
              };

              const dataset = [];

              for (let i = 0; i < NUM_SAMPLES; i++) {
                const obj = {};
                const key = i.toString();
                const value = randomString();
                obj[key] = value;
                dataset.push(obj);
              }

              const doMapReduce = (cb) => {
                performance.mark('mr start');
                distribution.mygroup.mr.exec({keys: dataset.map((e) => Object.keys(e)[0]), map: mapper, reduce: reducer}, (e, v) => {
                  performance.mark('mr end');
                  performance.measure('mr', 'mr start', 'mr end');
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
                });
              };

              let cntr = 0;

              dataset.forEach((o) => {
                const key = Object.keys(o)[0];
                const value = o[key];
                distribution.mygroup.store.put(value, key, (e, v) => {
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
