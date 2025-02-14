const id = require('../util/id');
const orDefault = require('../util/orDefault');

const groups = {};

groups.get = function(name, callback) {
  name = orDefault.stringOrDefault(name);
  callback = orDefault.callbackOrDefault(callback);
  if (groups[name]) {
    callback(null, groups[name]);
  } else {
    callback(new Error('group with a given name does not exist'));
  }
};

groups.put = function(config, group, callback) {
  config = orDefault.stringOrDefault(config);
  group = orDefault.objectOrDefault(group);
  callback = orDefault.callbackOrDefault(callback);
  groups[config] = group;
  global.distribution[config] = {};
  global.distribution[config].status =
      require('../all/status')({gid: config});
  global.distribution[config].comm =
      require('../all/comm')({gid: config});
  global.distribution[config].gossip =
      require('../all/gossip')({gid: config});
  global.distribution[config].groups =
      require('../all/groups')({gid: config});
  global.distribution[config].routes =
      require('../all/routes')({gid: config});
  global.distribution[config].mem =
      require('../all/mem')({gid: config});
  global.distribution[config].store =
      require('../all/store')({gid: config});
  callback(null, group);
};

groups.del = function(name, callback) {
  name = orDefault.stringOrDefault(name);
  callback = orDefault.callbackOrDefault(callback);
  if (groups[name]) {
    const group = groups[name];
    delete groups[name];
    delete global.distribution[name];
    callback(null, group);
  } else {
    callback(new Error('group with a given name does not exist'));
  }
};

groups.add = function(name, node, callback) {
  name = orDefault.stringOrDefault(name);
  node = orDefault.objectOrDefault(node);
  callback = orDefault.callbackOrDefault(callback);
  if (groups[name]) {
    groups[name][id.getSID(node)] = node;
    callback(null, node);
  } else {
    callback(new Error('group with a given name does not exist'));
  }
};

groups.rem = function(name, node, callback) {
  name = orDefault.stringOrDefault(name);
  node = orDefault.stringOrDefault(node);
  callback = orDefault.callbackOrDefault(callback);
  if (groups[name]) {
    if (groups[name][node]) {
      const nodeToDelete = groups[name][node];
      delete groups[name][node];
      callback(null, nodeToDelete);
    } else {
      callback(new Error('node with a given SID does not exist'));
    }
  } else {
    callback(new Error('group with a given name does not exist'));
  }
};

module.exports = groups;
