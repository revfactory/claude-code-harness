// MiniLang Environment - Scope chain with closure support
const { RuntimeError } = require('./errors');

class Environment {
  constructor(parent = null) {
    this.store = new Map();
    this.parent = parent;
  }

  get(name, line, column) {
    if (this.store.has(name)) return this.store.get(name);
    if (this.parent) return this.parent.get(name, line, column);
    throw new RuntimeError(`Undefined variable: ${name}`, line, column);
  }

  set(name, value, line, column) {
    // Update existing variable in scope chain
    if (this.store.has(name)) {
      this.store.set(name, value);
      return value;
    }
    if (this.parent) return this.parent.set(name, value, line, column);
    throw new RuntimeError(`Undefined variable: ${name}`, line, column);
  }

  define(name, value) {
    // Declare new variable in current scope
    this.store.set(name, value);
    return value;
  }

  has(name) {
    if (this.store.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }
}

class MiniFunction {
  constructor(params, body, closure, name = null) {
    this.params = params;
    this.body = body;
    this.closure = closure; // Environment at definition time
    this.name = name;
  }

  toString() {
    const name = this.name || 'anonymous';
    return `<fn ${name}(${this.params.join(', ')})>`;
  }
}

class BuiltinFunction {
  constructor(name, arity, fn) {
    this.name = name;
    this.arity = arity; // -1 for variadic
    this.fn = fn;
  }

  toString() {
    return `<builtin ${this.name}>`;
  }
}

module.exports = { Environment, MiniFunction, BuiltinFunction };
