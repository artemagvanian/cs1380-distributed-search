const orDefault = require('../util/orDefault');

const groups = function(config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {
    put: (config, group, callback) => {
      callback = orDefault.callbackOrDefault(callback);
      const message = [config, group];
      const remote = {service: 'groups', method: 'put'};
      global.distribution[context.gid].comm.send(message, remote, (e, v) => {
        callback(e, v);
      });
    },

    del: (name, callback) => {
      callback = orDefault.callbackOrDefault(callback);
      const message = [name];
      const remote = {service: 'groups', method: 'del'};
      global.distribution[context.gid].comm.send(message, remote, (e, v) => {
        callback(e, v);
      });
    },

    get: (name, callback) => {
      callback = orDefault.callbackOrDefault(callback);
      const message = [name];
      const remote = {service: 'groups', method: 'get'};
      global.distribution[context.gid].comm.send(message, remote, (e, v) => {
        callback(e, v);
      });
    },

    add: (name, node, callback) => {
      callback = orDefault.callbackOrDefault(callback);
      const message = [name, node];
      const remote = {service: 'groups', method: 'add'};
      global.distribution[context.gid].comm.send(message, remote, (e, v) => {
        callback(e, v);
      });
    },

    rem: (name, node, callback) => {
      callback = orDefault.callbackOrDefault(callback);
      const message = [name, node];
      const remote = {service: 'groups', method: 'rem'};
      global.distribution[context.gid].comm.send(message, remote, (e, v) => {
        callback(e, v);
      });
    },
  };
};

module.exports = groups;
