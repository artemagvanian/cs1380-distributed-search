/** @typedef {import("../types").Callback} Callback */
/** @typedef {import("../types").Node} Node */

const http = require('http');
const {Buffer} = require('buffer');

const orDefault = require('../util/orDefault');
const {serialize, deserialize} = require('../util/serialization');

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
 * @return {void}
 */
function send(message, remote, callback) {
  message = orDefault.messageOrDefault(message);
  callback = orDefault.callbackOrDefault(callback);

  let data;
  try {
    data = serialize(message);
  } catch (serializationError) {
    callback(serializationError);
    return;
  }

  const options = {
    hostname: remote.node.ip,
    port: remote.node.port,
    path: `/local/${remote.service}/${remote.method}`,
    method: 'PUT',
    headers: {
      'Content-Length': Buffer.byteLength(data),
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
    callback(e);
  });

  req.write(data);
  req.end();
}

module.exports = {send};
