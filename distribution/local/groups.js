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
  if (typeof config == 'string') {
    config = {gid: config};
  }
  group = orDefault.objectOrDefault(group);
  callback = orDefault.callbackOrDefault(callback);
  groups[config.gid] = group;
  global.distribution[config.gid] = {};
  global.distribution[config.gid].status =
      require('../all/status')(config);
  global.distribution[config.gid].comm =
      require('../all/comm')(config);
  global.distribution[config.gid].gossip =
      require('../all/gossip')(config);
  global.distribution[config.gid].groups =
      require('../all/groups')(config);
  global.distribution[config.gid].routes =
      require('../all/routes')(config);
  global.distribution[config.gid].mem =
      require('../all/mem')(config);
  global.distribution[config.gid].mr =
      require('../all/mr')(config);
  global.distribution[config.gid].store =
      require('../all/store')(config);
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
