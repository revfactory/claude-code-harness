'use strict';

const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { Evaluator } = require('./evaluator');

function run(source, outputFn) {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const evaluator = new Evaluator(outputFn);
  return evaluator.run(ast);
}

// CLI entry point
if (require.main === module) {
  const fs = require('fs');
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Read from stdin
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => {
      try {
        run(input);
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
    });
  } else {
    // Read file
    try {
      const source = fs.readFileSync(args[0], 'utf8');
      run(source);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  }
}

module.exports = { run };
