---
title: YAML

toc_footers:
  - <a href='#'>Sign Up for a Developer Key</a>
  - <a href='https://github.com/lord/slate'>Documentation Powered by Slate</a>

includes:
  - errors

search: true
---

# YAML

> To install:

```sh
npm install yaml
# or
yarn add yaml
```

> To use:

```js
import YAML from 'yaml'
// or
const YAML = require('yaml').default
```

`yaml` is a JavaScript parser and stringifier for [YAML](http://yaml.org/), a human friendly data serialization standard. It supports almost all aspects of the 1.2 version of the spec for both parsing and stringifying data, as well as a few of the most common extensions.

The library is released under the ISC open source license, and the code is [available on GitHub](https://github.com/eemeli/yaml/). It has no external dependencies, and is usable in both browser and node environments.

The API provided by `yaml` has three layers, depending on how deep you need to go: [Pure JavaScript](#pure-javascript), [YAML Objects](#yaml-objects), and the [AST Parser](#ast-parser). The first has the simplest API and "just works", the second gets you all the bells and whistles supported by the library, and the third is the closest to YAML source, making it fast, raw, and crude.

# Pure JavaScript

```yaml
# file.yml
YAML:
  - A human-readable data serialization language
  - https://en.wikipedia.org/wiki/YAML
yaml:
  - A complete JavaScript implementation
  - https://www.npmjs.com/package/yaml
```

At its simplest, you can use `YAML.parse(str)` and `YAML.stringify(value)` just as you'd use `JSON.parse(str)` and `JSON.stringify(value)`. If that's enough for you, everything else in these docs is really just implementation details.

## YAML.parse

```js
import fs from 'fs'
import YAML from 'yaml'

YAML.parse('3.14159')
// 3.14159

YAML.parse('[ true, false, maybe, null ]\n')
// [ true, false, 'maybe', null ]

const file = fs.readFileSync('./file.yml', 'utf8')
YAML.parse(file)
// { YAML:
//   [ 'A human-readable data serialization language',
//     'https://en.wikipedia.org/wiki/YAML' ],
//   yaml:
//   [ 'A complete JavaScript implementation',
//     'https://www.npmjs.com/package/yaml' ] }
```

#### `YAML.parse(str, options = {}): any`

`str` should be a string with YAML formatting, while `options` is an optional configuration object with the same shape as [`YAML.defaultOptions`](#yaml-defaultoptions).

The returned value will match the type of the root value of the parsed YAML document, so Maps become objects, Sequences arrays, and scalars result in nulls, booleans, numbers and strings.

`YAML.parse` may throw on error, and it may log warnings using `console.warn`. It only supports input consisting of a single YAML document; for multi-document support you should use `YAML.parseDocuments`.

## YAML.stringify

```js
YAML.stringify(3.14159)
// '3.14159\n'

YAML.stringify([true, false, 'maybe', null])
// `- true
// - false
// - maybe
// - null
// `

YAML.stringify({ number: 3, plain: 'string', block: 'two\nlines\n' })
// `number: 3
// plain: string
// block: >
//   two
//
//   lines
// `
```

#### `YAML.stringify(value, options = {}): string`

`value` can be of any type, while `options` is an optional configuration object with the same shape as [`YAML.defaultOptions`](#yaml-defaultoptions).

The returned string will always include `\n` as the last character, as is expected of YAML documents.

As strings in particular may be represented in a number of different styles, the simplest option for the value in question will always be chosen, depending mostly on the presence of escaped or control characters and leading & trailing whitespace.

To create a stream of documents, you may call `YAML.stringify` separately for each document's `value`, and concatenate the documents with the string `...\n` as a separator.

# Data Schema

A YAML schema is a combination of a set of tags and a mechanism for resolving non-specific tags, i.e. values that do not have an explicit tag such as `!!int`. The recommended schema is the "core" schema; it's arguably the most common, and is the default for `yaml`.

## Tags

```js
YAML.parse('"42"')
// '42'

YAML.parse('!!int "42"')
// 42

YAML.parse(`
%TAG ! tag:example.com,2018:app/
---
!foo 42
`)
// {[ YAMLWarning:
//    The tag tag:example.com,2018:app/foo is unavailable,
//    falling back to tag:yaml.org,2002:str ]}
// '42'
```

The default prefix for YAML tags is `tag:yaml.org,2002:`, for which the shorthand `!!` is used when stringified. Shorthands for other prefixes may also be defined by document-specific directives, e.g. `!e!` or just `!` for `tag:example.com,2018:app/`, but this is not required to use a tag with a different prefix.

During parsing, unresolved tags should not result in errors (though they will be noted as `warnings`), with the tagged value being parsed according to the data type that it would have under automatic tag resolution rules. This should not result in any data loss, allowing such tags to be handled by the calling app.

In order to have `yaml` provide you with automatic parsing and stringification of non-standard data types, it will need to be configured with a suitable tag object. For an example of what's required, the optional [`!!timestamp`](https://github.com/eemeli/yaml/blob/master/src/schema/_timestamp.js) and [`!!binary`](https://github.com/eemeli/yaml/blob/master/src/schema/_binary.js) tags should provide decent examples.

## YAML.defaultOptions

These values set the default options used by `YAML` methods, and may be overridden by the `options` arguments of document-specific functions.

```js
YAML.defaultOptions.merge = true

const mergeResult = YAML.parse(`
source: &base { a: 1, b: 2 }
target:
  <<: *base
  b: base
`)

mergeResult.target
// { a: 1, b: 'base' }
```

| Option | Default | Description                                                                                                   |
| ------ | ------- | ------------------------------------------------------------------------------------------------------------- |
| merge  | false   | Enable support for `<<` merge keys                                                                            |
| schema | 'core'  | The schema to use, either one of `'core'`, `'extended'`, `'failsafe'` or `'json'`, or an array of tag objects |
| tags   | null    | Array of additional tags to include in the schema                                                             |

**Merge** keys are a [YAML 1.1 feature](http://yaml.org/type/merge.html) that is not officially a part of the 1.2 spec. To use a merge key, assign an alias node or an array of alias nodes as the value of a `<<` key in a mapping.

```js
YAML.parse('3') // 3
YAML.parse('3', { schema: 'failsafe' }) // '3'

YAML.parse('No') // 'No'
YAML.parse('No', { schema: 'json' }) // SyntaxError: Unresolved plain scalar "No"
YAML.parse('No', { schema: 'extended' }) // false
```

Aside from defining the language structure, the YAML 1.2 spec defines a number of different **schemas** that may be used. The default is the [core schema](http://yaml.org/spec/1.2/spec.html#id2804923), which is the most common one. The [JSON schema](http://yaml.org/spec/1.2/spec.html#id2803231) is effectively the minimum schema required to parse JSON; both it and the core schema are supersets of the minimal [failsafe schema](http://yaml.org/spec/1.2/spec.html#id2802346).

The **extended** schema matches the more liberal [YAML 1.1 types](http://yaml.org/type/), including binary data and timestamps as distinct tags as well as accepting greater variance in scalar values (with e.g. `'No'` being parsed as `false` rather than a string value). The `!!value` and `!!yaml` types are not supported.

```js
import { timestamp } from 'yaml/types/timestamp'

YAML.parse('!!timestamp 2001-12-15 2:59:43')
// {[ YAMLWarning:
//    The tag tag:yaml.org,2002:timestamp is unavailable,
//    falling back to tag:yaml.org,2002:str ]}
// '2001-12-15 2:59:43'

const options = { tags: [timestamp] }

YAML.parse('2001-12-15 2:59:43', options)
// '2001-12-15T02:59:43.000Z'

const doc = YAML.parseDocuments('2001-12-15 2:59:43', options)[0]
doc.contents.value.toDateString()
// 'Sat Dec 15 2001'
```

The easiest way to extend a schema is by defining the additional **tags** that you wish to support. For further customisation, `schema` may also be set to a completely custom array of types, or `tags` may be a function that'll then be passed the named schema as an argument, and may add to or otherwise modify it as necessary.

# YAML Objects

In order to work with YAML features not directly supported by native JavaScript data types, such as comments and non-string keys, `yaml` provides the `YAML.Document` API.

## YAML.parseDocuments

```js
import fs from 'fs'
import YAML from 'yaml'

const file = fs.readFileSync('./file.yml', 'utf8')
const docs = YAML.parseDocuments(file)
docs[0].contents
// YAMLMap {
//   anchor: null,
//   comment: null,
//   commentBefore: null,
//   tag: 'tag:yaml.org,2002:map',
//   doc: Document { ... },
//   items:
//    [ Pair {
//        key: Scalar { ..., value: 'YAML' },
//        value: YAMLSeq { ...,
//          items:
//            [ Scalar { ..., value: 'A human-readable data serialization language' },
//              Scalar { ..., value: 'https://en.wikipedia.org/wiki/YAML' } ] } },
//      Pair {
//        key: Scalar { ..., value: 'yaml' },
//        value: YAMLSeq { ...,
//          items:
//            [ Scalar { ..., value: 'A complete JavaScript implementation' },
//              Scalar { ..., value: 'https://www.npmjs.com/package/yaml' } ] } } ] }
```

#### `YAML.parseDocuments(str, options = {}): YAML.Document[]`

When parsing YAML, the input string `str` is considered as a stream of documents separated from each other by `...` document end marker lines. `YAML.parseDocuments` (used internally by `YAML.parse`) will return an array of `Document` objects that allow these documents to be parsed and manipulated with more control.

This function should never throw; errors and warnings are included in the documents' `errors` and `warnings` arrays. In particular, if `errors` is not empty it's likely that the document's parsed `contents` are not entirely correct.

The returned documents' `contents` will always consist of `Scalar`, `Map`, `Seq` or `null` values.

## YAML.Document

```js
const doc = new YAML.Document()
// Document {
//   anchors: {},
//   commentBefore: null,
//   comment: null,
//   contents: null,
//   errors: [],
//   tagPrefixes: [],
//   schema:
//    Schema {
//      merge: false,
//      schema:
//       [ ...,
//         { class: [Function: Boolean],
//           tag: 'tag:yaml.org,2002:bool',
//           test: /^(?:true|false)$/i,
//           resolve: [Function: resolve] },
//         ... ] },
//   version: null,
//   warnings: [] }

doc.version = true
doc.commentBefore = ' A commented document'
doc.contents = ['some', 'values', { balloons: 99 }]

String(doc)
// # A commented document
// %YAML 1.2
// ---
// - some
// - values
// - balloons: 99
```

#### `new YAML.Document(options = {})`

#### `new YAML.Document(schema)`

A YAML Document will need to include a schema definition. Its constructor may thefore be called with a ready `schema`, or the `options` (see [`YAML.defaultOptions`](#yaml-defaultoptions)) required for its construction.

| Member        | Type       | Description                                                                                                                                  |
| ------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| commentBefore | `string?`  | A comment at the very beginning of the document.                                                                                             |
| comment       | `string?`  | A comment at the end of the document.                                                                                                        |
| contents      | `any`      | The document contents.                                                                                                                       |
| errors        | `Error[]`  | Errors encountered during parsing.                                                                                                           |
| schema        | `Schema`   | The schema used with the document.                                                                                                           |
| tagPrefixes   | `Prefix[]` | Array of prefixes; each will have a string `handle` that starts and ends with `!` and a string `prefix` that the handle will be replaced by. |
| version       | `string?`  | The parsed version of the source document; if true-ish, stringified output will include a `%YAML 1.2` directive.                             |
| warnings      | `Error[]`  | Warnings encountered during parsing.                                                                                                         |

The Document members are all modifiable, though it's unlikely that you'll have reason to change `errors`, `schema` or `warnings`. In particular you may be interested in both reading and writing **`contents`**. Although `YAML.parseDocuments()` will leave it with `Map`, `Seq`, `Scalar` or `null` contents, it can be set to anything.

| Method                       | Return type | Description                                                                                    |
| ---------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| parse(ast)                   | `Document`  | Parse an AST into this document                                                                |
| resolveValue(value)          | `Node`      | Turn objects into `Map`, arrays to `Seq`, and wrap plain values in `Scalar`.                   |
| listNonDefaultTags()         | `string[]`  | List the tags used in the document that are not in the default `tag:yaml.org,2002:` namespace. |
| setTagPrefix(handle, prefix) | `undefined` | Set `handle` as a shorthand string for the `prefix` tag namespace.                             |
| toJSON()                     | `any`       | A plain JavaScript representation of the document `contents`.                                  |
| toString()                   | `string`    | A YAML representation of the document.                                                         |

**`parse(ast)`** is mostly an internal method, modifying the document according to the contents of the parsed `ast`. Calling this multiple times on a Document is not recommended.

To attach comments or other metadata to a value, use **`resolveValue(value)`** to wrap it in container object and then set the returned value as the Document `contents`, or deeper within the contents.

To define a tag prefix to use when stringifying, use **`setTagPrefix(handle, prefix)`** rather than setting a value directly in `tagPrefixes`. This will guarantee that the `handle` is valid (by throwing an error), and will overwrite any previous definition for the `handle`. Use an empty `prefix` value to remove a prefix.

For a plain JavaScript representation of the document, **`toJSON()`** is your friend. Do note that it will call `toJSON()` methods recursively on the contents, so e.g. `Date` objects will also be stringified.

Conversely, to stringify a document as YAML, use **`toString()`**. This will also be called by `String(doc)`. This method will throw if the `errors` array is not empty.

## Collections

```js
import YAML from 'yaml'
import Pair from 'yaml/pair'
import Seq from 'yaml/seq'

const doc = new YAML.Document()
doc.contents = new Seq(doc)
doc.contents.items = [
  'some values',
  42,
  { including: 'objects', 3: 'a string' }
]
doc.contents.items.push(new Pair(1, 'a number'))

doc.toString()
// - some values
// - 42
// - "3": a string
//   including: objects
// - 1: a number
```

Within a YAML document, two forms of collections are supported: sequential `Seq` collections and key-value `Map` collections. The JavaScript representations of these collections both have an `items` array, which may (`Seq`) or must (`Map`) consist of `Pair` objects that contain a `key` and a `value` of any type, including `null`. The `items` array of a `Seq` object may contain values of any type.

To construct a `Seq` or `Map`, use `Document#resolveValue()` with array or object input, or create the collections directly by importing the classes from `yaml/seq` and `yaml/map`. Do note that `new Seq` and `new Map` require a `YAML.Document` parameter, as the YAML stringification will depend on the document-specific schema.

Once created, normal array operations may be used to modify the `items` array. New `Pair` objects may created by importing the class from `yaml/pair` and using its `new Pair(key, value)` constructor. Note in particular that this is required to create non-`string` keys.

## Comments

```js
const doc = YAML.parseDocuments(`
# This is YAML.
---
it has:
  - an array
  - of values
`)[0]

doc.toJSON()
// { 'it has': [ 'an array', 'of values' ] }

doc.commentBefore
// ' This is YAML.'

const seq = doc.contents.items[0].value
seq.items[0].comment = ' item comment'
seq.comment = ' collection end comment'

doc.toString()
// # This is YAML.
// it has:
//   - an array # item comment
//   - of values
//   # collection end comment
```

A primary differentiator between this and other YAML libraries is the ability to programmatically handle comments, which according to [the spec](http://yaml.org/spec/1.2/spec.html#id2767100) "must not have any effect on the serialization tree or representation graph. In particular, comments are not associated with a particular node."

This library does allow comments to be handled programmatically, and does attach them to particular nodes. Each `Scalar`, `Map`, `Seq` and the `Document` itself has `comment` and `commentBefore` members that may be set to a stringifiable value. The string contents of comments are not processed by the library, except for merging adjacent comment lines together and prefixing each line with the `#` comment indicator.

**Note**: Due to implementation details, the library's comment handling is not completely stable. In particular, when reading and writing a YAML file, comments may move around a bit due to getting associated with a different node than intended.

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
