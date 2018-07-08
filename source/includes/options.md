# Options

```js
YAML.defaultOptions
// { keepBlobsInJSON: true, keepNodeTypes: true, version: '1.2' }

YAML.Document.defaults
// { '1.0': { merge: true, schema: 'yaml-1.1' },
//   '1.1': { merge: true, schema: 'yaml-1.1' },
//   '1.2': { merge: false, schema: 'core' } }
```

#### `YAML.defaultOptions`

#### `YAML.Document.defaults`

`yaml` defines options in three places: as an argument of parse, create and stringify calls, in the values of `YAML.defaultOptions`, and in the version-dependent `YAML.Document.defaults` object. Values set in `YAML.defaultOptions` override version-dependent defaults, and argument options override both. The `version` option value (`'1.2'` by default) may be overridden by any document-specific `%YAML` directive.

| Option          | Type                                                             | Description                                                                                                                                          |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| keepBlobsInJSON | `boolean`                                                        | Allow non-JSON JavaScript objects to remain in the `toJSON` output. Relevant with the YAML 1.1 `!!timestamp` and `!!binary` tags. By default `true`. |
| keepNodeTypes   | `boolean`                                                        | Store the original node type when parsing documents. By default `true`.                                                                              |
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
```

Aside from defining the language structure, the YAML 1.2 spec defines a number of different **schemas** that may be used. The default is the [`core`](http://yaml.org/spec/1.2/spec.html#id2804923) schema, which is the most common one. The [`json`](http://yaml.org/spec/1.2/spec.html#id2803231) schema is effectively the minimum schema required to parse JSON; both it and the core schema are supersets of the minimal [`failsafe`](http://yaml.org/spec/1.2/spec.html#id2802346) schema.

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

## Custom Tags

```js
import { binary } from 'yaml/types/binary'
import { timestamp } from 'yaml/types/timestamp'

YAML.parse('!!timestamp 2001-12-15 2:59:43')
// YAMLWarning:
//   The tag tag:yaml.org,2002:timestamp is unavailable,
//   falling back to tag:yaml.org,2002:str
// '2001-12-15 2:59:43'

YAML.defaultOptions.tags = [binary, timestamp]

YAML.parse('2001-12-15 2:59:43')
// 2001-12-15T02:59:43.000Z

const doc = YAML.parseDocument('2001-12-15 2:59:43')
doc.contents.value.toDateString()
// 'Sat Dec 15 2001'
```

The easiest way to extend a schema is by defining the additional **tags** that you wish to support. For further customisation, `tags` may also be a function `(Tag[]) => (Tag[])` that may modify the schema's base tag array.

The `!!binary` and `!!timestamp` YAML 1.1 tags are available as exports under `yaml/types/`, should you wish to use them with the YAML 1.2 `core` schema.

If you wish to implement your own custom tags, the [`!!binary`](https://github.com/eemeli/yaml/blob/master/src/schema/_binary.js) and [`!!timestamp`](https://github.com/eemeli/yaml/blob/master/src/schema/_timestamp.js) tags provide relatively cohesive examples to study.

<h4 id="tag" style="clear:both"><code>Tag</code></h4>

| Member    | Type           | Description                                                                                                                                                                                                                                                   |
| --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| class     | `class?`       | A JavaScript class that should be matched to this tag, e.g. `Date` for `!!timestamp`.                                                                                                                                                                         |
| default   | `boolean?`     | If `true`, the tag should not be explicitly included when stringifying.                                                                                                                                                                                       |
| format    | `string?`      | If a tag has multiple forms that should be parsed and/or stringified differently, use `format` to identify them.                                                                                                                                              |
| options   | `object?`      | Used by some tags to configure their stringification, where applicable.                                                                                                                                                                                       |
| resolve   | `() => Node`   | Should return an instance of a class extending `Node`. If `test` is set, will be called with the resulting match as arguments. Otherwise, will be called as `resolve(doc, cstNode)`.                                                                          |
| stringify | `() => string` | Called as `stringify(item, ctx, onComment)`, where `item` is the node being stringified, `ctx` contains the stringifying context variables, and `onComment` is a function that should be called if the stringifier includes the item's comment in its output. |
| tag       | `string`       | The fully qualified name of the tag.                                                                                                                                                                                                                          |
| test      | `RegExp?`      | Used to match string values of scalar nodes; captured parts will be passed as arguments of `resolve()`.                                                                                                                                                       |

## Tag Stringifier Options

```js
const doc = YAML.parseDocument('this is: null')
doc.contents.items[0]
// Pair {
//   key: Scalar { value: 'this is', range: [ 0, 7 ], type: 'PLAIN' },
//   value: Scalar { value: null, range: [ 9, 13 ], type: 'PLAIN' } }

const nullTag = doc.schema.schema.find(
  ({ tag }) => tag === 'tag:yaml.org,2002:null'
)
nullTag.options.nullStr = '~'

String(doc)
// this is: ~
```

Some of the tags (in particular `!!null`, `!!str` and `!!binary`) support additional customisations for their YAML stringification. To adjust those, modify the `options` object of the appropriate tag.