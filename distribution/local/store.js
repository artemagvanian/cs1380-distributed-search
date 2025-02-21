/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/

const id = require('../util/id');
const serialization = require('../util/serialization');
const path = require('path');
const fs = require('fs');

function put(state, configuration, callback) {
  if (typeof configuration == 'string' || configuration == null) {
    configuration = {gid: 'local', key: configuration};
  }
  if (configuration.key == null) {
    configuration.key = id.getID(state);
  }
  configuration.key = configuration.key.replace(/[^a-zA-Z0-9]/g, '');
  const nid = id.getNID(global.nodeConfig);
  const dirPath = path.resolve(`./store/${nid}/${configuration.gid}/`);
  const filePath = path.resolve(`./store/${nid}/${configuration.gid}/${configuration.key}`);
  try {
    const serializedValue = serialization.serialize(state);
    fs.mkdir(dirPath, {recursive: true}, (err) => {
      if (err) {
        callback(new Error('failed to create dir'));
      } else {
        fs.writeFile(filePath, serializedValue, (err) => {
          if (err) {
            callback(new Error('failed to write file'));
          } else {
            callback(null, state);
          }
        });
      }
    });
  } catch (e) {
    callback(new Error('failed to serialize'));
  }
};

function get(configuration, callback) {
  if (typeof configuration == 'string' || configuration == null) {
    configuration = {gid: 'local', key: configuration};
  }
  const nid = id.getNID(global.nodeConfig);
  configuration.key = configuration.key.replace(/[^a-zA-Z0-9]/g, '');
  const filePath = path.resolve(`./store/${nid}/${configuration.gid}/${configuration.key}`);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      callback(new Error('failed to read file' + err.toString()));
    } else {
      try {
        const value = serialization.deserialize(data);
        callback(null, value);
      } catch (e) {
        callback(new Error('failed to deserialize'));
      }
    }
  });
}

function del(configuration, callback) {
  if (typeof configuration == 'string' || configuration == null) {
    configuration = {gid: 'local', key: configuration};
  }
  configuration.key = configuration.key.replace(/[^a-zA-Z0-9]/g, '');
  const nid = id.getNID(global.nodeConfig);
  const filePath = path.resolve(`./store/${nid}/${configuration.gid}/${configuration.key}`);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      callback(new Error('failed to read file'));
    } else {
      try {
        const value = serialization.deserialize(data);
        fs.unlink(filePath, (err) => {
          if (err) {
            callback(new Error('failed to unlink file'));
          } else {
            callback(null, value);
          }
        });
      } catch (e) {
        callback(new Error('failed to deserialize'));
      }
    }
  });
};

module.exports = {put, get, del};
