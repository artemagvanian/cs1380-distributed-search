/** @typedef {import("../types.js").Node} Node */

const assert = require('assert');
const crypto = require('crypto');

// The ID is the SHA256 hash of the JSON representation of the object
/** @typedef {!string} ID */

/**
 * @param {any} obj
 * @return {ID}
 */
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

/**
 * The NID is the SHA256 hash of the JSON representation of the node
 * @param {Node} node
 * @return {ID}
 */
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

/**
 * The SID is the first 5 characters of the NID
 * @param {Node} node
 * @return {ID}
 */
function getSID(node) {
  return getNID(node).substring(0, 5);
}


function getMID(message) {
  const msg = {};
  msg.date = new Date().getTime();
  msg.mss = message;
  return getID(msg);
}

function idToNum(id) {
  const n = parseInt(id, 16);
  assert(!isNaN(n), 'idToNum: id is not in KID form!');
  return n;
}

function naiveHash(kid, nids) {
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}

function consistentHash(kid, nids) {
  const elt = idToNum(kid);
  const lst = nids.map((nid, i) => {
    return {i, v: idToNum(nid)};
  });
  lst.push({i: -1, v: elt});
  lst.sort((a, b) => {
    return ((a.v < b.v) ? -1 : ((a.v > b.v) ? 1 : 0));
  });
  for (let i = 0; i < lst.length; i++) {
    if (lst[i].v == elt) {
      if (i == lst.length - 1) {
        return nids[lst[0].i];
      } else {
        return nids[lst[i + 1].i];
      }
    }
  }
}

function rendezvousHash(kid, nids) {
  const lst = nids.map((nid) => kid + nid).map((v, i) => {
    return {i, v: idToNum(getID(v))};
  });
  lst.sort((a, b) => {
    return ((a.v < b.v) ? 1 : ((a.v > b.v) ? -1 : 0));
  });
  return nids[lst[0].i];
}

module.exports = {
  getID,
  getNID,
  getSID,
  getMID,
  naiveHash,
  consistentHash,
  rendezvousHash,
};
