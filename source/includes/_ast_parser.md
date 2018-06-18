# AST Parser

For ease of implementation and to provide better error handling and reporting, the lowest level of the library's parser turns any input string into an Abstract Syntax Tree of nodes as if the input were YAML. This level of the API has not been designed to be particularly user-friendly for external users, but it is fast, robust, and not dependent on the rest of the library.

## parseAST

```js
import parseAST from 'yaml/parse-ast'

const ast = parseAST(`
sequence: [ one, two, ]
mapping: { sky: blue, sea: green }
---
-
  "flow in block"
- >
 Block scalar
- !!map # Block collection
  foo : bar
`)

ast[0]            // first document, containing a map with two keys
  .contents[0]    // document contents (as opposed to directives)
  .items[3].node  // the last item, a flow map
  .items[3]       // the fourth token, parsed as a plain value
  .strValue       // 'blue'

ast[1]            // second document, containing a sequence
  .contents[0]    // document contents (as opposed to directives)
  .items[1].node  // the second item, a block value
  .strValue       // 'Block scalar\n'
```

#### `parseAST(string): ASTDocument[]`

The AST parser will not produce an AST that is necessarily valid YAML, and in particular its representation of collections of items is expected to undergo further processing and validation. The parser should never throw errors, but may include them as a value of the relevant node. On the other hand, if you feed it garbage, you'll likely get a garbage AST as well.

The public API of the library is a single function which returns an array of parsed AST documents. The array and its contained nodes override the default `toString` method, each returning a YAML string representation of its contents.

If a node has its `value` set, that will be used when re-stringifying. Care should be taken when modifying the AST, as no error checks are included to verify that the resulting YAML is valid, or that e.g. indentation levels aren't broken. In other words, this is an engineering tool and you may hurt yourself. If you're looking to generate a brand new YAML document, you should probably not be using this library directly.

For more usage examples and AST trees, have a look through the [extensive test suite](https://github.com/eemeli/yaml/tree/master/__tests__/ast) included in the project's repository.

<h3 style="clear:both">Error detection</h3>

```js
import YAML from 'yaml'
import parseAST from 'yaml/parse-ast'

const ast = parseAST('this: is: bad YAML')

ast[0].contents[0]  // Note: Simplified for clarity
// { type: 'MAP',
//   items: [
//     { type: 'PLAIN', strValue: 'this' },
//     { type: 'MAP_VALUE',
//       node: {
//         type: 'MAP',
//         items: [
//           { type: 'PLAIN', strValue: 'is' },
//           { type: 'MAP_VALUE',
//             node: { type: 'PLAIN', strValue: 'bad YAML' } } ] } } ] }

const doc = new YAML.Document()
doc.parse(ast[0])
doc.errors
// [ {
//   name: 'YAMLSemanticError',
//   message: 'Nested mappings are not allowed in compact mappings',
//   source: {
//     type: 'MAP',
//     range: { start: 6, end: 18 },
//     ...,
//     rawValue: 'is: bad YAML' } } ]

doc.contents.items[0].value.items[0].value.value
// 'bad YAML'
```

While the YAML spec considers e.g. block collections within a flow collection to be an error, this error will not be detected by the AST parser. For complete validation, you will need to parse the AST into a `YAML.Document`. If the document contains errors, they will be included in the document's `errors` array, and each error will will contain a `source` reference to the AST node where it was encountered. Do note that even if an error is encountered, the document contents might still be available.

## AST Nodes

> This section uses Flow-ish notation, so `+` as a prefix indicates a read-only getter property.

```js
class Range {
  start: number,        // offset of first character
  end: number,          // offset after last character
  +isEmpty: boolean     // true if end is not greater than start
}
```

**Note**: The `Node`, `Scalar` and other values referred to in this section are the AST representations of said objects, and are not the same as those used in preceding parts.

Actual values in the AST nodes are stored as `start`, `end` indices of the input string. This allows for memory consumption to be minimised by making string generation really lazy.

<h3 style="clear:both">Node</h3>

```js
class Node {
  context: {
    atLineStart: boolean, // is this node the first one on this line
    indent: number,     // current level of indentation (may be -1)
    src: string         // the full original source
  },
  error: ?Error,        // if not null, indicates a parser failure
  props: Array<Range>,  // anchors, tags and comments
  range: Range,         // span of context.src parsed into this node
  type:                 // specific node type
    'ALIAS' | 'BLOCK_FOLDED' | 'BLOCK_LITERAL' | 'COMMENT' |
    'DIRECTIVE' | 'DOCUMENT' | 'FLOW_MAP' | 'FLOW_SEQ' |
    'MAP' | 'MAP_KEY' | 'MAP_VALUE' | 'PLAIN' |
    'QUOTE_DOUBLE' | 'QUOTE_SINGLE' | 'SEQ' | 'SEQ_ITEM',
  value: ?string        // if non-null, overrides source value
  +anchor: ?string,     // anchor, if set
  +comment: ?string,    // newline-delimited comment(s), if any
  +rawValue: ?string,   // an unprocessed slice of context.src
                        //   determining this node's value
  +tag:                 // this node's tag, if set
    null | { verbatim: string } | { handle: string, suffix: string },
  toString(): string    // a YAML string representation of this node
}

type ContentNode =
  Comment | Alias | Scalar | Map | Seq | FlowCollection
```

Each node in the AST extends a common ancestor `Node`. Additional undocumented properties are available, but are likely only useful during parsing.

<h3 style="clear:both">Scalars</h3>

```js
class Alias extends Node {
  // rawValue will contain the anchor without the * prefix
  type: 'ALIAS'
}

class Scalar extends Node {
  type: 'PLAIN' | 'QUOTE_DOUBLE' | 'QUOTE_SINGLE' |
    'BLOCK_FOLDED' | 'BLOCK_LITERAL'
  +strValue: ?string |  // unescaped string value
    { str: string, errors: YAMLSyntaxError[] }
}

class Comment extends Node {
  type: 'COMMENT',      // PLAIN nodes may also be comment-only
  +anchor: null,
  +comment: string,
  +rawValue: null,
  +tag: null
}
```

While `Alias` nodes are not technically scalars, they are parsed as such at this level.

Due to parsing differences, each scalar type is implemented using its own class.

<h3 style="clear:both">Collections</h3>

```js
class MapItem extends Node {
  node: ContentNode | null,
  type: 'MAP_KEY' | 'MAP_VALUE'
}

class Map extends Node {
  // implicit keys are not wrapped
  items: Array<Comment | Alias | Scalar | MapItem>,
  type: 'MAP'
}

class SeqItem extends Node {
  node: ContentNode | null,
  type: 'SEQ_ITEM'
}

class Seq extends Node {
  items: Array<Comment | SeqItem>,
  type: 'SEQ'
}

type FlowChar = '{' | '}' | '[' | ']' | ',' | '?' | ':'

class FlowCollection extends Node {
  items: Array<FlowChar | Comment | Alias | Scalar | FlowCollection>,
  type: 'FLOW_MAP' | 'FLOW_SEQ'
}
```

Block and flow collections are parsed rather differently, due to their representation differences.

An `Alias` or `Scalar` item directly within a `Map` should be treated as an implicit map key.

In actual code, `MapItem` and `SeqItem` are implemented as `CollectionItem`, and correspondingly `Map` and `Seq` as `Collection`.

<h3 style="clear:both">Document Structure</h3>

```js
class Directive extends Node {
  name: string,  // should only be 'TAG' or 'YAML'
  type: 'DIRECTIVE',
  +anchor: null,
  +parameters: Array<string>,
  +tag: null
}

class ASTDocument extends Node {
  directives: Array<Comment | Directive>,
  contents: Array<ContentNode>,
  type: 'DOCUMENT',
  +anchor: null,
  +comment: null,
  +tag: null
}
```

The AST tree of a valid YAML document should have a single non-`Comment` `ContentNode` in its `contents` array. Multiple values indicates that the input is malformed in a way that made it impossible to determine the proper structure of the document.
