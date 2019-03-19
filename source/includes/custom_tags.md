# Custom Data Types

```js
import { binary, timestamp } from 'yaml/types'

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

The easiest way to extend a [schema](#data-schemas) is by defining the additional **tags** that you wish to support. For further customisation, `tags` may also be a function `(Tag[]) => (Tag[])` that may modify the schema's base tag array.

YAML 1.1 tags are available as exports of `yaml/types`, should you wish to use them with the YAML 1.2 `core` schema.

## Writing Custom Tags

```js
import { stringifyString } from 'yaml/util'

const regexp = {
  identify: value => value instanceof RegExp,
  tag: '!re',
  resolve(doc, cst) {
    const match = cst.strValue.match(/^\/([\s\S]+)\/([gimuy]*)$/)
    return new RegExp(match[1], match[2])
  }
}

const sharedSymbol = {
  identify: value => value.constructor === Symbol,
  tag: '!symbol/shared',
  resolve: (doc, cst) => Symbol.for(cst.strValue),
  stringify(item, ctx, onComment, onChompKeep) {
    const key = Symbol.keyFor(item.value)
    if (key === undefined)
      throw new Error('Only shared symbols are supported')
    return stringifyString({ value: key }, ctx, onComment, onChompKeep)
  }
}

YAML.defaultOptions.tags = [regexp, sharedSymbol]

YAML.stringify({
  regexp: /foo/gi,
  symbol: Symbol.for('bar')
})
// regexp: !re /foo/gi
// symbol: !symbol/shared bar
```

In YAML-speak, a custom data type is represented by a _tag_. The default tags are mostly stringified with _implicit_ tags, meaning that their type is detected automatically when parsing. Custom tags, on the other hand, are mostly _explicit_, meaning that they are prefixed with a local `!tag`, a shorthand `!ns!tag`, or a verbatim `!<tag:example.com,2019:tag>`.

To define your own tag, you'll need to define three or four things:

1. **`identify(value): boolean`** is used by `YAML.createNode` to detect your data type, e.g. using `typeof` or `instanceof`.
2. **`tag`** is the string identifier for your data type, with which its stringified form will be prefixed. Should either be a !-prefixed local `!tag`, or a fully qualified `tag:domain,date:foo`.
3. **`resolve(doc, cst): Node`** turns a CST node into an AST node; `doc` is the resulting `YAML.Document` instance.
4. **`stringify(item, ctx, onComment, onChompKeep): string`** is an optional function stringifying the `item` AST node in the current context `ctx`. `onComment` and `onChompKeep` are callback functions for a couple of special cases. If your data includes a suitable `.toString()` method, you can probably leave this undefined and use the default stringifier.

If you wish to implement your own custom tags, the [`!!binary`](https://github.com/eemeli/yaml/blob/master/src/tags/yaml-1.1/binary.js) and [`!!set`](https://github.com/eemeli/yaml/blob/master/src/tags/yaml-1.1/set.js) tags provide relatively cohesive examples to study.

The default schema types also include a few additional properties:

- `test` and `default` allow for values to be stringified without an explicit tag and detected using a regular expression. For most cases, it's unlikely that you'll actually want to use these, even if you first think you do.
- `createNode` is an optional factory function, used e.g. by collections when wrapping JS objects as AST nodes. If set, will be called as `createNode(schema, value, wrapScalars)` and should return a class extending `Node`.
- `nodeClass` is the `Node` child class that implements this tag. Required for collections and tags that have overlapping JS representations.
- If a tag has multiple forms that should be parsed and/or stringified differently, use `format` to identify them.
- `options` are used by some tags to configure their stringification.
