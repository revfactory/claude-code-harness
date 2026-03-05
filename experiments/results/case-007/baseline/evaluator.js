'use strict';

const { NodeType } = require('./parser');

class RuntimeError extends Error {
  constructor(message, line, col) {
    super(`Runtime error at ${line}:${col}: ${message}`);
    this.line = line;
    this.col = col;
  }
}

class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}

class Environment {
  constructor(parent = null) {
    this.vars = new Map();
    this.parent = parent;
  }

  define(name, value) {
    this.vars.set(name, value);
  }

  get(name, line, col) {
    if (this.vars.has(name)) return this.vars.get(name);
    if (this.parent) return this.parent.get(name, line, col);
    throw new RuntimeError(`Undefined variable '${name}'`, line, col);
  }

  set(name, value, line, col) {
    if (this.vars.has(name)) {
      this.vars.set(name, value);
      return;
    }
    if (this.parent) {
      this.parent.set(name, value, line, col);
      return;
    }
    throw new RuntimeError(`Undefined variable '${name}'`, line, col);
  }
}

class MiniLangFunction {
  constructor(name, params, body, closure) {
    this.name = name || '<anonymous>';
    this.params = params;
    this.body = body;
    this.closure = closure;
  }
}

class Evaluator {
  constructor(outputFn) {
    this.output = outputFn || console.log;
  }

  run(ast) {
    const globalEnv = new Environment();
    this.defineBuiltins(globalEnv);
    return this.execBlock(ast.body, globalEnv);
  }

  defineBuiltins(env) {
    env.define('print', { builtin: true, name: 'print', call: (args) => {
      const formatted = args.map(a => this.formatValue(a)).join(' ');
      this.output(formatted);
      return null;
    }});

    env.define('len', { builtin: true, name: 'len', call: (args) => {
      if (args.length !== 1) throw new RuntimeError('len() expects 1 argument', 0, 0);
      const val = args[0];
      if (Array.isArray(val)) return val.length;
      if (typeof val === 'string') return val.length;
      throw new RuntimeError('len() expects array or string', 0, 0);
    }});

    env.define('push', { builtin: true, name: 'push', call: (args) => {
      if (args.length !== 2) throw new RuntimeError('push() expects 2 arguments', 0, 0);
      if (!Array.isArray(args[0])) throw new RuntimeError('push() first arg must be array', 0, 0);
      args[0].push(args[1]);
      return null;
    }});

    env.define('type', { builtin: true, name: 'type', call: (args) => {
      if (args.length !== 1) throw new RuntimeError('type() expects 1 argument', 0, 0);
      const val = args[0];
      if (val === null) return 'null';
      if (Array.isArray(val)) return 'array';
      if (val instanceof MiniLangFunction || (val && val.builtin)) return 'function';
      return typeof val;  // 'number', 'string', 'boolean'
    }});

    env.define('str', { builtin: true, name: 'str', call: (args) => {
      if (args.length !== 1) throw new RuntimeError('str() expects 1 argument', 0, 0);
      return this.formatValue(args[0]);
    }});

    env.define('int', { builtin: true, name: 'int', call: (args) => {
      if (args.length !== 1) throw new RuntimeError('int() expects 1 argument', 0, 0);
      const val = args[0];
      if (typeof val === 'number') return Math.trunc(val);
      if (typeof val === 'string') {
        const n = parseInt(val, 10);
        if (isNaN(n)) throw new RuntimeError(`Cannot convert '${val}' to int`, 0, 0);
        return n;
      }
      throw new RuntimeError('int() expects number or string', 0, 0);
    }});
  }

  formatValue(val) {
    if (val === null) return 'null';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (Array.isArray(val)) {
      return '[' + val.map(v => this.formatValue(v)).join(',') + ']';
    }
    if (val instanceof MiniLangFunction) return `<fn ${val.name}>`;
    if (val && val.builtin) return `<builtin ${val.name}>`;
    return String(val);
  }

  execBlock(statements, env) {
    let result = null;
    for (const stmt of statements) {
      result = this.execStatement(stmt, env);
      if (result instanceof ReturnSignal) return result;
    }
    return result;
  }

  execStatement(node, env) {
    switch (node.type) {
      case NodeType.LetDeclaration: {
        const value = this.evalExpr(node.init, env);
        env.define(node.name, value);
        return null;
      }

      case NodeType.FunctionDecl: {
        const fn = new MiniLangFunction(node.name, node.params, node.body, env);
        env.define(node.name, fn);
        return null;
      }

      case NodeType.ReturnStmt: {
        const value = node.value ? this.evalExpr(node.value, env) : null;
        return new ReturnSignal(value);
      }

      case NodeType.IfStmt: {
        const cond = this.evalExpr(node.condition, env);
        if (this.isTruthy(cond)) {
          return this.execBlock(node.consequent.body, new Environment(env));
        } else if (node.alternate) {
          if (node.alternate.type === NodeType.IfStmt) {
            return this.execStatement(node.alternate, env);
          }
          return this.execBlock(node.alternate.body, new Environment(env));
        }
        return null;
      }

      case NodeType.WhileStmt: {
        while (this.isTruthy(this.evalExpr(node.condition, env))) {
          const result = this.execBlock(node.body.body, new Environment(env));
          if (result instanceof ReturnSignal) return result;
        }
        return null;
      }

      case NodeType.ForStmt: {
        const forEnv = new Environment(env);
        if (node.init) this.execStatement(node.init, forEnv);
        while (!node.condition || this.isTruthy(this.evalExpr(node.condition, forEnv))) {
          const bodyEnv = new Environment(forEnv);
          const result = this.execBlock(node.body.body, bodyEnv);
          if (result instanceof ReturnSignal) return result;
          if (node.update) this.evalExpr(node.update, forEnv);
        }
        return null;
      }

      case NodeType.Block: {
        return this.execBlock(node.body, new Environment(env));
      }

      case NodeType.ExpressionStmt: {
        this.evalExpr(node.expression, env);
        return null;
      }

      default:
        throw new RuntimeError(`Unknown statement type: ${node.type}`, node.line || 0, node.col || 0);
    }
  }

  evalExpr(node, env) {
    switch (node.type) {
      case NodeType.NumberLiteral:
      case NodeType.StringLiteral:
      case NodeType.BooleanLiteral:
      case NodeType.NullLiteral:
        return node.value;

      case NodeType.Identifier:
        return env.get(node.name, node.line, node.col);

      case NodeType.ArrayLiteral:
        return node.elements.map(e => this.evalExpr(e, env));

      case NodeType.Assignment: {
        const value = this.evalExpr(node.value, env);
        env.set(node.name, value, node.line, node.col);
        return value;
      }

      case NodeType.IndexAssignment: {
        const obj = this.evalExpr(node.object, env);
        const idx = this.evalExpr(node.index, env);
        const val = this.evalExpr(node.value, env);
        if (!Array.isArray(obj)) throw new RuntimeError('Index assignment on non-array', node.line, node.col);
        obj[idx] = val;
        return val;
      }

      case NodeType.BinaryExpr:
        return this.evalBinary(node, env);

      case NodeType.UnaryExpr: {
        const operand = this.evalExpr(node.operand, env);
        if (node.op === '!') return !this.isTruthy(operand);
        if (node.op === '-') return -operand;
        throw new RuntimeError(`Unknown unary op: ${node.op}`, node.line, node.col);
      }

      case NodeType.FunctionExpr:
        return new MiniLangFunction(null, node.params, node.body, env);

      case NodeType.CallExpr: {
        const callee = this.evalExpr(node.callee, env);
        const args = node.args.map(a => this.evalExpr(a, env));

        if (callee && callee.builtin) {
          return callee.call(args);
        }

        if (callee instanceof MiniLangFunction) {
          const callEnv = new Environment(callee.closure);
          for (let i = 0; i < callee.params.length; i++) {
            callEnv.define(callee.params[i], i < args.length ? args[i] : null);
          }
          const result = this.execBlock(callee.body.body, callEnv);
          if (result instanceof ReturnSignal) return result.value;
          return null;
        }

        throw new RuntimeError('Calling a non-function', node.line, node.col);
      }

      case NodeType.IndexExpr: {
        const obj = this.evalExpr(node.object, env);
        const idx = this.evalExpr(node.index, env);
        if (Array.isArray(obj)) {
          if (typeof idx !== 'number') throw new RuntimeError('Array index must be a number', node.line, node.col);
          return obj[idx] !== undefined ? obj[idx] : null;
        }
        if (typeof obj === 'string') {
          return obj[idx] !== undefined ? obj[idx] : null;
        }
        throw new RuntimeError('Index access on non-indexable value', node.line, node.col);
      }

      default:
        throw new RuntimeError(`Unknown expression type: ${node.type}`, node.line || 0, node.col || 0);
    }
  }

  evalBinary(node, env) {
    // Short-circuit for logical operators
    if (node.op === '&&') {
      const left = this.evalExpr(node.left, env);
      if (!this.isTruthy(left)) return left;
      return this.evalExpr(node.right, env);
    }
    if (node.op === '||') {
      const left = this.evalExpr(node.left, env);
      if (this.isTruthy(left)) return left;
      return this.evalExpr(node.right, env);
    }

    const left = this.evalExpr(node.left, env);
    const right = this.evalExpr(node.right, env);

    switch (node.op) {
      case '+':
        if (typeof left === 'string' || typeof right === 'string')
          return String(left) + String(right);
        return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/':
        if (right === 0) throw new RuntimeError('Division by zero', node.line, node.col);
        return left / right;
      case '%': return left % right;
      case '==': return left === right;
      case '!=': return left !== right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      default:
        throw new RuntimeError(`Unknown operator: ${node.op}`, node.line, node.col);
    }
  }

  isTruthy(val) {
    if (val === null) return false;
    if (val === false) return false;
    if (val === 0) return false;
    if (val === '') return false;
    return true;
  }
}

module.exports = { Evaluator, Environment, MiniLangFunction, RuntimeError, ReturnSignal };
