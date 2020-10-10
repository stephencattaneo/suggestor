import Suggestor from "../suggestor.js";

const lang = {
  number_keyword: {
    type: 'number',
    ops: ["=", "!=", "<", "<=", ">=", ">"],
  },
  boolean_keyword: {
    type: 'boolean',
    ops: ["=", "!="],
  },
  string_keyword: {
    type: "string",
    ops: ["=", "!=", "<>", "!<>"],
  },
};

test('undefined', () => {
  expect((new Suggestor(lang)).process(undefined)).toEqual([
    'number_keyword', 'boolean_keyword', 'string_keyword', '('
  ]);
});

test('empty string', () => {
  expect((new Suggestor(lang)).process('')).toEqual([
    'number_keyword', 'boolean_keyword', 'string_keyword', '('
  ]);
});

test('keyword', () => {
  expect((new Suggestor(lang)).process('string_keyword')).toEqual([
    "=", "!=", "<>", "!<>"
  ]);
});

test('keyword with trailing space', () => {
  expect((new Suggestor(lang)).process('string_keyword ')).toEqual([
    "=", "!=", "<>", "!<>"
  ]);
});

test('<keyword> <operator> for bool', () => {
  expect((new Suggestor(lang)).process('boolean_keyword != ')).toEqual('boolean');
});

test('<keyword> <operator> for string', () => {
  expect((new Suggestor(lang)).process('string_keyword != ')).toEqual('string');
});

test('<keyword> <operator> for int', () => {
  expect((new Suggestor(lang)).process('number_keyword != ')).toEqual('number');
});

test('<keyword> <operator> <bool>', () => {
  expect((new Suggestor(lang)).process('boolean_keyword != true')).toEqual(['COMPLETE']);
});

test('<keyword> <operator> <str>', () => {
  expect((new Suggestor(lang)).process('string_keyword != "foo bar"')).toEqual(['COMPLETE']);
});

test('<keyword> <operator> <int>', () => {
  expect((new Suggestor(lang)).process('number_keyword != 7')).toEqual(['COMPLETE']);
});

test('(', () => {
  expect((new Suggestor(lang)).process('( ')).toEqual([
    'number_keyword', 'boolean_keyword', 'string_keyword',
  ]);
});

test('closing paren', () => {
  expect((new Suggestor(lang)).process('( number_keyword != 7 ')).toEqual(['AND', ')']);
});

test('complete parens', () => {
  expect((new Suggestor(lang)).process('( number_keyword != 7 )')).toEqual(['OR', 'COMPLETE']);
});

test('complete parens', () => {
  expect((new Suggestor(lang)).process('( number_keyword != 7 ) OR ')).toEqual(['(']);
});

test('( <keyword> <operator> <int> and ', () => {
  expect((new Suggestor(lang)).process('( number_keyword != 7 and ')).toEqual([
    'number_keyword', 'boolean_keyword', 'string_keyword',
  ]);
});
