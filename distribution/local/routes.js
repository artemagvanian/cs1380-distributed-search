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
    if (routes[configuration]) {
      callback(null, routes[configuration]);
    } else {
      callback(new Error(`service with name ${configuration} does not exist`));
    }
  } else if (typeof configuration == 'object' && configuration != null) {
    if (global.distribution[configuration.gid]) {
      if (global.distribution[configuration.gid][configuration.service]) {
        callback(null, global.distribution[configuration.gid][configuration.service]);
      } else {
        callback(new Error(`service with name ${configuration} does not exist`));
      }
    } else {
      callback(new Error('bad group'));
    }
  } else {
    callback(new Error('bad configuration'));
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
