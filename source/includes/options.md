# Options

```js
YAML.defaultOptions
// { keepBlobsInJSON: true,
//   keepNodeTypes: true,
//   version: '1.2' }

YAML.Document.defaults
// { '1.0': { merge: true, schema: 'yaml-1.1' },
//   '1.1': { merge: true, schema: 'yaml-1.1' },
//   '1.2': { merge: false, schema: 'core' } }
```

#### `YAML.defaultOptions`

#### `YAML.Document.defaults`

`yaml` defines options in three places: as an argument of parse, create and stringify calls, in the values of `YAML.defaultOptions`, and in the version-dependent `YAML.Document.defaults` object. Values set in `YAML.defaultOptions` override version-dependent defaults, and argument options override both.

The `version` option value (`'1.2'` by default) may be overridden by any document-specific `%YAML` directive.

| Option          | Type                                                             | Description                                                                                                                                          |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| anchorPrefix    | `string`                                                         | Default prefix for anchors. By default `'a'`, resulting in anchors `a1`, `a2`, etc.                                                                  |
| keepBlobsInJSON | `boolean`                                                        | Allow non-JSON JavaScript objects to remain in the `toJSON` output. Relevant with the YAML 1.1 `!!timestamp` and `!!binary` tags. By default `true`. |
| keepCstNodes    | `boolean`                                                        | Include references in the AST to each node's corresponding CST node. By default `false`.                                                             |
| keepNodeTypes   | `boolean`                                                        | Store the original node type when parsing documents. By default `true`.                                                                              |
| mapAsMap        | `boolean`                                                        | When outputting JS, use Map rather than Object to represent mappings. By default `false`.                                                            |
| merge           | `boolean`                                                        | Enable support for `<<` merge keys.                                                                                                                  |
| schema          | `'core'` &vert; `'failsafe'` &vert; `'json'` &vert; `'yaml-1.1'` | The base schema to use. By default `'core'` for YAML 1.2 and `'yaml-1.1'` for earlier versions.                                                      |
| tags            | [`Tag[]`](#tag) &vert; `function`                                | Array of additional (custom) tags to include in the schema                                                                                           |
| version         | `string`                                                         | The YAML version used by documents without a `%YAML` directive. By default `'1.2'`.                                                                  |

## Data Schemas

```js
YAML.parse('3') // 3
YAML.parse('3', { schema: 'failsafe' }) // '3'

YAML.parse('No') // 'No'
YAML.parse('No', { schema: 'json' }) // SyntaxError: Unresolved plain scalar "No"
YAML.parse('No', { schema: 'yaml-1.1' }) // false
YAML.parse('No', { version: '1.1' }) // false

YAML.parse('{[1, 2]: many}') // { '[1,2]': 'many' }
YAML.parse('{[1, 2]: many}', { mapAsMap: true }) // Map { [ 1, 2 ] => 'many' }
```

Aside from defining the language structure, the YAML 1.2 spec defines a number of different _schemas_ that may be used. The default is the [`core`](http://yaml.org/spec/1.2/spec.html#id2804923) schema, which is the most common one. The [`json`](http://yaml.org/spec/1.2/spec.html#id2803231) schema is effectively the minimum schema required to parse JSON; both it and the core schema are supersets of the minimal [`failsafe`](http://yaml.org/spec/1.2/spec.html#id2802346) schema.

The `yaml-1.1` schema matches the more liberal [YAML 1.1 types](http://yaml.org/type/) (also used by YAML 1.0), including binary data and timestamps as distinct tags as well as accepting greater variance in scalar values (with e.g. `'No'` being parsed as `false` rather than a string value). The `!!value` and `!!yaml` types are not supported.

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

**Merge** keys are a [YAML 1.1 feature](http://yaml.org/type/merge.html) that is not a part of the 1.2 spec. To use a merge key, assign an alias node or an array of alias nodes as the value of a `<<` key in a mapping.

## Tag Stringifier Options

```js
import { nullOptions, strOptions } from 'yaml/types'

YAML.stringify({ 'this is': null })
// this is: null

nullOptions
// { nullStr: 'null' }
nullOptions.nullStr = '~'

strOptions
// { defaultType: 'PLAIN',
//   doubleQuoted: { jsonEncoding: false, minMultiLineLength: 40 },
//   fold: { lineWidth: 80, minContentWidth: 20 } }
strOptions.defaultType = 'QUOTE_SINGLE'

YAML.stringify({ 'this is': null })
// 'this is': ~
```

To customise the YAML stringification, the `nullOptions` and `strOptions` objects are exported from `'yaml/types'`. Note that these values are used by all documents. For example, to disable the automatic line wrapping, set `strOptions.fold.lineWidth` to `0`.

The optional `!!binary` type (available as `binary` from `'yaml/types'`) also provides for some configuration via its `options` object.
