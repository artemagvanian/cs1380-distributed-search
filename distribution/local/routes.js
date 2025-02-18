const orDefault = require('../util/orDefault');

/** @typedef {import("../types").Callback} Callback */

const routes = {};

/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) {
  callback = orDefault.callbackOrDefault(callback);
  if (typeof configuration == 'string') {
    configuration = {
      service: configuration,
      gid: 'local',
    };
  } else if (!configuration.gid) {
    configuration = {
      ...configuration,
      gid: 'local',
    };
  }

  if (configuration.gid == 'local') {
    if (routes[configuration.service]) {
      callback(null, routes[configuration.service]);
    } else {
      const rpc = global.toLocal[configuration.service];
      if (rpc) {
        callback(null, {call: rpc});
      } else {
        callback(new Error(`service ${configuration.service} not found!`));
      }
    }
  } else {
    if (global.distribution[configuration.gid]) {
      if (global.distribution[configuration.gid][configuration.service]) {
        callback(null, global.distribution[configuration.gid][configuration.service]);
      } else {
        callback(new Error(`service with name ${configuration.service} does not exist`));
      }
    } else {
      callback(new Error('bad group'));
    }
  }
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function put(service, configuration, callback) {
  service = orDefault.objectOrDefault(service);
  configuration = orDefault.stringOrDefault(configuration);
  callback = orDefault.callbackOrDefault(callback);
  if (routes[configuration]) {
    callback(new Error(`service with name ${configuration} already exists`));
  } else {
    routes[configuration] = service;
    callback(null);
  }
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
  configuration = orDefault.stringOrDefault(configuration);
  callback = orDefault.callbackOrDefault(callback);
  if (routes[configuration]) {
    delete routes[configuration];
  } else {
    callback(new Error(`service with name ${configuration} does not exist`));
  }
};

module.exports = {get, put, rem};
