# Code Quirks

When using Persist in a minified or bundled codebase, it's important to be aware of two key quirks: handling class names during minification and managing reference errors when working with model relationships.

## Class Names and Minification

When you bundle or minify JavaScript code for production, class names are often altered, which can cause issues. Specifically, models may lose their original class names, which we rely on for storing data in the correct namespace.

To avoid this problem, you have two options:

1. Disable class name mangling in your minifier.
2. Use `this.setMinifiedName(name)` to manually specify the model's name.

```javascript
import Persist from "@acodeninja/persist";

export class Person extends Persist.Type.Model {
    static {
        this.setMinifiedName('Person');
        this.name = Persist.Type.String.required;
    }
}
```

If you don't set the minified name, the wrong namespace may be used when saving models, leading to unexpected behavior.

## Reference Errors

When defining relationships between models, especially circular relationships (e.g., `Person` references `Address`, and `Address` references `Person`), the order of declarations matters. If the models are referenced before they are initialized, you'll encounter `ReferenceError` messages, like:

```console
ReferenceError: Cannot access 'Address' before initialization
```

To avoid these errors, always define model relationships using arrow functions. For example:

```javascript
import Persist from "@acodeninja/persist";

export class Person extends Persist.Type.Model {
    static {
        this.address = () => Address;
    }
}

export class Address extends Persist.Type.Model {
    static {
        this.person = () => Person;
        this.address = Persist.Type.String.required;
        this.postcode = Persist.Type.String.required;
    }
}
```

By doing this, you ensure that model references are evaluated lazily, after all models have been initialized, preventing `ReferenceError` issues.

## Using `HTTP` StorageEngine in Browser

When implementing thee `HTTP` engine for code that runs in the web browser, you must pass `fetch` into the engine configuration and bind it to the `window` object.

```javascript
import Persist from "@acodeninja/persist";
import HTTPStorageEngine from "@acodeninja/persist/engine/storage/http";

Persist.addEngine('remote', HTTPStorageEngine, {
    host: 'https://api.example.com',
    fetch: fetch.bind(window),
});
```

This will ensure that `fetch` can access the window context which is required for it to function.
