const http = require('http');
const log = require('../util/log');
const routes = require('./routes');
const {deserialize, serialize} = require('../util/serialization');

/*
    The start function will be called to start your node.
    It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/


const start = function(callback) {
  const server = http.createServer((req, res) => {
    /* Your server will be listening for PUT requests. */

    if (req.method != 'PUT') {
      return;
    }

    /*
      The path of the http request will determine the service to be used.
      The url will have the form: http://node_ip:node_port/service/method
    */

    const [gid, service, method] = req.url.split('/').slice(1);

    /*

      A common pattern in handling HTTP requests in Node.js is to have a
      subroutine that collects all the data chunks belonging to the same
      request. These chunks are aggregated into a body variable.

      When the req.on('end') event is emitted, it signifies that all data from
      the request has been received. Typically, this data is in the form of a
      string. To work with this data in a structured format, it is often parsed
      into a JSON object using JSON.parse(body), provided the data is in JSON
      format.

      Our nodes expect data in JSON format.
  */

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      /* Here, you can handle the service requests.
      Use the local routes service to get the service you need to call.
      You need to call the service with the method and arguments provided in the request.
      Then, you need to serialize the result and send it back to the caller.
      */

      global.moreStatus.counts++;

      let args;
      try {
        args = deserialize(body);
      } catch (deserializationError) {
        const serializedError = serialize([deserializationError, undefined]);
        res.writeHead(400).end(serializedError);
      }

      routes.get({service, gid}, (routesError, service) => {
        if (routesError) {
          try {
            const serializedError = serialize([routesError, undefined]);
            res.writeHead(400).end(serializedError);
          } catch (serializationError) {
            const serializedError = serialize([serializationError, undefined]);
            res.writeHead(400).end(serializedError);
          }
        } else {
          if (service[method]) {
            service[method](...args, (e, v) => {
              try {
                const serializedResult = serialize([e, v]);
                res.writeHead(e == null ? 200 : 400).end(serializedResult);
              } catch (e) {
                const serializedError = serialize([e, undefined]);
                res.writeHead(400).end(serializedError);
              }
            });
          } else {
            const serializedError = serialize([new Error(`service ${service} does not contain method ${method}`), undefined]);
            res.writeHead(400).end(serializedError);
          }
        }
      });
    });
  });


  /*
    Your server will be listening on the port and ip specified in the config
    You'll be calling the `callback` callback when your server has successfully
    started.

    At some point, we'll be adding the ability to stop a node
    remotely through the service interface.
  */

  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    log(`Server running at http://${global.nodeConfig.ip}:${global.nodeConfig.port}/`);
    global.distribution.node.server = server;
    callback(server);
  });

  server.on('error', (error) => {
    // server.close();
    log(`Server error: ${error}`);
    throw error;
  });
};

module.exports = {
  start: start,
};
