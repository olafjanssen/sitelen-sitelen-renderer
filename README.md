# Sitelen Sitelen Renderer

Modern Rust-based library and command-line tool to turn Toki Pona text into the **sitelen sitelen** non-linear writing style. This is a complete rewrite of the original JavaScript implementation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)](https://github.com/olafjanssen/sitelen-sitelen-renderer/releases)
[![Rust](https://img.shields.io/badge/rust-1.70+-orange.svg)](https://www.rust-lang.org/)
[![GitHub stars](https://img.shields.io/github/stars/olafjanssen/sitelen-sitelen-renderer.svg?style=social&label=Star)](https://github.com/olafjanssen/sitelen-sitelen-renderer)

![example](images/example.svg)

## Motivation

I created **Sitelen Sitelen Renderer** because I am fascinated by combining the artificial language Toki Pona with the non-linear writing style **sitelen sitelen** by Jonathan Gabel. While drawing **sitelen sitelen** by hand is a meditative activity, I was wondering if I could create them algorithmically. My first attempt was in the beginning of 2015 when I experimented with CSS Flexbox using SVG for the Glyphs. The algorithm was limited and doomed, so in October 2015 I started anew and set out to create SVG-only sitelen sitelen that can be exported and reused.

The project had since then been mostly dormant, with only a few minor fixes here and there. Now, in 2025 the project has accumulated so much rust, its codebase is now rewritten in Rust. This Rust rewrite maintains the same visual output and algorithm spirit while providing better performance, type safety, and modern tooling. This is still a hobby project that I work on in my spare time.

## Features

- **CLI-first**: Native command-line tool for rendering Toki Pona text in the terminal
- **WASM support**: Browser-compatible WebAssembly build for web integration
- **High performance**: Significantly faster than the JavaScript version
- **Same visual output**: Maintains compatibility with the original JavaScript implementation

- **Soon**: Fixes such as adding a few *nimi sin* to complete the *nimi ku suli*.

## Writing tips

- **Lowercase text**: All Toki Pona text is expected in lower case
- **Sentence endings**: All sentences should end with `.`, `!`, `?`, or `#` (for banners). The colon `:` and `,` are also recognized as punctuation
- **Proper nouns in cartouches**: Syllables appear in cartouches by writing words starting with an upper case letter: `jan Pona` vs `jan pona`
- **Multiple sentences**: Multiple sentences are automatically split by punctuation. Each sentence is rendered separately unless using `render_sentences()`
- **Commas**: Commas before `la` and `li` are automatically removed, so `tenpo, la` becomes `tenpo la`
- **Spacing**: Double spaces are automatically normalized to single spaces
- **Context separators**: The `la` particle is recognized as a context separator and creates separate sentence parts

## Installation

### CLI

Install the CLI tool:

```bash
cargo install --path sitelen-cli
```

Or build from source:

```bash
git clone https://github.com/olafjanssen/sitelen-sitelen-renderer.git
cd sitelen-sitelen-renderer
cargo build --release
```

The binary will be available at `target/release/sitelen`.

### WASM

Build the WASM package for browser use:

```bash
cd sitelen-wasm
wasm-pack build --target web --out-dir pkg
```

This creates a `pkg` directory with the compiled WebAssembly module and JavaScript bindings.

## Usage

### CLI

The CLI tool can render Toki Pona text from command-line arguments, files, or stdin:

```bash
# Render text directly
sitelen "mi pona. ale li jo e tenpo." --output output.svg

# Render from file
sitelen --input text.txt --output output.png --format png

# Pipe text via stdin
echo "suno li pona." | sitelen --output output.svg

# With custom settings
sitelen --input text.txt --output output.svg --ratio 0.8 --stroke-width 2.0 --shadow

# Multiple sentences are rendered to separate files (if no output given then everyhing is piped to stdout)
sitelen "mi pona. sina pona." --output output.svg
# Creates: output_1.svg, output_2.svg
```

### WASM (JavaScript)

For web integration, use the WASM module:

```javascript
import init, { render_svg } from './pkg/sitelen_wasm.js';

async function main() {
    await init();  // Initialize the WASM module (required before use)
    const svgString = render_svg("mi pona.", null);
    document.body.innerHTML = svgString;
}

main();
```

With a specific layout ratio:

```javascript
await init();
const svgString = render_svg("ale li jo e tenpo. ale li pona.", 1.0);
```

#### Auto-rendering

For automatic rendering of elements with the `data-sitelen` attribute (similar to the original JavaScript version):

```javascript
import './auto.js';
```

Then in your HTML:

```html
<section data-sitelen>
    ale li jo e tenpo. ale li pona.
</section>
```

The auto-rendering script automatically:
- Initializes the WASM module
- Renders all elements with `data-sitelen` attribute using `render_sentences()`
- Injects default styles for proper display
- Handles multiple sentences with column layout

#### Available WASM Functions

- `init(): Promise<void>` - Initialize the WASM module (automatically called on import, but should be awaited before use)
- `render_svg(text: string, optimal_ratio?: number | null): string` - Render text to SVG string
- `render_png(text: string, optimal_ratio?: number | null): Uint8Array` - Render text to PNG bytes
- `get_layout_ratios(text: string): string` - Get all available layout ratios as JSON array
- `render_sentences(text: string, optimal_ratio?: number | null): string` - Render each sentence separately, returns concatenated SVG strings
- `init_glyphs(sprite_content: string): void` - Initialize with custom glyph sprite (optional, overrides default embedded sprite)

## Examples

The project includes several example pages demonstrating different use cases:

- **[Live input](examples/liveinput/liveinput.html)**: Interactive input with live preview
- **[Editor](examples/editor/editor.html)**: Markdown-style editor with live preview
- **[Layout engine](examples/layout/layout.html)**: Optimally fills a page with Sitelen Sitelen by trying different layout ratios (experimental)
- **[Proverbs](examples/proverbs/proverbs.html)**: Overview of Toki Pona proverbs from Sonja's book
- **[Tatoeba book](examples/tatoeba/tatoeba-book.html)**: Generates a book-like layout of Tatoeba sentences


## Configuration

The renderer supports various configuration options:

- `optimal_ratio`: Preferred aspect ratio (height/width, default: 0.8)
- `stroke_width`: Stroke width for glyphs (default: 2.0)
- `shadow`: Enable shadow effects (default: false)
- `scale`: Base scale for glyphs (default: 1.2)
- `scale_skew`: Scale skew for container overflow (default: 1.3)
- `exportable`: Embed glyph definitions in SVG (default: true)

## Migration from JavaScript Version

The Rust version maintains the same visual output as the JavaScript version but with a different API:

## Attribution

This live sitelen sitelen web project is made possible by the great work done before me.

**[Toki Pona](http://tokipona.org/)** is an artificial language invented in 2001 by Sonja Lang as an attempt to understand the meaning of life in 120 words. In my own search, I am convinced this language should not be used to translate large bodies of text or as an actual means of communication but as a personal tool for soul searching.

**[Sitelen Sitelen or Sitelen Suwi](http://www.jonathangabel.com/archive/2012/projects_t47.html)** is a project created by Jonathan Gabel in 2012 who created a non-linear writing style for Toki Pona inspired by Mayan script. I try to keep the algorithm behind the Sitelen Sitelen Renderer in the spirit of Jonathan's project and allow for the different ways of drawing the sitelen sitelen.

The **[vectorized glyphs](http://forums.tokipona.org/viewtopic.php?f=7&p=13786#p13786)** are based on the excellent work by jan Same. To make my SVGs scalable I sadly had to get rid of the non-uniform stroke widths. Also I have slightly different ideas about how to use the containers so I took the liberty of slightly altering some glyphs.

Mind that this project is far from complete: many language constructs are not implemented yet. If you want to contribute in any way, you can for instance file issues you find or come up with clever new ways to put sitelen sitelen into action.

Cheers!

## License

MIT (c) Olaf Janssen

## Author

Olaf T.A. Janssen <olaf.janssen@pm.me>
