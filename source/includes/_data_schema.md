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
