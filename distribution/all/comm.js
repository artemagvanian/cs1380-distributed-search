const orDefault = require('../util/orDefault');

/** @typedef {import("../types").Callback} Callback */

/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typdef {Object} Target
 * @property {string} service
 * @property {string} method
 */

/**
 * @param {object} config
 * @return {object}
 */
function comm(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
   * @param {Array} message
   * @param {object} configuration
   * @param {Callback} callback
   */
  function send(message, configuration, callback) {
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
            const node = groups[nodeId];
            global.distribution.local.comm.send(message, {...configuration, node}, (e, v) => {
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
  }

  return {send};
};

module.exports = comm;
