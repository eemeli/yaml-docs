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

The API provided by `yaml` has three layers, depending on how deep you need to go: [Pure JavaScript](#pure-javascript), [YAML Objects](#yaml-objects), and the AST level. The first has the simplest API and "just works", the second gets you all the bells and whistles supported by the library, and the third is the closest to YAML source, making it fast, raw, and crude.

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

## YAML.defaultOptions

These values set the default options used by `YAML` methods, and may be set overridden by `options` arguments.

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

| Option | Default | Description                                                                |
| ------ | ------- | -------------------------------------------------------------------------- |
| merge  | false   | Enable support for `<<` merge keys                                         |
| schema | 'core'  | The schema to use, one of `'core'`, `'extended'`, `'failsafe'` or `'json'` |
| tags   | null    | Array of additional tags to include in the schema                          |

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
import { timestamp } from 'yaml/dist/schema/_timestamp'

YAML.parse('!!timestamp 2001-12-15 2:59:43')
// { [YAMLWarning: The tag tag:yaml.org,2002:timestamp is unavailable, falling back to tag:yaml.org,2002:str] }
// '2001-12-15 2:59:43'

YAML.parse('2001-12-15 2:59:43', { tags: [timestamp] })
// '2001-12-15T02:59:43.000Z'
```

The easiest way to extend a schema is by defining the additional **tags** that you wish to support. For further customisation, `schema` may also be set to a completely custom array of types, or `tags` may be a function that'll then be passed the named schema as an argument, and may add to or otherwise modify it as necessary.

<aside class="notice">
A YAML schema is a combination of a set of tags and a mechanism for resolving non-specific tags.
</aside>

# YAML Objects

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
