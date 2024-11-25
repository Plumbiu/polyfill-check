# polyfill-check

Detect polyfills dependencies in your project and give the ECMAScript versions.

```bash
polyfill-check
```

results:

![view](/assets/view.webp)

> [!NOTE]
> The results may not be accurate because this detection is based on the dependency name and whether the `keywords` field in the dependency contains the `polyfill` or `shim` string. **It It also depends on the variables in the [`manual`]('/src/manual.ts') file, welcome PR!.**
