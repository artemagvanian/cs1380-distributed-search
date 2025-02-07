const orDefault = require('./orDefault');
const serialization = require('./serialization');
const id = require('./id');
const wire = require('./wire');

module.exports = {
  serialize: serialization.serialize,
  orDefault: orDefault,
  deserialize: serialization.deserialize,
  id: id,
  wire: wire,
};
