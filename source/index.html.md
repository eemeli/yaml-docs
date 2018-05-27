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
