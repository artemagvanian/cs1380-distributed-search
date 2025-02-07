const distribution = require('../config.js');
const local = distribution.local;
const util = distribution.util;

const NUM_SAMPLES = 1000;

const obs = new PerformanceObserver((items) => {
  for (const item of items.getEntries()) {
    console.log(`${item.name}: ${item.duration * 1000 / NUM_SAMPLES} µs/op`);
  }
});
obs.observe({type: 'measure'});

let localServer = null;
distribution.node.start((server) => {
  localServer = server;
  performance.mark('comm requests start');
  sendRequest();
});

const node = distribution.node.config;
const remote = {node: node, service: 'status', method: 'get'};
const message = ['counts'];
let commCounter = 0;

function sendRequest() {
  if (commCounter < NUM_SAMPLES) {
    commCounter++;
    local.comm.send(message, remote, sendRequest);
  } else {
    performance.mark('comm requests end');
    performance.measure('comm requests', 'comm requests start', 'comm requests end');

    let n = 0;
    const addOne = () => {
      return ++n;
    };

    const addOneRPC = util.wire.createRPC(util.wire.toAsync(addOne));
    const rpcService = {
      addOne: addOneRPC,
    };

    local.status.spawn(remoteNode, () => {
      // Install the addOne service on the remote node with the name 'addOneService'.
      local.comm.send([rpcService, 'addOneService'],
          {node: remoteNode, service: 'routes', method: 'put'}, () => {
            performance.mark('rpc requests start');
            sendRPC();
          });
    });
  }
}

const remoteNode = {ip: '127.0.0.1', port: 9009};
let rpcCounter = 0;

function sendRPC() {
  if (rpcCounter < NUM_SAMPLES) {
    rpcCounter++;
    local.comm.send([], {node: remoteNode, service: 'addOneService', method: 'addOne'}, sendRPC);
  } else {
    performance.mark('rpc requests end');
    performance.measure('rpc requests', 'rpc requests start', 'rpc requests end');
    localServer.close();
    local.comm.send([], {node: remoteNode, service: 'status', method: 'stop'}, () => {});
  }
}
