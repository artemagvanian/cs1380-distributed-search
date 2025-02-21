const distribution = require('../config.js');
const id = distribution.util.id;

const NUM_SAMPLES = 1000;

const obs = new PerformanceObserver((items) => {
  for (const item of items.getEntries()) {
    console.log(`${item.name}: ${item.duration * 1000 / NUM_SAMPLES} µs/op`);
  }
});
obs.observe({type: 'measure'});

function randomString() {
  return Math.random().toString(36).substring(2);
}

let localServer = null;
const n1 = {ip: '127.0.0.1', port: 1235};
const n2 = {ip: '127.0.0.1', port: 1236};

const mygroupGroup = {};
mygroupGroup[id.getSID(n1)] = n1;
mygroupGroup[id.getSID(n2)] = n2;

distribution.node.start((server) => {
  localServer = server;
  const mygroupConfig = {gid: 'mygroup'};

  // Create some groups
  distribution.local.groups
      .put(mygroupConfig, mygroupGroup, (e, v) => {
        performance.mark('create objects start');
        const objects = [];
        for (let i = 0; i < NUM_SAMPLES; i++) {
          objects.push({key: randomString(), value: {first: randomString(), last: randomString()}});
        }
        createObjects(objects);
      });
});


let createCounter = 0;

function createObjects(objects) {
  if (createCounter < NUM_SAMPLES) {
    const object = objects[createCounter];
    distribution.mygroup.mem.put(object.value, object.key, (e, v) => {
      createCounter++;
      createObjects(objects);
    });
  } else {
    performance.mark('create objects end');
    performance.measure('create objects', 'create objects start', 'create objects end');

    performance.mark('retrieve objects start');
    retrieveObjects(objects);
  }
}

let retrieveCounter = 0;

function retrieveObjects(objects) {
  if (retrieveCounter < NUM_SAMPLES) {
    const object = objects[retrieveCounter];
    distribution.mygroup.mem.get(object.key, (e, v) => {
      retrieveCounter++;
      retrieveObjects(objects);
    });
  } else {
    performance.mark('retrieve objects end');
    performance.measure('retrieve objects', 'retrieve objects start', 'retrieve objects end');
    localServer.close();
  }
}
