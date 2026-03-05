// MiniLang Built-in Functions
const { BuiltinFunction } = require('./environment');
const { RuntimeError } = require('./errors');

function createBuiltins() {
  const builtins = {};

  builtins.print = new BuiltinFunction('print', -1, (args) => {
    const output = args.map(a => formatValue(a)).join(' ');
    console.log(output);
    return null;
  });

  builtins.len = new BuiltinFunction('len', 1, (args) => {
    const val = args[0];
    if (typeof val === 'string') return val.length;
    if (Array.isArray(val)) return val.length;
    throw new RuntimeError(`len() expects string or array, got ${typeOf(val)}`);
  });

  builtins.push = new BuiltinFunction('push', 2, (args) => {
    const arr = args[0];
    if (!Array.isArray(arr)) {
      throw new RuntimeError(`push() expects array as first argument, got ${typeOf(arr)}`);
    }
    arr.push(args[1]);
    return arr;
  });

  builtins.type = new BuiltinFunction('type', 1, (args) => {
    return typeOf(args[0]);
  });

  builtins.str = new BuiltinFunction('str', 1, (args) => {
    return formatValue(args[0]);
  });

  builtins.int = new BuiltinFunction('int', 1, (args) => {
    const val = args[0];
    if (typeof val === 'number') return Math.floor(val);
    if (typeof val === 'string') {
      const n = parseInt(val, 10);
      if (isNaN(n)) throw new RuntimeError(`Cannot convert "${val}" to int`);
      return n;
    }
    if (typeof val === 'boolean') return val ? 1 : 0;
    throw new RuntimeError(`Cannot convert ${typeOf(val)} to int`);
  });

  return builtins;
}

function typeOf(value) {
  if (value === null) return 'null';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'boolean') return 'bool';
  if (Array.isArray(value)) return 'array';
  if (value && (value.constructor && value.constructor.name === 'MiniFunction')) return 'function';
  if (value && (value.constructor && value.constructor.name === 'BuiltinFunction')) return 'function';
  return 'unknown';
}

function formatValue(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return '[' + value.map(v => formatValueRepr(v)).join(', ') + ']';
  }
  if (value && value.toString) return value.toString();
  return String(value);
}

function formatValueRepr(value) {
  if (typeof value === 'string') return `"${value}"`;
  return formatValue(value);
}

module.exports = { createBuiltins, typeOf, formatValue };
