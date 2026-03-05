#!/usr/bin/env node
// MiniLang CLI - File execution and REPL
const fs = require('fs');
const path = require('path');
const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { Interpreter } = require('./interpreter');
const { startRepl } = require('./repl');
const { MiniLangError } = require('./errors');

function runFile(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found: ${absolutePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(absolutePath, 'utf-8');
  return runSource(source);
}

function runSource(source) {
  try {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const interpreter = new Interpreter();
    return interpreter.run(ast);
  } catch (e) {
    if (e instanceof MiniLangError) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
}

// CLI entry
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    startRepl();
  } else {
    runFile(args[0]);
  }
}

module.exports = { runFile, runSource };
