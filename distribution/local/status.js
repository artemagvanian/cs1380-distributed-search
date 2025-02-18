const orDefault = require('../util/orDefault');

const status = {};

global.moreStatus = {
  sid: global.distribution.util.id.getSID(global.nodeConfig),
  nid: global.distribution.util.id.getNID(global.nodeConfig),
  counts: 0,
};

status.get = function(configuration, callback) {
  configuration = orDefault.stringOrDefault(configuration);
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

status.spawn = require('@brown-ds/distribution/distribution/local/status').spawn;

status.stop = require('@brown-ds/distribution/distribution/local/status').stop;

module.exports = status;
