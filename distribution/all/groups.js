const orDefault = require('../util/orDefault');

const groups = function(config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {
    put: (config, group, callback) => {
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
              global.distribution.local.groups.put(config, group, (e, v) => {
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

    del: (name, callback) => {
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
              global.distribution.local.groups.del(name, (e, v) => {
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

    get: (name, callback) => {
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
              global.distribution.local.groups.get(name, (e, v) => {
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

    add: (name, node, callback) => {
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
              global.distribution.local.groups.put(name, node, (e, v) => {
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

    rem: (name, node, callback) => {
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
              global.distribution.local.groups.put(name, node, (e, v) => {
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

module.exports = groups;
