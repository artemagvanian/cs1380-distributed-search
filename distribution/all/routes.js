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
    const message = [service, name];
    const remote = {service: 'routes', method: 'put'};
    global.distribution[context.gid].comm.send(message, remote, (e, v) => {
      callback(e, v);
    });
  }

  /**
   * @param {string} name
   * @param {Callback} callback
   */
  function rem(name, callback = () => { }) {
    const message = [name];
    const remote = {service: 'routes', method: 'rem'};
    global.distribution[context.gid].comm.send(message, remote, (e, v) => {
      callback(e, v);
    });
  }

  return {put, rem};
}

module.exports = routes;
