// Auto-render all elements with [data-sitelen] using the WASM module
// Usage: import this file as a module; it will auto-run on DOMContentLoaded

import init, { render_sentences } from './pkg/sitelen_wasm.js';

async function ensureInit() {
    await init();
}

function injectDefaultStyles() {
    const STYLE_ID = 'sitelen-wasm-default-styles';
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* Default Sitelen Sitelen container styles */
[data-sitelen] {
  padding: 20px;
  overflow-x: auto;
  overflow-y: hidden;
}
[data-sitelen] .sentences-container {
  column-width: 140px;
  column-gap: 20px;
  column-fill: auto;
  max-height: 90vh;
}
[data-sitelen] .sentences-container svg {
  width: 100%;
  height: auto;
  display: block;
  break-inside: avoid;
  margin-bottom: 20px;
}
`;
    document.head.appendChild(style);
}

function normalizeTextContent(el) {
    const text = (el.textContent || '').trim().replace(/\s*\n\s*/g, ' ');
    return text;
}

async function renderElement(el) {
    const text = normalizeTextContent(el);
    if (!text) return;
    const container = document.createElement('div');
    container.className = 'sentences-container';
    const html = render_sentences(text, null);
    if (html && html.trim().length > 0) {
        container.innerHTML = html;
        el.innerHTML = '';
        el.appendChild(container);
    }
}

async function renderAll(root = document) {
    await ensureInit();
    injectDefaultStyles();
    const nodes = root.querySelectorAll('[data-sitelen]');
    for (const el of nodes) {
        try {
            await renderElement(el);
        } catch (e) {
            // Log and continue
            console.error('sitelen-wasm auto render error:', e);
        }
    }
}

// Auto-run once DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { renderAll(); });
} else {
    renderAll();
}

// Named export in case manual invocation is desired
export { renderAll as renderSitelenDataAttributes };


