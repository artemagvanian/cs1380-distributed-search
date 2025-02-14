function objectOrDefault(maybeObject) {
  if (typeof maybeObject == 'object' && maybeObject !== null) {
    return maybeObject;
  } else {
    return {};
  }
}

function stringOrDefault(maybeString) {
  if (typeof maybeString == 'string') {
    return maybeString;
  } else {
    return '';
  }
}

function callbackOrDefault(maybeCallback) {
  if (typeof maybeCallback == 'function') {
    return maybeCallback;
  } else {
    return () => {};
  }
}

function arrayOrDefault(maybeArray) {
  if (maybeArray instanceof Array) {
    return maybeArray;
  } else {
    return [];
  }
}

module.exports = {
  callbackOrDefault,
  stringOrDefault,
  arrayOrDefault,
  objectOrDefault,
};
