'use strict';

class Formatter {
  static formatResult(result) {
    if (!result) return '';

    if (result.type === 'SELECT') {
      return Formatter.formatTable(result.rows, result.columns);
    }

    if (result.message) return result.message;
    if (result.rowsAffected !== undefined) {
      return `${result.type}: ${result.rowsAffected} row(s) affected`;
    }

    return JSON.stringify(result);
  }

  static formatTable(rows, columns) {
    if (!rows || rows.length === 0) {
      return '(empty result set)';
    }

    const cols = columns && columns.length > 0 ? columns : Object.keys(rows[0]);

    // Calculate column widths
    const widths = cols.map(col => {
      const headerLen = String(col).length;
      const maxDataLen = rows.reduce((max, row) => {
        const val = row[col];
        const len = val === null || val === undefined ? 4 : String(val).length;
        return Math.max(max, len);
      }, 0);
      return Math.max(headerLen, maxDataLen);
    });

    const lines = [];

    // Header
    const header = cols.map((col, i) => String(col).padEnd(widths[i])).join(' | ');
    lines.push(header);
    lines.push(widths.map(w => '-'.repeat(w)).join('-+-'));

    // Data rows
    for (const row of rows) {
      const line = cols.map((col, i) => {
        const val = row[col];
        const str = val === null || val === undefined ? 'NULL' : String(val);
        return str.padEnd(widths[i]);
      }).join(' | ');
      lines.push(line);
    }

    lines.push(`(${rows.length} row${rows.length === 1 ? '' : 's'})`);
    return lines.join('\n');
  }
}

module.exports = { Formatter };
