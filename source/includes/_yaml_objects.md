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
| listNonDefaultTags()         | `string[]`  | List the tags used in the document that are not in the default `tag:yaml.org,2002:` namespace. |
| setTagPrefix(handle, prefix) | `undefined` | Set `handle` as a shorthand string for the `prefix` tag namespace.                             |
| toJSON()                     | `any`       | A plain JavaScript representation of the document `contents`.                                  |
| toString()                   | `string`    | A YAML representation of the document.                                                         |

**`parse(ast)`** is mostly an internal method, modifying the document according to the contents of the parsed `ast`. Calling this multiple times on a Document is not recommended.

To define a tag prefix to use when stringifying, use **`setTagPrefix(handle, prefix)`** rather than setting a value directly in `tagPrefixes`. This will guarantee that the `handle` is valid (by throwing an error), and will overwrite any previous definition for the `handle`. Use an empty `prefix` value to remove a prefix.

For a plain JavaScript representation of the document, **`toJSON()`** is your friend. Do note that it will call `toJSON()` methods recursively on the contents, so e.g. `Date` objects will also be stringified.

Conversely, to stringify a document as YAML, use **`toString()`**. This will also be called by `String(doc)`. This method will throw if the `errors` array is not empty.

## Collections

```js
import YAML from 'yaml'
import Pair from 'yaml/pair'
import Seq from 'yaml/seq'

const doc = new YAML.Document()
doc.contents = new Seq()
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

#### `new Map(), new Seq(), new Pair(key, value)`

Within a YAML document, two forms of collections are supported: sequential `Seq` collections and key-value `Map` collections. The JavaScript representations of these collections both have an `items` array, which may (`Seq`) or must (`Map`) consist of `Pair` objects that contain a `key` and a `value` of any type, including `null`. The `items` array of a `Seq` object may contain values of any type.

To construct a `Seq` or `Map`, use `YAML.createNode()` with array or object input, or create the collections directly by importing the classes from `yaml/seq` and `yaml/map`.

Once created, normal array operations may be used to modify the `items` array. New `Pair` objects may created by importing the class from `yaml/pair` and using its `new Pair(key, value)` constructor. Note in particular that this is required to create non-`string` keys.

## YAML.createNode

```js
const seq = YAML.createNode(['some', 'values', { balloons: 99 }])
// YAMLSeq {
//   anchor: null,
//   comment: null,
//   commentBefore: null,
//   tag: null,
//   items:
//    [ Scalar { ..., value: 'some' },
//      Scalar { ..., value: 'values' },
//      YAMLMap { ..., items: [ Pair {
//        key: Scalar { ..., value: 'balloons' },
//        value: Scalar { ..., value: 99 } } ] } ] }

const doc = new YAML.Document()
doc.contents = seq
seq.items[0].comment = ' A commented item'
String(doc)
// - some # A commented item
// - values
// - balloons: 99
```

#### `YAML.createNode(value, wrapScalars = true): Map | Seq | Scalar | string | number | boolean | null`

`YAML.createNode` recursively turns objects into `Map` and arrays to `Seq` collections. If `wrapScalars` is undefined or `true`, it also wraps plain values in `Scalar` objects. Its primary use is to enable attaching comments or other metadata to a value, or to otherwise exert more fine-grained control over the stringified output.

To stringify the output of `YAML.createNode` as YAML, you'll need to assign it to the `contents` of a Document (or somewhere within said contents), as the document's schema is required for YAML string output.

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
