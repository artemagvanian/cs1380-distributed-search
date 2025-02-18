const orDefault = require('../util/orDefault');

const status = function(config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {
    get: (configuration, callback) => {
      callback = orDefault.callbackOrDefault(callback);
      const message = [configuration];
      const remote = {service: 'status', method: 'get'};
      global.distribution[context.gid].comm.send(message, remote, (e, v) => {
        callback(e, v);
      });
    },

    spawn: (configuration, callback) => {
      callback = orDefault.callbackOrDefault(callback);
      global.distribution.local.status.spawn(configuration, (e, v) => {
        if (e) {
          callback(e);
        } else {
          global.distribution.local.groups.add(context.gid, v, callback);
        }
      });
    },

    stop: (callback) => {
      callback = orDefault.callbackOrDefault(callback);
      const remote = {service: 'status', method: 'stop'};
      global.distribution[context.gid].comm.send([], remote, callback);
    },
  };
};

module.exports = status;
