/** @typedef {import("../types").Callback} Callback */

function routes(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
   * @param {object} service
   * @param {string} name
   * @param {Callback} callback
   */
  function put(service, name, callback = () => { }) {
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
            global.distribution.local.routes.put(service, name, (e, v) => {
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

  /**
   * @param {object} service
   * @param {string} name
   * @param {Callback} callback
   */
  function rem(service, name, callback = () => { }) {
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
            global.distribution.local.routes.rem(service, name, (e, v) => {
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

  return {put, rem};
}

module.exports = routes;
