/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const local = distribution.local;
const id = distribution.util.id;

test('(1 pts) student test', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: 'get'};
  const message = ['counts'];

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBeTruthy();
      expect(v).toBe(1);
      local.comm.send(message, remote, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toBeTruthy();
          expect(v).toBe(2);
          done();
        } catch (error) {
          done(error);
        }
      });
    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: 'get'};
  const message = ['nid'];

  local.comm.send(['foo'], remote, (e, v) => {
    try {
      expect(e).toBeTruthy();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      local.comm.send(message, remote, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toBeTruthy();
          expect(v).toBe(id.getNID(node));
          done();
        } catch (error) {
          done(error);
        }
      });
    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  const node = distribution.node.config;
  local.comm.send(
      [{get42: (cb) => cb(null, 42)}, '42Service'],
      {node: node, service: 'routes', method: 'put'},
      (e, _) => {
        try {
          expect(e).toBeFalsy();
          local.comm.send([], {node: node, service: '42Service', method: 'get42'}, (e, v) => {
            expect(e).toBeFalsy();
            expect(v).toBeTruthy();
            expect(v).toBe(42);
            done();
          });
        } catch (error) {
          done(error);
        }
      });
});

test('(1 pts) student test', (done) => {
  const node = distribution.node.config;
  local.comm.send(
      [{add: (a, b, cb) => cb(null, a + b)}, 'adderService'],
      {node: node, service: 'routes', method: 'put'},
      (e, _) => {
        try {
          expect(e).toBeFalsy();
          local.comm.send([1, 2], {node: node, service: 'adderService', method: 'add'}, (e, v) => {
            expect(e).toBeFalsy();
            expect(v).toBeTruthy();
            expect(v).toBe(3);
            done();
          });
        } catch (error) {
          done(error);
        }
      });
});

test('(1 pts) student test', (done) => {
  const node = distribution.node.config;
  local.comm.send(
      [{accum: (a, cb) => {
        if (global.s) {
          global.s += a;
        } else {
          global.s = a;
        }
        cb(null, global.s);
      }}, 'accumService'],
      {node: node, service: 'routes', method: 'put'},
      (e, _) => {
        try {
          expect(e).toBeFalsy();
          local.comm.send([1], {node: node, service: 'accumService', method: 'accum'}, (e, v) => {
            expect(e).toBeFalsy();
            expect(v).toBeTruthy();
            expect(v).toBe(1);
            local.comm.send([2], {node: node, service: 'accumService', method: 'accum'}, (e, v) => {
              expect(e).toBeFalsy();
              expect(v).toBeTruthy();
              expect(v).toBe(3);
              done();
            });
          });
        } catch (error) {
          done(error);
        }
      });
});

let localServer = null;

beforeAll((done) => {
  distribution.node.start((server) => {
    localServer = server;
    done();
  });
});

afterAll((done) => {
  localServer.close();
  done();
});
