'use strict';

// AST Node constructors

function SelectStatement({ distinct = false, columns, from, where = null, groupBy = null, having = null, orderBy = null, limit = null, offset = null }) {
  return { type: 'SelectStatement', distinct, columns, from, where, groupBy, having, orderBy, limit, offset };
}

function CreateTableStatement({ name, columns }) {
  return { type: 'CreateTableStatement', name, columns };
}

function DropTableStatement({ name }) {
  return { type: 'DropTableStatement', name };
}

function InsertStatement({ table, columns, values }) {
  return { type: 'InsertStatement', table, columns, values };
}

function UpdateStatement({ table, assignments, where = null }) {
  return { type: 'UpdateStatement', table, assignments, where };
}

function DeleteStatement({ table, where = null }) {
  return { type: 'DeleteStatement', table, where };
}

// Expression nodes
function ColumnRef(table, name) {
  return { type: 'Column', table, name };
}

function NumberLiteral(value) {
  return { type: 'Number', value };
}

function StringLiteral(value) {
  return { type: 'String', value };
}

function NullLiteral() {
  return { type: 'Null' };
}

function BinaryExpr(op, left, right) {
  return { type: 'BinaryExpr', op, left, right };
}

function UnaryExpr(op, operand) {
  return { type: 'UnaryExpr', op, operand };
}

function InExpr(expr, values, negated = false) {
  return { type: 'InExpr', expr, values, negated };
}

function BetweenExpr(expr, low, high, negated = false) {
  return { type: 'BetweenExpr', expr, low, high, negated };
}

function LikeExpr(expr, pattern, negated = false) {
  return { type: 'LikeExpr', expr, pattern, negated };
}

function IsNullExpr(expr, negated = false) {
  return { type: 'IsNullExpr', expr, negated };
}

function AggregateExpr(fn, arg) {
  return { type: 'Aggregate', fn, arg };
}

function SubqueryExpr(query) {
  return { type: 'Subquery', query };
}

function TableRef(name, alias = null) {
  return { type: 'TableRef', name, alias };
}

function JoinClause(joinType, table, on) {
  return { type: 'JoinClause', joinType, table, on };
}

function ColumnDef(name, dataType, primaryKey = false) {
  return { type: 'ColumnDef', name, dataType, primaryKey };
}

function SelectColumn(expr, alias = null) {
  return { expr, alias };
}

function OrderByItem(expr, direction = 'ASC') {
  return { expr, direction };
}

function Assignment(column, value) {
  return { column, value };
}

module.exports = {
  SelectStatement, CreateTableStatement, DropTableStatement,
  InsertStatement, UpdateStatement, DeleteStatement,
  ColumnRef, NumberLiteral, StringLiteral, NullLiteral,
  BinaryExpr, UnaryExpr, InExpr, BetweenExpr, LikeExpr, IsNullExpr,
  AggregateExpr, SubqueryExpr,
  TableRef, JoinClause, ColumnDef,
  SelectColumn, OrderByItem, Assignment
};
