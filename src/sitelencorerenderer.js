/* global sitelenSprite */

/**
 * Core renderer of sitelen sitelen, expects input that is parsed and turned into a layout.
 *
 * @type {{renderLayoutOption, renderComplexLayout, renderAllOptions}}
 */
var sitelenCoreRenderer = function (debug) {
    'use strict';

    var sprite = new DOMParser().parseFromString(sitelenSprite, "image/svg+xml").documentElement;

    // load raw svg file for debugging purposes instead of a prebaked string
    if (debug) {
        // load the rendering set
        var xhr = new XMLHttpRequest();
        xhr.open('get', '../../images/sprite.css.svg', false);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return;
            }
            sprite = xhr.responseXML.documentElement;
        };
        xhr.send();
    }

    window.addEventListener('load', function () {
        var newsvg = document.importNode(sprite, false); // surprisingly optional in these browsers
        document.body.appendChild(newsvg);
    });

    var svgNS = "http://www.w3.org/2000/svg",
        xlinkNS = "http://www.w3.org/1999/xlink";

    /**
     * Helper function for creating a DOM element with a full set of attributes and styles.
     *
     * @param tag           the xml tag
     * @param attributes    a key-value object with attributes
     * @param styles        a key-value object with css styles
     * @param namespace     an optional namespace string
     * @returns {Element}   the DOM element
     */
    function createNewElement(tag, attributes, styles, namespace) {
        var element = namespace ? document.createElementNS(namespace, tag) : document.createElement(tag);

        for (var attribute in attributes) {
            if (!attributes.hasOwnProperty(attribute)) {
                continue;
            }
            if (attributes[attribute].ns) {
                element.setAttributeNS(attributes[attribute].ns, attribute, attributes[attribute].value);
            } else {
                element.setAttribute(attribute, attributes[attribute]);
            }
        }
        for (var style in styles) {
            if (styles.hasOwnProperty(style)) {
                element.style[style] = styles[style];
            }
        }
        return element;
    }

    /**
     * Get custom scaling and transforming of special glyphs, as compared to word glyphs.
     *
     * @param option    the layout option to consider
     * @param baseScale the base scale of the container
     * @returns {number[]}  an array of non-uniform scale factors
     */
    function getSeparatorScale(option, baseScale) {
        var scale = [baseScale * (option.ratio < 0.667 ? 1.2 : 0.92),
            baseScale * (option.ratio < 0.667 ? 0.9 : 0.92), 0, 0];

        if (option.separator === 'li') {
            scale[0] = baseScale * (option.ratio < 0.667 ? 1.2 : 0.88);
            scale[1] = baseScale * (option.ratio < 0.667 ? 0.9 : 0.88);
        }
        if (option.ratio === 1 && option.separator === 'o') {
            scale[1] = baseScale * 1;
            scale[3] = -10;
        }
        if (option.ratio < 0.667 && option.separator === 'o') {
            scale[0] = baseScale * 1;
            scale[1] = baseScale * 0.88;
            scale[3] = -15;
        }
        if (option.ratio > 1.5 && option.separator === 'o') {
            scale[1] = baseScale * 1;
            scale[2] = -15;
            scale[3] = -10;
        }

        if (option.ratio === 1 && option.separator === 'e') {
            scale[0] = baseScale * 1;
        }

        if (option.ratio === 1 && option.separator === 'e') {
            scale[2] = 10;
        }
        if (option.ratio === 1 && option.separator === 'tawa') {
            scale[0] = baseScale * 0.9;
            scale[1] = baseScale * 0.9;
            scale[2] = 5;
            scale[3] = -10;
        }
        if (option.ratio === 1 && option.separator === 'lon') {
            scale[2] = 15;
            scale[3] = -15;
        }
        if (option.ratio > 1.5 && option.separator === 'e') {
            scale[2] = 5;
        }
        if (option.ratio > 1.5 && option.separator === 'tawa') {
            scale[2] = 10;
        }
        return scale;
    }

    /**
     * Get custom scaling of container glyphs, as compared to word glyphs.
     *
     * @param option    the layout option to consider
     * @param baseScale the base scale of the container
     * @returns {number}  an array of non-uniform scale factors
     */
    function getContainerScale(option, baseScale) {
        var scale = option.separator ? baseScale * 1.1 : 1.02;

        if (option.ratio === 1 && option.separator === 'e') {
            scale = baseScale * 1.2;
        }
        if (option.ratio === 1 && option.separator === 'tawa') {
            scale = baseScale * 1.2;
        }
        if (option.ratio === 1 && option.separator === 'lon') {
            scale = baseScale * 1.4;
        }

        return scale;
    }

    /**
     * Recursively renders parts of a sentence
     * @param option    the layout option to render
     * @param target    the target container
     * @param settings  the render settings
     * @param position  the position of the current container
     * @param sizeParent    the size of the parent container
     * @param sizeParentNormed   the alternate size of the parent container, in grandfather coordinates
     */
    function renderPartOption(option, target, settings, position, sizeParent, sizeParentNormed) {
        var container = target,
            scale = settings.scale / 1.1,
            glyphScale = settings.scale,
            separatorScale = getSeparatorScale(option, settings.scale),
            containerScale = getContainerScale(option, settings.scale);

        if (position) {
            var box = [position[0] * 100 / sizeParentNormed[0],
                    position[1] * 100 / sizeParentNormed[1],
                    sizeParent[0] * 100 / sizeParentNormed[0],
                    sizeParent[1] * 100 / sizeParentNormed[1]
                ],
                center = [box[0] + box[2] / 2, box[1] + box[3] / 2],
                matrix = [];

            if (option.separator) {
                matrix = [separatorScale[0], 0, 0, separatorScale[1], center[0] - separatorScale[0] * center[0], center[1] - separatorScale[1] * center[1]];
                var use = createNewElement('use', {
                    href: {
                        ns: xlinkNS,
                        value: '#tp-c-' + option.separator + (option.ratio > 1.5 ? '-wide' : option.ratio < 0.667 ? '-tall' : '')
                    },
                    transform: 'matrix(' + matrix.join(',') + ')',
                    // viewBox: [0, 0, 100, 100].join(' '),
                    // preserveAspectRatio: 'none',
                    height: box[3],
                    width: box[2],
                    x: box[0],
                    y: box[1]
                }, {}, svgNS);

                if (option.separator === 'li') {
                    use = createNewElement('rect', {
                        transform: 'matrix(' + matrix.join(',') + ')',
                        height: box[3],
                        width: box[2],
                        x: box[0],
                        y: box[1],
                        rx: 15.0 / sizeParentNormed[0] * Math.max(sizeParent[0], sizeParent[1]) / separatorScale[0],
                        ry: 15.0 / sizeParentNormed[1] * Math.max(sizeParent[0], sizeParent[1]) / separatorScale[1]
                    }, {
                        fill: '#fff'
                    }, svgNS);
                }

                if (option.separator === 'cartouche') {
                    target.appendChild(use);
                } else {
                    target.insertBefore(use, target.firstChild);
                }
            }

            matrix = [scale, 0, 0, scale, center[0] - scale * center[0], center[1] - scale * center[1]];
            container = createNewElement('svg', {
                // transform: 'matrix(' + matrix.join(',') + ')',
                viewBox: [separatorScale[2] - (100 * containerScale - 100) / 2,
                    (option.type === 'punctuation' ? 20 : separatorScale[3]) - (100 * containerScale - 100) / 2,
                    100 * containerScale,
                    100 * containerScale].join(' '),
                preserveAspectRatio: 'none',
                height: box[3],
                width: box[2],
                x: box[0],
                y: box[1]
            }, {
                overflow: 'visible'
            }, svgNS);

            if (option.type === 'punctuation') {
                target.insertBefore(container, target.firstChild);
            } else {
                target.appendChild(container);
            }
        }

        option.state.units.forEach(function (glyph) {
            if (glyph.unit.rule === 'word-glyph' || glyph.unit.rule === 'syl-glyph') {
                var box = [(glyph.position[0] * 100 / option.size[0]),
                    (glyph.position[1] * 100 / option.size[1]),
                    (glyph.size[0] * 100 / option.size[0]),
                    (glyph.size[1] * 100 / option.size[1])
                ];

                var center = [box[0] + box[2] / 2, box[1] + box[3] / 2],
                    matrix = [glyphScale, 0, 0, glyphScale, center[0] - glyphScale * center[0], center[1] - glyphScale * center[1]];

                var use = createNewElement('use', {
                    href: {
                        ns: xlinkNS,
                        value: glyph.unit.rule === 'word-glyph' ? ('#tp-wg-' + glyph.unit.token) : ('#tp-syl-' + glyph.unit.token)
                    },
                    transform: 'matrix(' + matrix.join(',') + ')',
                    // viewBox: [0, 0, 100, 100].join(' '),
                    // preserveAspectRatio: 'none',
                    height: box[3],
                    width: box[2],
                    x: box[0],
                    y: box[1]
                }, {}, svgNS);

                container.insertBefore(use, container.firstChild);

            } else {
                renderPartOption(glyph.unit, container, settings, glyph.position, glyph.size, option.size);
            }
        });

    }

    /**
     * Render a complex layout, which is sentence made out of several compounds.
     * @param options   the option per compound
     * @param target    the target container
     * @param settings  the render settings
     * @returns {Element}   the rendered svg element
     */
    function renderComplexLayout(options, target, settings) {
        if (!settings) {
            settings = {};
        }
        if (!settings.scale) {
            settings.scale = 1.2;
        }
        if (!settings.scaleSkew) {
            settings.scaleSkew = 1.3; // scale to allow glyphs to stick out of the sentence container
        }
        if (!settings.shadow) {
            settings.shadow = false;
        }
        if (!settings.spacing) {
            settings.spacing = 0;
        }

        var xSize = 0, ySize = 0;
        options.forEach(function (option) {
            xSize = Math.max(xSize, option.size[0]);
        });
        options.forEach(function (option) {
            ySize += option.size[1] * xSize / option.size[0];
        });

        var box = [0, 0,
                xSize * 100,
                ySize * 100
            ],
            sentenceContainer = createNewElement('svg',
                {
                    xmlns: svgNS,
                    'xmlns:xlink': xlinkNS,
                    version: 1.2,
                    preserveAspectRatio: 'xMidYMin meet',
                    viewBox: [-(box[2] * settings.scaleSkew - box[2]) / 2,
                        -(box[3] * settings.scale - box[3] ) / 2,
                        box[2] * settings.scaleSkew,
                        box[3] * settings.scale].join(' ')
                }, {}, svgNS);

        sentenceContainer.setAttribute('data-sitelen-sentence', '');

        var styling = document.createElement('style');
        var strokeWidth = settings.styling.strokeWidth?settings.styling.strokeWidth:'2';

        styling.innerHTML = 'ellipse,polygon,polyline,rect,circle,line,path{stroke-width:'+strokeWidth+';stroke:black;vector-effect:non-scaling-stroke} .filler{stroke:none;}';

        sentenceContainer.appendChild(styling);

        if (settings.shadow) {
            var filter = createNewElement('filter', {
                id: 'shadow',
                width: '150%',
                height: '150%'
            }, {}, svgNS);
            filter.innerHTML = '<feOffset result = "offOut" in = "SourceGraphic" dx = "0" dy = "2"></feOffset><feColorMatrix result = "matrixOut" in = "offOut" type = "matrix" values = "0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0"></feColorMatrix><feGaussianBlur result = "blurOut" in = "matrixOut" stdDeviation = "2"></feGaussianBlur><feBlend in = "SourceGraphic" in2 = "blurOut" mode = "normal"></feBlend>';
            sentenceContainer.appendChild(filter);
        }

        var yPos = 0;
        options.forEach(function (option) {
            var box = [0, 0, xSize * 100, option.size[1] * xSize / option.size[0] * 100],
                innerContainer = createNewElement('svg',
                    {
                        width: box[2],
                        height: box[3],
                        viewBox: [0, 0, 100, 100].join(' '),
                        y: yPos,
                        preserveAspectRatio: 'none',
                        filter: settings.shadow ? "url(#shadow)" : ""
                    }, {
                        overflow: 'visible'
                    }, svgNS);

            yPos += box[3];

            renderPartOption(option, innerContainer, settings);

            sentenceContainer.appendChild(innerContainer);
            if (!settings.ignoreHeight) {
                requestAnimationFrame(function () {
                    var rect = sentenceContainer.getBoundingClientRect();
                    sentenceContainer.style.height = (rect.height / settings.scale) + 'px';
                });
            }
        });

        // add template stamps so it can be downloaded/exported without the sprite svg
        var addedIds = {};
        if (settings.exportable) {
            [].slice.call(sentenceContainer.getElementsByTagName('use')).forEach(function (use) {
                var symbolId = use.getAttribute('href');
                var symbol = sprite.querySelector(symbolId);
                if (symbol) {
                    if (!addedIds[symbolId]) {
                        sentenceContainer.appendChild(symbol.cloneNode(true));
                    }
                    addedIds[symbolId] = true;
                } else {
                    console.log('WARNING: symbol ' + symbolId + ' cannot be found.');
                }
            });
        }

        target.appendChild(sentenceContainer);

        return sentenceContainer;
    }

    /**
     * Render a sentence layout option into a target container.
     * @param option    the sentence layout option
     * @param target    the target DOM container
     * @param settings  rendering settings
     */
    function renderSentenceOption(option, target, settings) {
        if (!option) {
            console.log('WARNING: nothing to render');
            return;
        }
        if (!settings) {
            settings = {};
        }
        if (!settings.scale) {
            settings.scale = 1.2;
        }

        var box = [0, 0,
                option.size[0] * 100,
                option.size[1] * 100
            ],
            sentenceContainer = createNewElement('svg',
                {
                    xmlns: svgNS,
                    'xmlns:xlink': xlinkNS,
                    version: 1.1,
                    viewBox: [-(box[2] * settings.scale - box[2]) / 2, -(box[3] * settings.scale - box[3]) / 2, box[2] * settings.scale, box[3] * settings.scale].join(' ')
                }, {
                    display: 'block'
                }, svgNS),
            innerContainer = createNewElement('svg',
                {
                    width: box[2],
                    height: box[3],
                    viewBox: [0, 0, 100, 100].join(' '),
                    preserveAspectRatio: 'none'
                }, {
                    overflow: 'visible'
                }, svgNS);

        renderPartOption(option, innerContainer, settings);

        sentenceContainer.appendChild(innerContainer);

        // add template stamps so it can be downloaded/exported without the sprite svg
        if (settings.exportable) {
            [].slice.call(sentenceContainer.getElementsByTagName('use')).forEach(function (use) {
                var symbolId = use.getAttribute('href');
                var symbol = sprite.querySelector(symbolId);
                if (symbol) {
                    sentenceContainer.appendChild(symbol.cloneNode(true));
                } else {
                    console.log('WARNING: symbol ' + symbolId + ' cannot be found.');
                }
            });
        }

        target.appendChild(sentenceContainer);

        return sentenceContainer;
    }

    /**
     * Render all given options in one go.
     *
     * @param compoundOptions   the compound options
     */
    function renderOptions(compoundOptions) {
        compoundOptions.forEach(function (option) {
            renderSentenceOption(option, document.getElementById('sitelen'),
                {scale: 1.2, exportable: true});
        });
    }

    return {
        createNewElement: createNewElement,
        renderLayoutOption: renderSentenceOption,
        renderComplexLayout: renderComplexLayout,
        renderAllOptions: renderOptions
    };
}(true);