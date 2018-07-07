# Data Schema

A YAML schema is a combination of a set of tags and a mechanism for resolving non-specific tags, i.e. values that do not have an explicit tag such as `!!int`. The default schema is the `'core'` schema, which is the recommended one for YAML 1.2. For YAML 1.0 and YAML 1.1 documents the default is `'yaml-1.1'`.

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
// YAMLWarning:
//   The tag tag:example.com,2018:app/foo is unavailable,
//   falling back to tag:yaml.org,2002:str
// '42'
```

The default prefix for YAML tags is `tag:yaml.org,2002:`, for which the shorthand `!!` is used when stringified. Shorthands for other prefixes may also be defined by document-specific directives, e.g. `!e!` or just `!` for `tag:example.com,2018:app/`, but this is not required to use a tag with a different prefix.

During parsing, unresolved tags should not result in errors (though they will be noted as `warnings`), with the tagged value being parsed according to the data type that it would have under automatic tag resolution rules. This should not result in any data loss, allowing such tags to be handled by the calling app.

In order to have `yaml` provide you with automatic parsing and stringification of non-standard data types, it will need to be configured with a suitable tag object. For an example of what's required, the optional [`!!timestamp`](https://github.com/eemeli/yaml/blob/master/src/schema/_timestamp.js) and [`!!binary`](https://github.com/eemeli/yaml/blob/master/src/schema/_binary.js) tags should provide decent examples.

The YAML 1.0 tag specification is [slightly different](#changes-from-yaml-1-0-to-1-1) from that used in later versions, which is described here.

## Options

#### `YAML.defaultOptions`

#### `YAML.Document.defaults`

`yaml` defines options in three places: as an argument of parse, create and stringify calls, in the values of `YAML.defaultOptions`, and in the version-dependent `YAML.Document.defaults` object. Values set in `YAML.defaultOptions` override version-dependent defaults, and argument options override both. The `version` option value (`'1.2'` by default) and may be overridden by any document-specific `%YAML` directive.

```js
YAML.defaultOptions
// { keepNodeTypes: true, version: '1.2' }

YAML.Document.defaults
// { '1.0': { merge: true, schema: 'yaml-1.1' },
//   '1.1': { merge: true, schema: 'yaml-1.1' },
//   '1.2': { merge: false, schema: 'core' } }
```

| Option          | Type                                                             | Description                                                                                                                                          |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| keepNodeTypes   | `boolean`                                                        | Store the original node type when parsing documents. By default `true`.                                                                              |
| keepBlobsInJSON | `boolean`                                                        | Allow non-JSON JavaScript objects to remain in the `toJSON` output. Relevant with the YAML 1.1 `!!timestamp` and `!!binary` tags. By default `true`. |
| merge           | `boolean`                                                        | Enable support for `<<` merge keys.                                                                                                                  |
| schema          | `'core'` &vert; `'failsafe'` &vert; `'json'` &vert; `'yaml-1.1'` | The base schema to use. By default `'core'` for YAML 1.2 and `'yaml-1.1'` for earlier versions.                                                      |
| tags            | `Tag[]` &vert; `function`                                        | Array of additional (custom) tags to include in the schema                                                                                           |
| version         | `string`                                                         | The YAML version used by documents without a `%YAML` directive. By default `'1.2'`.                                                                  |

### Schemas

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

<h3 style="clear:both">Custom Tags</h3>

```js
import { timestamp } from 'yaml/types/timestamp'

YAML.parse('!!timestamp 2001-12-15 2:59:43')
// YAMLWarning:
//   The tag tag:yaml.org,2002:timestamp is unavailable,
//   falling back to tag:yaml.org,2002:str
// '2001-12-15 2:59:43'

const options = { tags: [timestamp] }

YAML.parse('2001-12-15 2:59:43', options)
// '2001-12-15T02:59:43.000Z'

const doc = YAML.parseDocument('2001-12-15 2:59:43', options)
doc.contents.value.toDateString()
// 'Sat Dec 15 2001'
```

The easiest way to extend a schema is by defining the additional **tags** that you wish to support. For further customisation, `tags` may also be a function `(Tag[]) => (Tag[])` that may modify the schema's base tag array.

<h3 style="clear:both">Tag Stringifier Options</h3>

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

Some of the tags (in particular `!!null` and `!!str`) support additional customisations for their YAML stringification. To adjust those, modify the `options` object of the appropriate tag.

## Version Differences

This library's parser is based on the 1.2 version of the [YAML spec](http://yaml.org/spec/1.2/spec.html), which is mostly backwards-compatible with [YAML 1.1](http://yaml.org/spec/1.1/) as well as [YAML 1.0](http://yaml.org/spec/1.0/). Some specific relaxations have been added for backwards compatibility, but if you encounter an issue please [report it](https://github.com/eemeli/yaml/issues).

### Changes from YAML 1.1 to 1.2

```yaml
%YAML 1.1
---
true: Yes
octal: 014
sexagesimal: 3:25:45
picture: !!binary |
 R0lGODlhDAAMAIQAAP//9/X
 17unp5WZmZgAAAOfn515eXv
 Pz7Y6OjuDg4J+fn5OTk6enp
 56enmleECcgggoBADs=
```

```js
{ true: true,
  octal: 12,
  sexagesimal: 12345,
  picture:
   Buffer [Uint8Array] [
     71, 73, 70, 56, 57, 97, 12, 0, 12, 0, 132, 0, 0,
     255, 255, 247, 245, 245, 238, 233, 233, 229, 102,
     102, 102, 0, 0, 0, 231, 231, 231, 94, 94, 94, 243,
     243, 237, 142, 142, 142, 224, 224, 224, 159, 159,
     159, 147, 147, 147, 167, 167, 167, 158, 158, 158,
     105, 94, 16, 39, 32, 130, 10, 1, 0, 59 ] }
```

The most significant difference between YAML 1.1 and YAML 1.2 is the introduction of the core data schema as the recommended default, replacing the YAML 1.1 type library:

* Only `true` and `false` strings are parsed (case-insensitively) as booleans; `y`, `yes`, `on`, and their negative counterparts are parsed as strings.
* Underlines `_` cannot be used within numerical values.
* Octal values need a `0o` prefix; e.g. `010` is now parsed with the value 10 rather than 8.
* The binary and sexagesimal integer formats have been dropped.
* The `!!timestamp` and `!!binary` types have been dropped.
* The merge `<<` and value `=` special mapping keys have been removed.

The other major change has been to make sure that YAML 1.2 is a valid superset of JSON. Additionally there are some minor differences between the parsing rules:

* The next-line `\x85`, line-separator `\u2028` and paragraph-separator `\u2029` characters are no longer considered line-break characters. Within scalar values, this means that next-line characters will not be included in the white-space normalisation. Using any of these outside scalar values is likely to result in errors during parsing. For a relatively robust solution, try replacing `\x85` and `\u2028` with `\n` and `\u2029` with `\n\n`.
* Tag shorthands can no longer include any of the characters `,[]{}`, but can include `#`. To work around this, either fix your tag names or use verbatim tags.
* Anchors can no longer include any of the characters `,[]{}`.
* Inside double-quoted strings `\/` is now a valid escape for the `/` character.
* Quoted content can include practically all Unicode characters

### Changes from YAML 1.0 to 1.1

```text
%YAML:1.0
---
date: 2001-01-23
number: !int '123'
string: !str 123
pool: !!ball { number: 8 }
invoice: !domain.tld,2002/^invoice
  customers: !seq
    - !^customer
      given : Chris
      family : Dumars
```

```js
// YAMLWarning:
//   The tag tag:private.yaml.org,2002:ball is unavailable,
//   falling back to tag:yaml.org,2002:map
// YAMLWarning:
//   The tag tag:domain.tld,2002/^invoice is unavailable,
//   falling back to tag:yaml.org,2002:map
// YAMLWarning:
//   The tag ^customer is unavailable,
//   falling back to tag:yaml.org,2002:map
{ date: '2001-01-23T00:00:00.000Z',
  number: 123,
  string: '123',
  pool: { number: 8 },
  invoice: { customers: [ { given: 'Chris', family: 'Dumars' } ] } }
```

The most significant difference between these versions is the complete refactoring of the tag syntax:

* The `%TAG` directive has been added, along with the `!foo!` tag prefix shorthand notation.
* The `^` character no longer enables tag prefixing.
* The private vs. default scoping of `!` and `!!` tag prefixes has been switched around; `!!str` is now a default tag while `!bar` is an application-specific tag.
* Verbatim `!<baz>` tag notation has been added.
* The formal `tag:domain,date/path` format for tag names has been dropped as a requirement.

Additionally, the formal description of the language describing the document structure has been completely refactored between these versions, but the described intent has not changed. Other changes include:

* A `\` escape has been added for the tab character, in addition to the pre-existing `\t`
* The `\^` escape has been removed
* Directives now use a blank space `' '` rather than `:` as the separator between the name and its parameter/value.

`yaml` supports parsing and stringifying YAML 1.0 tags, but does not expand tags using the `^` notation. If this is something you'd find useful, please file a [GitHub issue](https://github.com/eemeli/yaml/issues) about it.
