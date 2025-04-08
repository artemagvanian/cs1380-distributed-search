
function store(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.rendezvousHash;

  /* For the distributed store service, the configuration will
          always be a string */
  return {
    get: (configuration, callback = () => {}) => {
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(new Error('group not found'));
        } else {
          const kid = global.distribution.util.id.getID(configuration);
          const nids = Object.values(v).map((node) => global.distribution.util.id.getNID(node));
          const node = v[context.hash(kid, nids).substring(0, 5)];
          const message = [{key: configuration, gid: context.gid}];
          const remote = {node, service: 'store', method: 'get'};
          global.distribution.local.comm.send(message, remote, (e, v) => {
            callback(e, v);
          });
        }
      });
    },

    put: (state, configuration, callback = () => {}) => {
      if (configuration == null) {
        configuration = global.distribution.util.id.getID(state);
      }
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(new Error('group not found'));
        } else {
          const kid = global.distribution.util.id.getID(configuration);
          const nids = Object.values(v).map((node) => global.distribution.util.id.getNID(node));
          const node = v[context.hash(kid, nids).substring(0, 5)];
          const message = [state, {key: configuration, gid: context.gid}];
          const remote = {node, service: 'store', method: 'put'};
          global.distribution.local.comm.send(message, remote, (e, v) => {
            callback(e, v);
          });
        }
      });
    },

    del: (configuration, callback = () => {}) => {
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(new Error('group not found'));
        } else {
          const kid = global.distribution.util.id.getID(configuration);
          const nids = Object.values(v).map((node) => global.distribution.util.id.getNID(node));
          const node = v[context.hash(kid, nids).substring(0, 5)];
          const message = [{key: configuration, gid: context.gid}];
          const remote = {node, service: 'store', method: 'del'};
          global.distribution.local.comm.send(message, remote, (e, v) => {
            callback(e, v);
          });
        }
      });
    },

    reconf: (configuration, callback) => {
    },
  };
};

module.exports = store;
