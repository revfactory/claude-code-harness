# LSP 프로토콜 상세

## JSON-RPC 메시지 형식

### 헤더
```
Content-Length: <byte count>\r\n
\r\n
<JSON-RPC message>
```

### Request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "textDocument/completion",
  "params": {
    "textDocument": { "uri": "file:///path/to/file.mini" },
    "position": { "line": 5, "character": 10 }
  }
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { ... }
}
```

### Notification (id 없음)
```json
{
  "jsonrpc": "2.0",
  "method": "textDocument/didOpen",
  "params": { ... }
}
```

## 핵심 메서드

### initialize
```javascript
// Request params
{
  capabilities: { /* client capabilities */ }
}

// Response result
{
  capabilities: {
    textDocumentSync: 2, // Incremental
    completionProvider: { triggerCharacters: ['.'] },
    hoverProvider: true,
    definitionProvider: true,
    diagnosticProvider: { interFileDependencies: false }
  }
}
```

### textDocument/didOpen
```javascript
{
  textDocument: {
    uri: "file:///path/file.mini",
    languageId: "minilang",
    version: 1,
    text: "let x = 10;\n..."
  }
}
```

### textDocument/didChange (Incremental)
```javascript
{
  textDocument: { uri: "...", version: 2 },
  contentChanges: [
    {
      range: {
        start: { line: 2, character: 4 },
        end: { line: 2, character: 8 }
      },
      text: "newText"
    }
  ]
}
```

### textDocument/completion
```javascript
// Response
{
  items: [
    {
      label: "userName",
      kind: 6, // Variable
      detail: "let userName",
      insertText: "userName"
    },
    {
      label: "if",
      kind: 14, // Keyword
      insertText: "if (${1:condition}) {\n\t${2}\n}",
      insertTextFormat: 2 // Snippet
    }
  ]
}
```

### CompletionItemKind
```
1: Text, 2: Method, 3: Function, 4: Constructor,
5: Field, 6: Variable, 7: Class, 8: Interface,
13: Enum, 14: Keyword, 15: Snippet, 21: Constant
```

### textDocument/publishDiagnostics (Server → Client)
```javascript
{
  uri: "file:///...",
  diagnostics: [
    {
      range: { start: { line: 1, character: 6 }, end: { line: 1, character: 7 } },
      severity: 1, // 1=Error, 2=Warning, 3=Info, 4=Hint
      message: "'y' is not defined",
      source: "minilang"
    }
  ]
}
```

### textDocument/definition
```javascript
// Response
{
  uri: "file:///...",
  range: {
    start: { line: 0, character: 3 },
    end: { line: 0, character: 8 }
  }
}
```

### textDocument/hover
```javascript
// Response
{
  contents: {
    kind: "markdown",
    value: "```minilang\nfn add(a, b)\n```\n\nFunction with 2 parameters"
  },
  range: { ... }
}
```
