'use strict';

class Storage {
  constructor() {
    this.tables = new Map();
    this.schemas = new Map();
  }

  createTable(name, columnDefs) {
    const lowerName = name.toLowerCase();
    if (this.tables.has(lowerName)) {
      throw new Error(`Table '${name}' already exists`);
    }
    this.schemas.set(lowerName, columnDefs.map(c => ({
      name: c.name,
      dataType: c.dataType,
      primaryKey: c.primaryKey || false
    })));
    this.tables.set(lowerName, []);
  }

  dropTable(name) {
    const lowerName = name.toLowerCase();
    if (!this.tables.has(lowerName)) {
      throw new Error(`Table '${name}' does not exist`);
    }
    this.tables.delete(lowerName);
    this.schemas.delete(lowerName);
  }

  getTable(name) {
    const lowerName = name.toLowerCase();
    if (!this.tables.has(lowerName)) {
      throw new Error(`Table '${name}' does not exist`);
    }
    return this.tables.get(lowerName);
  }

  getSchema(name) {
    const lowerName = name.toLowerCase();
    if (!this.schemas.has(lowerName)) {
      throw new Error(`Table '${name}' does not exist`);
    }
    return this.schemas.get(lowerName);
  }

  getColumnNames(name) {
    return this.getSchema(name).map(c => c.name);
  }

  insertRow(tableName, columns, values) {
    const lowerName = tableName.toLowerCase();
    const schema = this.getSchema(tableName);
    const schemaNames = schema.map(c => c.name.toLowerCase());
    const row = {};

    // Initialize all columns to null
    for (const col of schema) {
      row[col.name] = null;
    }

    if (columns) {
      // Named insert
      for (let i = 0; i < columns.length; i++) {
        const colName = columns[i];
        const schemaIdx = schemaNames.indexOf(colName.toLowerCase());
        if (schemaIdx === -1) {
          throw new Error(`Column '${colName}' does not exist in table '${tableName}'`);
        }
        row[schema[schemaIdx].name] = this.coerceValue(values[i], schema[schemaIdx].dataType);
      }
    } else {
      // Positional insert
      if (values.length > schema.length) {
        throw new Error(`Too many values for table '${tableName}'`);
      }
      for (let i = 0; i < values.length; i++) {
        row[schema[i].name] = this.coerceValue(values[i], schema[i].dataType);
      }
    }

    this.tables.get(lowerName).push(row);
    return row;
  }

  coerceValue(value, dataType) {
    if (value === null) return null;
    switch (dataType.toUpperCase()) {
      case 'INT':
        return typeof value === 'number' ? Math.trunc(value) : parseInt(value, 10);
      case 'FLOAT':
        return typeof value === 'number' ? value : parseFloat(value);
      case 'TEXT':
        return String(value);
      default:
        return value;
    }
  }

  updateRows(tableName, assignments, predicate) {
    const rows = this.getTable(tableName);
    let count = 0;
    for (const row of rows) {
      if (!predicate || predicate(row)) {
        for (const [col, val] of Object.entries(assignments)) {
          row[col] = val;
        }
        count++;
      }
    }
    return count;
  }

  deleteRows(tableName, predicate) {
    const lowerName = tableName.toLowerCase();
    const rows = this.getTable(tableName);
    const before = rows.length;
    const remaining = predicate ? rows.filter(row => !predicate(row)) : [];
    this.tables.set(lowerName, remaining);
    return before - remaining.length;
  }
}

module.exports = { Storage };
