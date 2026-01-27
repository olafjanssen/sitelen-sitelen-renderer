/* tslint:disable */
/* eslint-disable */
/**
 * Initialize glyph registry (called automatically, but can be called manually for custom sprites)
 */
export function init(): void;
/**
 * Render text to SVG string
 * 
 * # Arguments
 * * `text` - Toki Pona text to render
 * * `optimal_ratio` - Optional optimal ratio for layout (if None, uses default)
 */
export function render_svg(text: string, optimal_ratio?: number | null): string;
/**
 * Render text to PNG bytes
 * 
 * # Arguments
 * * `text` - Toki Pona text to render
 * * `optimal_ratio` - Optional optimal ratio for layout (if None, uses default)
 */
export function render_png(text: string, optimal_ratio?: number | null): Uint8Array;
/**
 * Get all available layout option ratios for a text
 * Returns a JSON array of ratios sorted from smallest to largest
 */
export function get_layout_ratios(text: string): string;
/**
 * Render each parsed sentence to its own SVG
 * Returns concatenated SVG strings, one per sentence
 */
export function render_sentences(text: string, optimal_ratio?: number | null): string;
/**
 * Initialize the glyph registry with custom sprite content
 * This allows overriding the default embedded sprite with a custom one
 */
export function init_glyphs(sprite_content: string): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly init: () => void;
  readonly render_svg: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly render_png: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly get_layout_ratios: (a: number, b: number) => [number, number, number, number];
  readonly render_sentences: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly init_glyphs: (a: number, b: number) => [number, number];
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
