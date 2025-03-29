/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/

const id = require('../util/id');
const serialization = require('../util/serialization');
const path = require('path');
const fs = require('fs');

function put(state, configuration, callback = () => {}) {
  if (typeof configuration == 'string' || configuration == null) {
    configuration = {gid: 'local', key: configuration};
  }
  if (configuration.key == null) {
    configuration.key = id.getID(state);
  }
  configuration.key = id.getID(configuration.key);
  const nid = id.getNID(global.nodeConfig);
  const dirPath = path.resolve(`./store/${nid}/${configuration.gid}/`);
  const filePath = path.resolve(`./store/${nid}/${configuration.gid}/${configuration.key}`);
  try {
    const serializedValue = serialization.serialize(state);
    try {
      fs.mkdirSync(dirPath, {recursive: true});
      try {
        fs.writeFileSync(filePath, serializedValue);
        callback(null, state);
      } catch (e) {
        callback(new Error('failed to write file'));
      }
    } catch (e) {
      callback(new Error('failed to create dir'));
    }
  } catch (e) {
    callback(new Error('failed to serialize'));
  }
};

function get(configuration, callback = () => {}) {
  if (typeof configuration == 'string' || configuration == null) {
    configuration = {gid: 'local', key: configuration};
  }
  const nid = id.getNID(global.nodeConfig);
  configuration.key = id.getID(configuration.key);
  const filePath = path.resolve(`./store/${nid}/${configuration.gid}/${configuration.key}`);
  try {
    const data = fs.readFileSync(filePath);
    try {
      const value = serialization.deserialize(data);
      callback(null, value);
    } catch (e) {
      callback(new Error('failed to deserialize ' + e.toString()));
    }
  } catch (e) {
    callback(new Error('failed to read file' + e.toString()));
  }
}

function del(configuration, callback = () => {}) {
  if (typeof configuration == 'string' || configuration == null) {
    configuration = {gid: 'local', key: configuration};
  }
  configuration.key = id.getID(configuration.key);
  const nid = id.getNID(global.nodeConfig);
  const filePath = path.resolve(`./store/${nid}/${configuration.gid}/${configuration.key}`);
  try {
    const data = fs.readFileSync(filePath);
    try {
      const value = serialization.deserialize(data);
      try {
        fs.unlinkSync(filePath);
        callback(null, value);
      } catch (e) {
        callback(new Error('failed to unlink file'));
      }
    } catch (e) {
      callback(new Error('failed to deserialize'));
    }
  } catch (e) {
    callback(new Error('failed to read file'));
  }
};

module.exports = {put, get, del};
