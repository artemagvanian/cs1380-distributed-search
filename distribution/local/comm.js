/** @typedef {import("../types").Callback} Callback */
/** @typedef {import("../types").Node} Node */

const http = require('http');
const {Buffer} = require('buffer');

const orDefault = require('../util/orDefault');
const {serialize, deserialize} = require('../util/serialization');

const MAX_RETRIES = 4;

/**
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {Node} node
 */

/**
 * @param {Array} message
 * @param {Target} remote
 * @param {Callback} [callback]
 * @param {number} [retries]
 * @return {void}
 */
function send(message, remote, callback, retries = 0) {
  message = orDefault.arrayOrDefault(message);
  callback = orDefault.callbackOrDefault(callback);

  let data;
  try {
    data = serialize(message);
  } catch (serializationError) {
    callback(serializationError);
    return;
  }

  const group = remote.gid ? remote.gid : 'local';
  const options = {
    hostname: remote.node.ip,
    port: remote.node.port,
    path: `/${group}/${remote.service}/${remote.method}`,
    method: 'PUT',
    headers: {
      'Content-Length': Buffer.byteLength(data),
      'Connection': 'keep-alive',
    },
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      try {
        const [e, v] = deserialize(body);
        callback(e, v);
      } catch (deserializationError) {
        callback(deserializationError);
      }
    });
  });

  req.on('error', (e) => {
    if (retries < MAX_RETRIES) {
      global.distribution.util.log(e, 'error');
      setTimeout(() => {
        send(message, remote, callback, retries + 1); // Exponential backoff.
      }, 100 * Math.pow(2, retries));
    } else {
      callback(e);
    }
  });

  req.write(data);
  req.end();
}

module.exports = {send};
