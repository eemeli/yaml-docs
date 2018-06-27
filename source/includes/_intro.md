# YAML

> To install:

```sh
npm install yaml@next
# or
yarn add yaml@next
```

> To use:

```js
import YAML from 'yaml'
// or
const YAML = require('yaml').default
```

`yaml` is a JavaScript parser and stringifier for [YAML](http://yaml.org/), a human friendly data serialization standard. It supports almost all aspects of the 1.2 version of the spec for both parsing and stringifying data, as well as a few of the most common extensions.

The library is released under the ISC open source license, and the code is [available on GitHub](https://github.com/eemeli/yaml/). It has no external dependencies, and is usable in both browser and node environments.

The API provided by `yaml` has three layers, depending on how deep you need to go: [Pure JavaScript](#pure-javascript), [YAML Objects](#yaml-objects), and the [CST Parser](#cst-parser). The first has the simplest API and "just works", the second gets you all the bells and whistles supported by the library, and the third is the closest to YAML source, making it fast, raw, and crude.
