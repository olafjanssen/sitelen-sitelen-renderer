# Index of externally used resources

## sitelen sitelen
In this folder the work of jan Same is contained who created vector versions in Adobe Illustrator of all sitelen sitelen
glyphs.

### derivative works
To create an SVG of every glyph. For WordGlyphs.ai, I followed the following steps:

1. Rename all sitelen groups to the latinized form of the toki pona word.
2. Remove all layers that do not contain the sitelen.
3. Fix the path grouping of the linja glyph
4. Convert all groups into layers (using GroupToLayer.jsx)
5. Export all layers to tp-wg-[layer-name].svg.

## illustrator-scripts

### MultiExporter.jsx
Allows for exporting different layers to different (svg) files.
Taken from: http://blog.iconfinder.com/how-to-export-multiple-layers-to-svg-files-in-adobe-illustrator/ (Dec 29, 2016)

### GroupToLayer.jsx
Allows for converting groups into layers in Illustrator.
Taken from: https://forums.adobe.com/thread/892733?tstart=0 (Dec 29, 2016)

## cyk-js-master
A parser that takes CNF grammar as input.

Taken from: https://github.com/lagodiuk/cyk-js

## formalgrammar
A formal grammar of Toki Pona in CFG form, includes Python source to create CNF grammar.

Taken from: http://www2.hawaii.edu/~chin/661F12/projects.html

### derivative works
Several adjustments have been made to the formal grammar to be able to parse correct sentences:
1. anpa has been added as a noun