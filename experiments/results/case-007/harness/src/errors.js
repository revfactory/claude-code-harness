// MiniLang Error Classes

class MiniLangError extends Error {
  constructor(message, line, column) {
    super(line != null ? `[${line}:${column}] ${message}` : message);
    this.name = this.constructor.name;
    this.sourceLine = line;
    this.sourceColumn = column;
  }
}

class LexerError extends MiniLangError {
  constructor(message, line, column) {
    super(message, line, column);
  }
}

class ParseError extends MiniLangError {
  constructor(message, line, column) {
    super(message, line, column);
  }
}

class RuntimeError extends MiniLangError {
  constructor(message, line, column) {
    super(message, line, column);
  }
}

class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}

module.exports = { MiniLangError, LexerError, ParseError, RuntimeError, ReturnSignal };
