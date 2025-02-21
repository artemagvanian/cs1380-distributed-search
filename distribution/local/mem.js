const id = require('../util/id');

const map = {};

function put(state, configuration, callback) {
  if (typeof configuration == 'string' || configuration == null) {
    configuration = {gid: 'local', key: configuration};
  }
  if (configuration.key == null) {
    configuration.key = id.getID(state);
  }
  if (!(configuration.gid in map)) {
    map[configuration.gid] = {};
  }
  map[configuration.gid][configuration.key] = state;
  callback(null, state);
};

function get(configuration, callback) {
  if (typeof configuration == 'string' || configuration == null) {
    configuration = {gid: 'local', key: configuration};
  }
  if (!(configuration.gid in map)) {
    callback(new Error('key not in map'));
  } else {
    if (!(configuration.key in map[configuration.gid])) {
      callback(new Error('key not in map'));
    } else {
      callback(null, map[configuration.gid][configuration.key]);
    }
  }
}

function del(configuration, callback) {
  if (typeof configuration == 'string' || configuration == null) {
    configuration = {gid: 'local', key: configuration};
  }
  if (!(configuration.gid in map)) {
    callback(new Error('key not in map'));
  } else {
    if (!(configuration.key in map[configuration.gid])) {
      callback(new Error('key not in map'));
    } else {
      const value = map[configuration.gid][configuration.key];
      delete map[configuration.gid][configuration.key];
      callback(null, value);
    }
  }
};

module.exports = {put, get, del};
