// MiniLang Interpreter - Tree-walking evaluator
const { Environment, MiniFunction, BuiltinFunction } = require('./environment');
const { RuntimeError, ReturnSignal } = require('./errors');
const { createBuiltins } = require('./builtins');

class Interpreter {
  constructor() {
    this.output = []; // captured output for testing
    this.globalEnv = new Environment();

    // Register builtins
    const builtins = createBuiltins();

    // Override print to capture output
    const self = this;
    builtins.print = new BuiltinFunction('print', -1, (args) => {
      const { formatValue } = require('./builtins');
      const output = args.map(a => formatValue(a)).join(' ');
      self.output.push(output);
      console.log(output);
      return null;
    });

    for (const [name, fn] of Object.entries(builtins)) {
      this.globalEnv.define(name, fn);
    }
  }

  run(ast) {
    return this.evaluate(ast, this.globalEnv);
  }

  evaluate(node, env) {
    if (!node) return null;

    switch (node.type) {
      case 'Program':
        return this.evalProgram(node, env);
      case 'BlockStatement':
        return this.evalBlock(node, env);
      case 'LetStatement':
        return this.evalLet(node, env);
      case 'ReturnStatement':
        return this.evalReturn(node, env);
      case 'ExpressionStatement':
        return this.evaluate(node.expression, env);
      case 'WhileStatement':
        return this.evalWhile(node, env);
      case 'ForStatement':
        return this.evalFor(node, env);

      // Expressions
      case 'NumberLiteral':
        return node.value;
      case 'StringLiteral':
        return node.value;
      case 'BoolLiteral':
        return node.value;
      case 'NullLiteral':
        return null;
      case 'ArrayLiteral':
        return node.elements.map(e => this.evaluate(e, env));
      case 'Identifier':
        return env.get(node.name, node.line, node.column);
      case 'UnaryExpr':
        return this.evalUnary(node, env);
      case 'BinaryExpr':
        return this.evalBinary(node, env);
      case 'AssignExpr':
        return this.evalAssign(node, env);
      case 'IfExpr':
        return this.evalIf(node, env);
      case 'FunctionLiteral':
        return this.evalFunctionLiteral(node, env);
      case 'CallExpr':
        return this.evalCall(node, env);
      case 'IndexExpr':
        return this.evalIndex(node, env);

      default:
        throw new RuntimeError(`Unknown node type: ${node.type}`, node.line, node.column);
    }
  }

  evalProgram(node, env) {
    let result = null;
    for (const stmt of node.body) {
      result = this.evaluate(stmt, env);
      if (result instanceof ReturnSignal) return result.value;
    }
    return result;
  }

  evalBlock(node, env) {
    let result = null;
    for (const stmt of node.statements) {
      result = this.evaluate(stmt, env);
      if (result instanceof ReturnSignal) return result;
    }
    return result;
  }

  evalLet(node, env) {
    const value = this.evaluate(node.value, env);
    env.define(node.name, value);
    return value;
  }

  evalReturn(node, env) {
    const value = node.value ? this.evaluate(node.value, env) : null;
    throw new ReturnSignal(value);
  }

  evalWhile(node, env) {
    let result = null;
    while (this.isTruthy(this.evaluate(node.condition, env))) {
      result = this.evaluate(node.body, env);
      if (result instanceof ReturnSignal) return result;
    }
    return result;
  }

  evalFor(node, env) {
    const loopEnv = new Environment(env);
    let result = null;

    // init
    if (node.init) {
      this.evaluate(node.init, loopEnv);
    }

    // loop
    while (true) {
      if (node.condition) {
        const cond = this.evaluate(node.condition, loopEnv);
        if (!this.isTruthy(cond)) break;
      }
      result = this.evaluate(node.body, loopEnv);
      if (result instanceof ReturnSignal) return result;
      if (node.update) {
        this.evaluate(node.update, loopEnv);
      }
    }
    return result;
  }

  evalUnary(node, env) {
    const operand = this.evaluate(node.operand, env);
    switch (node.operator) {
      case '-':
        if (typeof operand !== 'number')
          throw new RuntimeError(`Cannot negate ${typeof operand}`, node.line, node.column);
        return -operand;
      case '!':
        return !this.isTruthy(operand);
      default:
        throw new RuntimeError(`Unknown unary operator: ${node.operator}`, node.line, node.column);
    }
  }

  evalBinary(node, env) {
    // Short-circuit for logical operators
    if (node.operator === '&&') {
      const left = this.evaluate(node.left, env);
      if (!this.isTruthy(left)) return left;
      return this.evaluate(node.right, env);
    }
    if (node.operator === '||') {
      const left = this.evaluate(node.left, env);
      if (this.isTruthy(left)) return left;
      return this.evaluate(node.right, env);
    }

    const left = this.evaluate(node.left, env);
    const right = this.evaluate(node.right, env);

    switch (node.operator) {
      case '+':
        if (typeof left === 'number' && typeof right === 'number') return left + right;
        if (typeof left === 'string' || typeof right === 'string') return String(left) + String(right);
        throw new RuntimeError(`Cannot add ${typeof left} and ${typeof right}`, node.line, node.column);
      case '-':
        this.assertNumbers(left, right, '-', node);
        return left - right;
      case '*':
        this.assertNumbers(left, right, '*', node);
        return left * right;
      case '/':
        this.assertNumbers(left, right, '/', node);
        if (right === 0) throw new RuntimeError('Division by zero', node.line, node.column);
        return left / right;
      case '%':
        this.assertNumbers(left, right, '%', node);
        if (right === 0) throw new RuntimeError('Modulo by zero', node.line, node.column);
        return left % right;
      case '==': return left === right;
      case '!=': return left !== right;
      case '<':
        this.assertNumbers(left, right, '<', node);
        return left < right;
      case '>':
        this.assertNumbers(left, right, '>', node);
        return left > right;
      case '<=':
        this.assertNumbers(left, right, '<=', node);
        return left <= right;
      case '>=':
        this.assertNumbers(left, right, '>=', node);
        return left >= right;
      default:
        throw new RuntimeError(`Unknown operator: ${node.operator}`, node.line, node.column);
    }
  }

  evalAssign(node, env) {
    const value = this.evaluate(node.value, env);
    if (node.target.type === 'Identifier') {
      return env.set(node.target.name, value, node.target.line, node.target.column);
    }
    if (node.target.type === 'IndexExpr') {
      const obj = this.evaluate(node.target.object, env);
      const idx = this.evaluate(node.target.index, env);
      if (Array.isArray(obj)) {
        if (typeof idx !== 'number' || idx < 0 || idx >= obj.length) {
          throw new RuntimeError(`Array index out of bounds: ${idx}`, node.line, node.column);
        }
        obj[idx] = value;
        return value;
      }
      throw new RuntimeError('Cannot index-assign to non-array', node.line, node.column);
    }
    throw new RuntimeError('Invalid assignment target', node.line, node.column);
  }

  evalIf(node, env) {
    const condition = this.evaluate(node.condition, env);
    if (this.isTruthy(condition)) {
      return this.evaluate(node.consequence, env);
    } else if (node.alternative) {
      return this.evaluate(node.alternative, env);
    }
    return null;
  }

  evalFunctionLiteral(node, env) {
    const fn = new MiniFunction(node.params, node.body, env, node.name);
    if (node.name) {
      env.define(node.name, fn);
    }
    return fn;
  }

  evalCall(node, env) {
    const callee = this.evaluate(node.callee, env);
    const args = node.arguments.map(a => this.evaluate(a, env));

    if (callee instanceof BuiltinFunction) {
      if (callee.arity !== -1 && args.length !== callee.arity) {
        throw new RuntimeError(
          `${callee.name}() expects ${callee.arity} arguments, got ${args.length}`,
          node.line, node.column
        );
      }
      return callee.fn(args);
    }

    if (callee instanceof MiniFunction) {
      if (args.length !== callee.params.length) {
        throw new RuntimeError(
          `Function expects ${callee.params.length} arguments, got ${args.length}`,
          node.line, node.column
        );
      }
      const fnEnv = new Environment(callee.closure);
      callee.params.forEach((p, i) => fnEnv.define(p, args[i]));
      try {
        const result = this.evaluate(callee.body, fnEnv);
        if (result instanceof ReturnSignal) return result.value;
        return result;
      } catch (e) {
        if (e instanceof ReturnSignal) return e.value;
        throw e;
      }
    }

    throw new RuntimeError('Not a function', node.line, node.column);
  }

  evalIndex(node, env) {
    const obj = this.evaluate(node.object, env);
    const idx = this.evaluate(node.index, env);

    if (Array.isArray(obj)) {
      if (typeof idx !== 'number') {
        throw new RuntimeError(`Array index must be a number`, node.line, node.column);
      }
      if (idx < 0 || idx >= obj.length) return null;
      return obj[idx];
    }
    if (typeof obj === 'string') {
      if (typeof idx !== 'number') {
        throw new RuntimeError(`String index must be a number`, node.line, node.column);
      }
      if (idx < 0 || idx >= obj.length) return null;
      return obj[idx];
    }
    throw new RuntimeError(`Cannot index ${typeof obj}`, node.line, node.column);
  }

  // Helpers
  isTruthy(value) {
    if (value === null) return false;
    if (value === false) return false;
    if (value === 0) return false;
    if (value === '') return false;
    return true;
  }

  assertNumbers(left, right, op, node) {
    if (typeof left !== 'number' || typeof right !== 'number') {
      throw new RuntimeError(
        `Operator '${op}' requires numbers, got ${typeof left} and ${typeof right}`,
        node.line, node.column
      );
    }
  }
}

module.exports = { Interpreter };
