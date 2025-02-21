# distribution

This is the distribution library. When loaded, distribution introduces functionality supporting the distributed execution of programs. To download it:

## Installation

```sh
$ npm i '@brown-ds/distribution'
```

This command downloads and installs the distribution library.

## Testing

There are several categories of tests:
  *	Regular Tests (`*.test.js`)
  *	Scenario Tests (`*.scenario.js`)
  *	Extra Credit Tests (`*.extra.test.js`)
  * Student Tests (`*.student.test.js`) - inside `test/test-student`

### Running Tests

By default, all regular tests are run. Use the options below to run different sets of tests:

1. Run all regular tests (default): `$ npm test` or `$ npm test -- -t`
2. Run scenario tests: `$ npm test -- -c` 
3. Run extra credit tests: `$ npm test -- -ec`
4. Run the `non-distribution` tests: `$ npm test -- -nd`
5. Combine options: `$ npm test -- -c -ec -nd -t`

## Usage

To import the library, be it in a JavaScript file or on the interactive console, run:

```js
let distribution = require("@brown-ds/distribution");
```

Now you have access to the full distribution library. You can start off by serializing some values. 

```js
let s = distribution.util.serialize(1); // '{"type":"number","value":"1"}'
let n = distribution.util.deserialize(s); // 1
```

You can inspect information about the current node (for example its `sid`) by running:

```js
distribution.local.status.get('sid', console.log); // 8cf1b
```

You can also store and retrieve values from the local memory:

```js
distribution.local.mem.put({name: 'nikos'}, 'key', console.log); // {name: 'nikos'}
distribution.local.mem.get('key', console.log); // {name: 'nikos'}
```

You can also spawn a new node:

```js
let node = { ip: '127.0.0.1', port: 8080 };
distribution.local.status.spawn(node, console.log);
```

Using the `distribution.all` set of services will allow you to act 
on the full set of nodes created as if they were a single one.

```js
distribution.all.status.get('sid', console.log); // { '8cf1b': '8cf1b', '8cf1c': '8cf1c' }
```

You can also send messages to other nodes:

```js
distribution.all.comm.send(['sid'], {node: node, service: 'status', method: 'get'}, console.log); // 8cf1c
```

# Results and Reflections

# M1: Serialization / Deserialization

## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M1 (`hours`) and the lines of code per task.

My implementation comprises `2` software components, totaling `118` lines of code. Key challenges included:
- Serializing escaped characters, solved using JSON serialization module.
- Serializing arrow functions and anonymous functions, solved using IIFEs.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation

*Correctness*: I wrote `5` tests; these tests take `2s` to execute. This includes objects with escaped characters, functions, empty objects.

*Performance*: The latency of various subsystems is described in the `"latency"` portion of package.json (in µs/op, simple object serialization, function object serialization, complex object serialization). The characteristics of my development machines are summarized in the `"dev"` portion of package.json.

# M2: Actors and Remote Procedure Calls (RPC)

## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M2 (`hours`) and the lines of code per task.

My implementation comprises `4` software components, totaling `118` lines of code. Key challenges included understanding the naming and calling convention, which I solved by reading the handout carefully.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation

*Correctness*: I wrote `5` tests; these tests take ~6s to execute.

*Performance*: I characterized the performance of comm and RPC by sending 1000 service requests in a tight loop. Average throughput and latency is recorded in `package.json` (in µs/op, comm performance, RPC performance).

## Key Feature

> How would you explain the implementation of `createRPC` to someone who has no background in computer science — i.e., with the minimum jargon possible?
Imagine a situation where you are opening a post office and need to give a set of instructions to all other post offices about how to send correspondence to you. `createRPC` metaphorically generates these instructions; if you send the instructions to another post office, a third post office could reach that post office and ask it to forward the correspondence to you.  


# M3: Node Groups & Gossip Protocols

## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M3 (`hours`) and the lines of code per task.

My implementation comprises `8` new software components, totaling `200` added lines of code over the previous implementation. Key challenges included figuring out how to use `spawn` and `stop` from the reference implementation, which was solved by contacting the staff on EdStem.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation

*Correctness* -- number of tests and time they take.

 I wrote `5` tests; these tests take ~0.6s to execute.

*Performance* -- spawn times (all students) and gossip (lab/ec-only).

I characterized the performance of spawn times by sending 100 spawn requests (see `./harnesses/m3.harness.js`). Average throughput and latency are recorded in `package.json` (in op/s, s/op).

## Key Feature

> What is the point of having a gossip protocol? Why doesn't a node just send the message to _all_ other nodes in its group?

The point of having a gossip protocol is to ensure the spread of information in a way that is both resistant to failures of certain nodes but at the same time does not require enormous amount of communication (as it would be if a node sends the message to all other nodes).

# M4: Distributed Storage

## Summary

> Summarize your implementation, including key challenges you encountered

My implementation comprises `84` new software components, totaling `215` added lines of code over the previous implementation. The milestone went rather smoothly so there were no big challenges.

Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M4 (`hours`) and the lines of code per task.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation

*Correctness* -- number of tests and time they take.

I wrote `5` tests; these tests take ~0.8s to execute.

*Performance* -- insertion and retrieval.

I characterized the performance of distributed storage by sending 1000 `put` and 1000 `get` requests to a sharded in-memory key-value store (see `./harnesses/m4.harness.js`). Average throughput and latency are recorded in `package.json` (in rps, µs).

## Key Feature

> Why is the `reconf` method designed to first identify all the keys to be relocated and then relocate individual objects instead of fetching all the objects immediately and then pushing them to their corresponding locations?

If I understand the question correctly, fetching and pushing all objects would require performing an enormous amount of communication, while identifying the ones that need to be relocated first and then moving them would only move those objects that necessarily need to be moved, resulting in smaller communication cost.
