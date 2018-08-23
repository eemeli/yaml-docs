# YAML

> To install:

```sh
npm install yaml
# or
yarn add yaml
```

`yaml` is a new definitive library for [YAML](http://yaml.org/), a human friendly data serialization standard. This library:

- Supports all versions of the standard (1.0, 1.1, and 1.2),
- Passes all of the [yaml-test-suite](https://github.com/yaml/yaml-test-suite) tests,
- Can accept any string as input without throwing, parsing as much YAML out of it as it can, and
- Supports parsing, modifying, and writing YAML comments.

The library is released under the ISC open source license, and the code is [available on GitHub](https://github.com/eemeli/yaml/). It has no external dependencies, and is usable in both browser and node environments.

## API Overview

The API provided by `yaml` has three layers, depending on how deep you need to go: [Pure JavaScript](#pure-javascript), [YAML Documents](#yaml-documents), and the [CST Parser](#cst-parser). The first has the simplest API and "just works", the second gets you all the bells and whistles supported by the library along with a decent AST, and the third is the closest to YAML source, making it fast, raw, and crude.

<h3>Pure JavaScript</h3>

```js
import YAML from 'yaml'
// or
const YAML = require('yaml').default
```

- [`YAML.parse(str, options): value`](#yaml-parse)
- [`YAML.stringify(value, options): string`](#yaml-stringify)

<h3>YAML Documents</h3>

- [`YAML.createNode(value, wrapScalars): Node`](#creating-nodes)
- [`YAML.defaultOptions`](#options)
- [`YAML.Document`](#yaml-documents)
  - [`constructor(options)`](#creating-documents)
  - [`defaults`](#options)
  - [`#anchors`](#working-with-anchors)
  - [`#contents`](#content-nodes)
  - [`#errors`](#errors)
- [`YAML.parseAllDocuments(str, options): YAML.Document[]`](#parsing-documents)
- [`YAML.parseDocument(str, options): YAML.Document`](#parsing-documents)

```js
import Map from 'yaml/map'
import Pair from 'yaml/pair'
import Seq from 'yaml/seq'
```

- [`new Map()`](#creating-nodes)
- [`new Pair(key, value)`](#creating-nodes)
- [`new Seq()`](#creating-nodes)

<h3>CST Parser</h3>

```js
import parseCST from 'yaml/parse-cst'
```

- [`parseCST(str): CSTDocument[]`](#parsecst)
- [`YAML.parseCST(str): CSTDocument[]`](#parsecst)
