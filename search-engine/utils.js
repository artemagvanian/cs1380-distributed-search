function perror(e) {
  if (e != null) {
    global.distribution.util.log(e, 'error');
  }
}

function getKeys(os) {
  return os.map((o) => Object.keys(o)[0]);
}

function mkGroup(n, basePort) {
  const nodes = [];
  for (let i = 0; i < n; i++) {
    nodes.push({ip: '127.0.0.1', port: basePort + i});
  }

  const group = {};
  for (const node of nodes) {
    group[global.distribution.util.id.getSID(node)] = node;
  }

  return group;
}

function mkNodes(n, basePort) {
  const nodes = [];
  for (let i = 0; i < n; i++) {
    nodes.push({ip: '127.0.0.1', port: basePort + i});
  }
  return nodes;
}

function spawn(nodes, cb) {
  if (nodes.length != 0) {
    global.distribution.local.status.spawn(nodes[0], (e) => {
      perror(e);
      spawn(nodes.slice(1), cb);
    });
  } else {
    cb();
  }
}

function stop(nodes, cb) {
  if (nodes.length != 0) {
    const remote = {service: 'status', method: 'stop'};
    remote.node = nodes[0];
    global.distribution.local.comm.send([], remote, (e) => {
      perror(e);
      stop(nodes.slice(1), cb);
    });
  } else {
    cb();
  }
}

module.exports = {getKeys, mkGroup, mkNodes, spawn, stop, perror};
