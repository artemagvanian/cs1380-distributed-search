const orDefault = require('../util/orDefault');

const status = function(config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {
    get: (configuration, callback) => {
      callback = orDefault.callbackOrDefault(callback);
      global.distribution.local.groups.get(context.gid, (e, groups) => {
        if (e) {
          callback(e);
        } else {
          const nodeIds = groups.keys();

          const values = {};
          const errors = {};
          let counter = 0;

          const processUntilDone = () => {
            if (counter == nodeIds.length()) {
              callback(errors, values);
            } else {
              const nodeId = nodeIds[counter];
              global.distribution.local.status.get(configuration, (e, v) => {
                if (e) {
                  errors[nodeId] = e;
                } else {
                  values[nodeId] = v;
                  counter++;
                  processUntilDone();
                }
              });
            }
          };
          processUntilDone();
        }
      });
    },

    spawn: (configuration, callback) => {
      callback = orDefault.callbackOrDefault(callback);
      global.distribution.local.groups.get(context.gid, (e, groups) => {
        if (e) {
          callback(e);
        } else {
          const nodeIds = groups.keys();

          const values = {};
          const errors = {};
          let counter = 0;

          const processUntilDone = () => {
            if (counter == nodeIds.length()) {
              callback(errors, values);
            } else {
              const nodeId = nodeIds[counter];
              global.distribution.local.status.spawn(configuration, (e, v) => {
                if (e) {
                  errors[nodeId] = e;
                } else {
                  values[nodeId] = v;
                  counter++;
                  processUntilDone();
                }
              });
            }
          };
          processUntilDone();
        }
      });
    },

    stop: (callback) => {
      callback = orDefault.callbackOrDefault(callback);
      global.distribution.local.groups.get(context.gid, (e, groups) => {
        if (e) {
          callback(e);
        } else {
          const nodeIds = groups.keys();

          const values = {};
          const errors = {};
          let counter = 0;

          const processUntilDone = () => {
            if (counter == nodeIds.length()) {
              callback(errors, values);
            } else {
              const nodeId = nodeIds[counter];
              global.distribution.local.status.stop((e, v) => {
                if (e) {
                  errors[nodeId] = e;
                } else {
                  values[nodeId] = v;
                  counter++;
                  processUntilDone();
                }
              });
            }
          };
          processUntilDone();
        }
      });
    },
  };
};

module.exports = status;
