const distribution = require('../config.js');
const util = distribution.util;

const NUM_SAMPLES = 1000000;

const obs = new PerformanceObserver((items) => {
  for (const item of items.getEntries()) {
    console.log(`${item.name}: ${item.duration * 1000 / NUM_SAMPLES} µs/op`);
  }
});
obs.observe({type: 'measure'});

// Serialization of simple objects;
const simpleObject = 'hello';

performance.mark('simple object serialization start');
for (let i = 0; i < NUM_SAMPLES; i++) {
  util.serialize(simpleObject);
}
performance.mark('simple object serialization end');

performance.measure('simple object serialization', 'simple object serialization start', 'simple object serialization end');

// Serialization of function objects;
const functionObject = function() {
  // eslint-disable-next-line
  return (a, b) => a + b + 'foo' + "foo";
};

performance.mark('function object serialization start');
for (let i = 0; i < NUM_SAMPLES; i++) {
  util.serialize(functionObject);
}
performance.mark('function object serialization end');

performance.measure('function object serialization', 'function object serialization start', 'function object serialization end');

// Serialization of complex objects;
const complexObject = {
  fn: function() {
    // eslint-disable-next-line
    return (a, b) => a + b + 'foo' + "foo";
  },
  obj: {
    a: functionObject,
    b: [functionObject, simpleObject, 'foo'],
  },
};

performance.mark('complex object serialization start');
for (let i = 0; i < NUM_SAMPLES; i++) {
  util.serialize(complexObject);
}
performance.mark('complex object serialization end');

performance.measure('complex object serialization', 'complex object serialization start', 'complex object serialization end');
