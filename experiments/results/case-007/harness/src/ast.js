// MiniLang AST Node Types

function node(type, props) {
  return { type, ...props };
}

const AST = {
  // Statements
  Program(body) {
    return node('Program', { body });
  },
  LetStatement(name, value, line, column) {
    return node('LetStatement', { name, value, line, column });
  },
  ReturnStatement(value, line, column) {
    return node('ReturnStatement', { value, line, column });
  },
  ExpressionStatement(expression, line, column) {
    return node('ExpressionStatement', { expression, line, column });
  },
  BlockStatement(statements, line, column) {
    return node('BlockStatement', { statements, line, column });
  },
  WhileStatement(condition, body, line, column) {
    return node('WhileStatement', { condition, body, line, column });
  },
  ForStatement(init, condition, update, body, line, column) {
    return node('ForStatement', { init, condition, update, body, line, column });
  },

  // Expressions
  Identifier(name, line, column) {
    return node('Identifier', { name, line, column });
  },
  NumberLiteral(value, line, column) {
    return node('NumberLiteral', { value, line, column });
  },
  StringLiteral(value, line, column) {
    return node('StringLiteral', { value, line, column });
  },
  BoolLiteral(value, line, column) {
    return node('BoolLiteral', { value, line, column });
  },
  NullLiteral(line, column) {
    return node('NullLiteral', { value: null, line, column });
  },
  ArrayLiteral(elements, line, column) {
    return node('ArrayLiteral', { elements, line, column });
  },
  BinaryExpr(operator, left, right, line, column) {
    return node('BinaryExpr', { operator, left, right, line, column });
  },
  UnaryExpr(operator, operand, line, column) {
    return node('UnaryExpr', { operator, operand, line, column });
  },
  AssignExpr(target, value, line, column) {
    return node('AssignExpr', { target, value, line, column });
  },
  IfExpr(condition, consequence, alternative, line, column) {
    return node('IfExpr', { condition, consequence, alternative, line, column });
  },
  FunctionLiteral(params, body, name, line, column) {
    return node('FunctionLiteral', { params, body, name, line, column });
  },
  CallExpr(callee, args, line, column) {
    return node('CallExpr', { callee, arguments: args, line, column });
  },
  IndexExpr(object, index, line, column) {
    return node('IndexExpr', { object, index, line, column });
  },
};

module.exports = { AST };
