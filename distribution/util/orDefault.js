function serviceOrDefault(maybeService) {
  if (typeof maybeService == 'object' && maybeService !== null) {
    return maybeService;
  } else {
    return {};
  }
}

function configurationOrDefault(maybeConfiguration) {
  if (typeof maybeConfiguration == 'string') {
    return maybeConfiguration;
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

function messageOrDefault(maybeMessage) {
  if (maybeMessage instanceof Array) {
    return maybeMessage;
  } else {
    return [];
  }
}

module.exports = {
  callbackOrDefault,
  configurationOrDefault,
  messageOrDefault,
  serviceOrDefault,
};
