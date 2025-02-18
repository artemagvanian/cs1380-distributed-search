/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const id = distribution.util.id;

test('(1 pts) student test', (done) => {
  const nids = Object.values(mygroupGroup).map((node) => id.getSID(node));
  distribution.mygroup.status.get('sid', (e, v) => {
    try {
      expect(e).toEqual({});
      expect(Object.values(v).length).toBe(nids.length);
      expect(Object.values(v)).toEqual(expect.arrayContaining(nids));
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(1 pts) student test', (done) => {
  distribution.mygroup.status.get('nonExistent', (e, v) => {
    try {
      expect(v).toEqual({});
      Object.keys(mygroupGroup).forEach((sid) => {
        expect(e[sid]).toBeInstanceOf(Error);
      });
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(1 pts) student test', (done) => {
  const myService = {my: () => 'hello!'};
  distribution.mygroup.routes.put(myService,
      'myService', (e, v) => {
        const r = {service: 'routes', method: 'get'};
        distribution.mygroup.comm.send(['myService'], r, (e, v) => {
          try {
            expect(e).toEqual({});
            Object.keys(mygroupGroup).forEach((sid) => {
              expect(v[sid].my()).toEqual('hello!');
            });
            done();
          } catch (error) {
            done(error);
            return;
          }
        });
      });
});


test('(1 pts) student test', (done) => {
  const myService = {my: () => 'hello!'};
  distribution.mygroup.routes.put(myService,
      'myService2', (e, v) => {
        const r = {service: 'routes', method: 'get'};
        distribution.mygroup.comm.send(['nonExistent'], r, (e, v) => {
          try {
            expect(v).toEqual({});
            Object.keys(mygroupGroup).forEach((sid) => {
              expect(e[sid]).toBeInstanceOf(Error);
            });
            done();
          } catch (error) {
            done(error);
            return;
          }
        });
      });
});

test('(1 pts) student test', (done) => {
  mygroupGroup[id.getSID(n4)] = n4;
  const sids = Object.values(mygroupGroup).map((node) => id.getSID(node));
  distribution.mygroup.status.get('sid', (e, v) => {
    try {
      expect(Object.values(v).length).toBe(sids.length);
      expect(Object.values(v)).toEqual(expect.arrayContaining(sids));
      done();
    } catch (error) {
      done(error);
    }
  });
});

//  --------- Setup code taken from the handout tests. -----------

const mygroupGroup = {};

let localServer = null;

const n1 = {ip: '127.0.0.1', port: 8000};
const n2 = {ip: '127.0.0.1', port: 8001};
const n3 = {ip: '127.0.0.1', port: 8002};
const n4 = {ip: '127.0.0.1', port: 8003};

beforeAll((done) => {
  // First, stop the nodes if they are running
  const remote = {service: 'status', method: 'stop'};

  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
        });
      });
    });
  });

  mygroupGroup[id.getSID(n1)] = n1;
  mygroupGroup[id.getSID(n2)] = n2;
  mygroupGroup[id.getSID(n3)] = n3;

  // Now, start the base listening node
  distribution.node.start((server) => {
    localServer = server;

    const groupInstantiation = (e, v) => {
      const mygroupConfig = {gid: 'mygroup'};

      // Create some groups
      distribution.local.groups
          .put(mygroupConfig, mygroupGroup, (e, v) => {
            done();
          });
    };

    // Start the nodes
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          distribution.local.status.spawn(n4, groupInstantiation);
        });
      });
    });
  });
});

afterAll((done) => {
  distribution.mygroup.status.stop((e, v) => {
    const remote = {service: 'status', method: 'stop'};
    remote.node = n1;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n2;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n3;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n4;
          distribution.local.comm.send([], remote, (e, v) => {
            localServer.close();
            done();
          });
        });
      });
    });
  });
});

//  --------- Setup code ends. -----------
