const {serialize} = require('../distribution/util/serialization.js');
const {spawn} = require('child_process');

const NUM_SAMPLES = 100;
const allItems = [];

const obs = new PerformanceObserver((items) => {
  for (const item of items.getEntries()) {
    console.log(`${item.name}: ${item.duration} ms`);
    allItems.push(item.duration);
  }
});
obs.observe({type: 'measure'});

let counter = 0;
let rcvCounter = 0;

performance.mark(`experiment start`);
startNode();

function startNode() {
  if (counter < NUM_SAMPLES) {
    const config = serialize({'ip': '127.0.0.1',
      'port': 8080 + counter,
      'onStart': () => console.log('{{counter}}')}).replace('{{counter}}', counter.toString());

    performance.mark(`process ${counter} spawned`);
    const proc = spawn('node', ['./distribution.js', '--config', config]);
    proc.stdout.on('data', (data) => {
      data = data.toString().replace('\n', '');
      console.log(`stdout: ${data}`);
      performance.mark(`process ${data} booted up`);
      performance.measure(`process ${data}`, `process ${data} spawned`, `process ${data} booted up`);
      rcvCounter++;
      if (rcvCounter == NUM_SAMPLES) {
        performance.mark(`experiment end`);
        performance.measure(`experiment`, `experiment start`, `experiment end`);
      }
    });

    counter++;
    startNode();
  }
}

setTimeout(() => console.log(`average latency: ${allItems.reduce((acc, elt) => acc + elt, 0) / NUM_SAMPLES}`), 10000);
