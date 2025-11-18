# Sitelen Sitelen Renderer

A modern Rust-based renderer for converting Toki Pona text into the Sitelen Sitelen non-linear writing style. This is a complete rewrite of the original JavaScript implementation, providing better performance, type safety, and a cleaner API.

## Features

- **CLI-first**: Native command-line tool for rendering Toki Pona text
- **Multiple output formats**: SVG, PNG, and HTML
- **WASM support**: Browser-compatible WebAssembly build
- **Type-safe**: Built with Rust for compile-time guarantees
- **High performance**: Significantly faster than the JavaScript version

## Installation

### CLI

```bash
cargo install --path sitelen-cli
```

Or build from source:

```bash
git clone https://github.com/olafjanssen/sitelen-sitelen-renderer.git
cd sitelen-sitelen-renderer
cargo build --release
```

### WASM

Build the WASM package:

```bash
cd sitelen-wasm
wasm-pack build --target web --out-dir pkg
```

## Usage

### CLI

```bash
# Render text directly
sitelen "mi pona. ale li jo e tenpo." --output output.svg

# Render from file
sitelen --input text.txt --output output.png --format png

# With custom settings
sitelen --input text.txt --output output.svg --ratio 0.8 --stroke-width 2.0 --shadow
```

### Library (Rust)

```rust
use sitelen_core::{OutputFormat, Pipeline};

let pipeline = Pipeline::new()?;
let svg_bytes = pipeline.render_text("mi pona.", OutputFormat::Svg)?;
std::fs::write("output.svg", svg_bytes)?;
```

### WASM (JavaScript)

```javascript
import init, { render_svg } from './pkg/sitelen_wasm.js';

await init();
const svgBytes = render_svg("mi pona.");
const svgText = new TextDecoder().decode(svgBytes);
document.body.innerHTML = svgText;
```

## Architecture

The project is organized as a Rust workspace with three main crates:

- **`sitelen-core`**: Core library with parsing, layout, and rendering logic
- **`sitelen-cli`**: Command-line interface
- **`sitelen-wasm`**: WebAssembly bindings for browser use

## Development

### Building

```bash
# Build all crates
cargo build

# Build specific crate
cargo build -p sitelen-core
cargo build -p sitelen-cli
cargo build -p sitelen-wasm
```

### Testing

```bash
# Run all tests
cargo test

# Run tests for specific crate
cargo test -p sitelen-core
```

### Running CLI

```bash
cargo run --bin sitelen -- "mi pona." --output output.svg
```

## Migration from JavaScript Version

The Rust version maintains the same visual output as the JavaScript version but with a different API:

### Old (JavaScript)

```javascript
// HTML
<section data-sitelen data-sitelen-ratio="1">
    ale li jo e tenpo. ale li pona.
</section>
```

### New (Rust CLI)

```bash
sitelen "ale li jo e tenpo. ale li pona." --output output.svg --ratio 1.0
```

### New (WASM)

```javascript
import { render_svg } from './pkg/sitelen_wasm.js';
const svg = render_svg("ale li jo e tenpo. ale li pona.");
```

## Output Formats

- **SVG**: Scalable vector graphics (default)
- **PNG**: Rasterized image
- **HTML**: HTML page with embedded SVG

## Configuration

The renderer supports various configuration options:

- `optimal_ratio`: Preferred aspect ratio (default: 0.8)
- `stroke_width`: Stroke width for glyphs (default: 2.0)
- `shadow`: Enable shadow effects (default: false)
- `scale`: Base scale for glyphs (default: 1.2)
- `scale_skew`: Scale skew for container overflow (default: 1.3)

## License

ISC

## Author

Olaf T.A. Janssen <o.t.a.janssen@gmail.com>

## Acknowledgments

This project is inspired by Jonathan Gabel's Sitelen Sitelen writing system for Toki Pona.
