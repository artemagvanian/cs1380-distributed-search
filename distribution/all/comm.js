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
        const nodeIds = Object.keys(groups);

        const values = {};
        const errors = {};

        const processUntilDone = (i) => {
          if (i == nodeIds.length) {
            callback(errors, values);
          } else {
            const nodeId = nodeIds[i];
            const node = groups[nodeId];
            global.distribution.local.comm.send(message, {...configuration, node}, (e, v) => {
              if (e) {
                errors[nodeId] = e;
              } else {
                values[nodeId] = v;
              }
              processUntilDone(i + 1);
            });
          }
        };
        processUntilDone(0);
      }
    });
  }

  return {send};
};

module.exports = comm;
