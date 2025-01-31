
function serialize(object) {
  switch (typeof object) {
    case 'number':
      return `{"type":"number","value":"${object.toString()}"}`;
    case 'string':
      return `{"type":"string","value":${JSON.stringify(object)}}`;
    case 'boolean':
      return `{"type":"boolean","value":"${object.toString()}"}`;
    case 'function':
      // HACK: serialize a function as IIFE;
      return `{"type":"function","value":"(() => ${object.toString()})()"}`;
    case 'undefined':
      return `{"type":"undefined"}`;
    case 'object':
      if (object == null) {
        return `{"type":"null"}`;
      } else if (object instanceof Date) {
        return `{"type":"date","value":"${object.toISOString()}"}`;
      } else if (object instanceof Error) {
        return `{"type":"error","value":"${object.message}"}`;
      } else if (object instanceof Array) {
        const serialized = [];
        for (const v of object) {
          serialized.push(serialize(v));
        }
        return `{"type":"array","value":${JSON.stringify(serialized)}}`;
      } else {
        const serialized = {};
        for (const p in object) {
          serialized[p] = serialize(object[p]);
        }
        return `{"type":"object","value":${JSON.stringify(serialized)}}`;
      }
    default:
      throw new Error('unimplemented');
  }
}

function deserialize(string) {
  const json = JSON.parse(string);
  switch (json.type) {
    case 'number':
      return Number(json.value);
    case 'string':
      return String(json.value);
    case 'boolean':
      if (json.value == 'true') {
        return true;
      } else if (json.value == 'false') {
        return false;
      } else {
        throw new Error('unimplemented');
      }
    case 'function':
      return eval(json.value);
    case 'date':
      return new Date(json.value);
    case 'error':
      return new Error(json.value);
    case 'undefined':
      return undefined;
    case 'null':
      return null;
    case 'array':
    {
      const deserialized = [];
      for (const v of json.value) {
        deserialized.push(deserialize(v));
      }
      return deserialized;
    }
    case 'object':
    {
      const deserialized = {};
      for (const p in json.value) {
        deserialized[p] = deserialize(json.value[p]);
      }
      return deserialized;
    }
    default:
      throw new Error('unimplemented');
  }
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
