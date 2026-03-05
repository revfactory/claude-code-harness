// MiniLang REPL - Interactive execution environment
const readline = require('readline');
const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { Interpreter } = require('./interpreter');
const { formatValue } = require('./builtins');
const { MiniLangError } = require('./errors');

function startRepl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'minilang> ',
  });

  const interpreter = new Interpreter();

  console.log('MiniLang REPL v1.0 - Type "exit" to quit');
  rl.prompt();

  rl.on('line', (line) => {
    const input = line.trim();
    if (input === 'exit' || input === 'quit') {
      rl.close();
      return;
    }
    if (input === '') {
      rl.prompt();
      return;
    }

    try {
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      const result = interpreter.run(ast);
      if (result !== null && result !== undefined) {
        console.log(formatValue(result));
      }
    } catch (e) {
      if (e instanceof MiniLangError) {
        console.error(`Error: ${e.message}`);
      } else if (e.value !== undefined) {
        // ReturnSignal at top level
        console.log(formatValue(e.value));
      } else {
        console.error(`Internal error: ${e.message}`);
      }
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nGoodbye!');
    process.exit(0);
  });
}

module.exports = { startRepl };
