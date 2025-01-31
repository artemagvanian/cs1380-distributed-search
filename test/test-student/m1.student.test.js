/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const util = distribution.util;

test('(1 pts) student test', () => {
  const hof = function() {
    // eslint-disable-next-line
    return (a, b) => a + b + 'foo' + "foo";
  };
  const serialized = util.serialize(hof);
  const deserialized = util.deserialize(serialized);
  expect(deserialized()('a', 'b')).toEqual('abfoofoo');
});


test('(1 pts) student test', () => {
  const arrayOfArrays = [
    [1, 2, 3],
    ['a', 'b', 'c'],
  ];
  const serialized = util.serialize(arrayOfArrays);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(arrayOfArrays);
});


test('(1 pts) student test', () => {
  const objectOfObjects = {
    a: {a: 5, b: 6},
  };
  const serialized = util.serialize(objectOfObjects);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(objectOfObjects);
});

test('(1 pts) student test', () => {
  const emptyObject = {};
  const serialized = util.serialize(emptyObject);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(emptyObject);
});

test('(1 pts) student test', () => {
  const emptyArray = [];
  const serialized = util.serialize(emptyArray);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(emptyArray);
});
