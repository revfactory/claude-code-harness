#!/usr/bin/env node
'use strict';

const { Storage } = require('./storage');
const { Executor } = require('./executor');
const { Formatter } = require('./formatter');
const { startRepl } = require('./repl');

// Programmatic API
function createEngine() {
  const storage = new Storage();
  const executor = new Executor(storage);

  return {
    execute(sql) {
      return executor.execute(sql);
    },
    format(result) {
      return Formatter.formatResult(result);
    },
    run(sql) {
      const result = executor.execute(sql);
      return Formatter.formatResult(result);
    }
  };
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length > 0 && (args[0] === '--sql' || args[0] === '-e')) {
    // Execute SQL from command line
    const engine = createEngine();
    const sql = args.slice(1).join(' ');
    try {
      console.log(engine.run(sql));
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  } else {
    // Interactive REPL
    startRepl();
  }
}

module.exports = { createEngine, Storage, Executor, Formatter };
