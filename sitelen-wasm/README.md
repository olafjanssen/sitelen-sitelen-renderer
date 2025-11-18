# Sitelen Sitelen WASM

WASM bindings for the Sitelen Sitelen renderer.

## Building

```bash
wasm-pack build --target web --out-dir pkg
```

## Usage

```javascript
import init, { render_svg } from './pkg/sitelen_wasm.js';

async function main() {
    await init();
    const svgBytes = render_svg("mi pona.");
    const svgText = new TextDecoder().decode(svgBytes);
    document.body.innerHTML = svgText;
}

main();
```

## Example

See `examples/wasm/` for a complete example.

