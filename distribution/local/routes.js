const orDefault = require('../util/orDefault');

/** @typedef {import("../types").Callback} Callback */

const routes = {};

/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) {
  configuration = orDefault.configurationOrDefault(configuration);
  callback = orDefault.callbackOrDefault(callback);
  if (routes[configuration]) {
    callback(null, routes[configuration]);
  } else {
    callback(new Error(`service with name ${configuration} does not exist`));
  }
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function put(service, configuration, callback) {
  service = orDefault.serviceOrDefault(service);
  configuration = orDefault.configurationOrDefault(configuration);
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
  configuration = orDefault.configurationOrDefault(configuration);
  callback = orDefault.callbackOrDefault(callback);
  if (routes[configuration]) {
    delete routes[configuration];
  } else {
    callback(new Error(`service with name ${configuration} does not exist`));
  }
};

module.exports = {get, put, rem};
