const id = require('../util/id');
const orDefault = require('../util/orDefault');

const status = {};

global.moreStatus = {
  sid: id.getSID(global.nodeConfig),
  nid: id.getNID(global.nodeConfig),
  counts: 0,
};

status.get = function(configuration, callback) {
  configuration = orDefault.configurationOrDefault(configuration);
  callback = orDefault.callbackOrDefault(callback);
  switch (configuration) {
    case 'nid':
      callback(null, global.moreStatus.nid);
      break;
    case 'sid':
      callback(null, global.moreStatus.sid);
      break;
    case 'ip':
      callback(null, global.nodeConfig.ip);
      break;
    case 'port':
      callback(null, global.nodeConfig.port);
      break;
    case 'counts':
      callback(null, global.moreStatus.counts);
      break;
    case 'heapTotal':
      callback(null, process.memoryUsage().heapTotal);
      break;
    case 'heapUsed':
      callback(null, process.memoryUsage().heapUsed);
      break;
    default:
      callback(new Error(`bad configuration: ${configuration}`));
      break;
  }
};

status.spawn = function(configuration, callback) {
};

status.stop = function(callback) {
};

module.exports = status;
