# Options

#### `YAML.defaultOptions`

#### `YAML.Document.defaults`

```js
YAML.defaultOptions
// { keepNodeTypes: true, version: '1.2' }

YAML.Document.defaults
// { '1.0': { merge: true, schema: 'yaml-1.1' },
//   '1.1': { merge: true, schema: 'yaml-1.1' },
//   '1.2': { merge: false, schema: 'core' } }
```

`yaml` defines options in three places: as an argument of parse, create and stringify calls, in the values of `YAML.defaultOptions`, and in the version-dependent `YAML.Document.defaults` object. Values set in `YAML.defaultOptions` override version-dependent defaults, and argument options override both. The `version` option value (`'1.2'` by default) may be overridden by any document-specific `%YAML` directive.

| Option          | Type                                                             | Description                                                                                                                                          |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| keepNodeTypes   | `boolean`                                                        | Store the original node type when parsing documents. By default `true`.                                                                              |
| keepBlobsInJSON | `boolean`                                                        | Allow non-JSON JavaScript objects to remain in the `toJSON` output. Relevant with the YAML 1.1 `!!timestamp` and `!!binary` tags. By default `true`. |
| merge           | `boolean`                                                        | Enable support for `<<` merge keys.                                                                                                                  |
| schema          | `'core'` &vert; `'failsafe'` &vert; `'json'` &vert; `'yaml-1.1'` | The base schema to use. By default `'core'` for YAML 1.2 and `'yaml-1.1'` for earlier versions.                                                      |
| tags            | `Tag[]` &vert; `function`                                        | Array of additional (custom) tags to include in the schema                                                                                           |
| version         | `string`                                                         | The YAML version used by documents without a `%YAML` directive. By default `'1.2'`.                                                                  |

## Schemas

```js
YAML.parse('3') // 3
YAML.parse('3', { schema: 'failsafe' }) // '3'

YAML.parse('No') // 'No'
YAML.parse('No', { schema: 'json' }) // SyntaxError: Unresolved plain scalar "No"
YAML.parse('No', { schema: 'yaml-1.1' }) // false
YAML.parse('No', { version: '1.1' }) // false
```

Aside from defining the language structure, the YAML 1.2 spec defines a number of different **schemas** that may be used. The default is the [core schema](http://yaml.org/spec/1.2/spec.html#id2804923), which is the most common one. The [JSON schema](http://yaml.org/spec/1.2/spec.html#id2803231) is effectively the minimum schema required to parse JSON; both it and the core schema are supersets of the minimal [failsafe schema](http://yaml.org/spec/1.2/spec.html#id2802346).

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

const options = { tags: [binary, timestamp] }

YAML.parse('2001-12-15 2:59:43', options)
// '2001-12-15T02:59:43.000Z'

const doc = YAML.parseDocument('2001-12-15 2:59:43', options)
doc.contents.value.toDateString()
// 'Sat Dec 15 2001'
```

The easiest way to extend a schema is by defining the additional **tags** that you wish to support. For further customisation, `tags` may also be a function `(Tag[]) => (Tag[])` that may modify the schema's base tag array.

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
