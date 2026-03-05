'use strict';

const readline = require('readline');
const { Storage } = require('./storage');
const { Executor } = require('./executor');
const { Formatter } = require('./formatter');

function startRepl() {
  const storage = new Storage();
  const executor = new Executor(storage);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'sql> '
  });

  console.log('In-Memory SQL Query Engine');
  console.log('Type SQL statements. Use Ctrl+D or "exit" to quit.\n');

  let buffer = '';

  rl.prompt();
  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      rl.close();
      return;
    }

    buffer += ' ' + line;

    // Execute on semicolon
    if (trimmed.endsWith(';')) {
      try {
        const result = executor.execute(buffer.trim());
        if (Array.isArray(result)) {
          result.forEach(r => console.log(Formatter.formatResult(r)));
        } else {
          console.log(Formatter.formatResult(result));
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
      }
      buffer = '';
      console.log();
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nGoodbye!');
    process.exit(0);
  });
}

module.exports = { startRepl };
