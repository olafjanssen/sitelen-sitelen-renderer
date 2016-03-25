var sitelenRenderer = function () {
    "use strict";

    var sprite;
    // load the rendering set
    var xhr = new XMLHttpRequest;
    xhr.open('get', '../../images/sprite.css.svg', false);
    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4) return;
        var svg = xhr.responseXML.documentElement;
        sprite = svg;

        // include in document for efficient rendering of non-exportable sitelen TODO does not work
        var newsvg = document.importNode(svg, false); // surprisingly optional in these browsers
        setTimeout(function () {
            document.body.appendChild(newsvg);
        }, 0);

    };
    xhr.send();

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
            glyphScale = settings.scale * 1,
            separatorScale = settings.scale * 1,
            containerScale = option.separator ? settings.scale * 1.1 : 1;

        if (position) {
            var box = [position[0] * 100 / sizeParentNormed[0],
                    position[1] * 100 / sizeParentNormed[1],
                    sizeParent[0] * 100 / sizeParentNormed[0],
                    sizeParent[1] * 100 / sizeParentNormed[1]
                ],
                center = [box[0] + box[2] / 2, box[1] + box[3] / 2],
                matrix = [];

            if (option.separator) {
                matrix = [separatorScale, 0, 0, separatorScale, center[0] - separatorScale * center[0], center[1] - separatorScale * center[1]];
                var use = createNewElement('use', {
                    href: {
                        ns: xlinkNS,
                        value: '#tp-c-' + option.separator + (option.ratio > 1.5 ? '-wide' : option.ratio < 0.667 ? '-tall' : '')
                    },
                    transform: 'matrix(' + matrix.join(',') + ')',
                    viewBox: [0, 0, 100, 100].join(' '),
                    preserveAspectRatio: 'none',
                    height: box[3],
                    width: box[2],
                    x: box[0],
                    y: box[1]
                }, {}, svgNS);
                target.insertBefore(use, target.firstChild);
            }

            matrix = [scale, 0, 0, scale, center[0] - scale * center[0], center[1] - scale * center[1]];
            container = createNewElement('svg', {
                transform: 'matrix(' + matrix.join(',') + ')',
                viewBox: [-(100 * containerScale - 100) / 2, (option.type === 'punctuation' ? 20 : 0) - (100 * containerScale - 100) / 2, 100 * containerScale, 100 * containerScale].join(' '),
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
            if (glyph.unit.rule === 'word-glyph') {
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
                        value: '#tp-wg-' + glyph.unit.token
                    },
                    transform: 'matrix(' + matrix.join(',') + ')',
                    viewBox: [0, 0, 100, 100].join(' '),
                    preserveAspectRatio: 'none',
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

    function renderComplexLayout(options, target, settings) {
        if (!settings) {
            settings = {};
        }
        if (!settings.scale) {
            settings.scale = 1.2;
        }
        if (!settings.scaleSkew) {
            settings.scaleSkew = 1.3;
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
                    version: 1.1,
                    preserveAspectRatio: 'xMidYMin meet',
                    viewBox: [-(box[2] * settings.scale - box[2]) / 2, -(box[3] * settings.scaleSkew - box[3]) / 2, box[2] * settings.scaleSkew, box[3] * settings.scaleSkew].join(' ')
                }, {
                }, svgNS);

        var yPos = 0;
        options.forEach(function (option, index) {
            var box = [0, 0, xSize * 100, option.size[1] * xSize / option.size[0] * 100],
                innerContainer = createNewElement('svg',
                    {
                        width: box[2],
                        height: box[3],
                        viewBox: [0, 0, 100, 100].join(' '),
                        y: yPos,
                        preserveAspectRatio: 'none'
                    }, {
                        overflow: 'visible'
                    }, svgNS);

            yPos += box[3];

            renderPartOption(option, innerContainer, settings);

            sentenceContainer.appendChild(innerContainer);
            requestAnimationFrame(function(){
                var rect = sentenceContainer.getBoundingClientRect();
                sentenceContainer.style.height = (rect.height / settings.scale) + 'px';
            });
        });

        // add template stamps so it can be downloaded/exported without the sprite svg
        if (settings.exportable) {
            [].slice.call(sentenceContainer.getElementsByTagName('use')).forEach(function (use) {
                var symbolId = use.getAttribute('href');
                var symbol = sprite.querySelector(symbolId);
                if (symbol) {
                    sentenceContainer.appendChild(symbol.cloneNode(true));
                } else {
                    console.log('WARNING: symbol ' + symbolId + ' cannot be found.')
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
                    console.log('WARNING: symbol ' + symbolId + ' cannot be found.')
                }
            });
        }

        target.appendChild(sentenceContainer);

        return sentenceContainer;
    }

    function renderOptions(compoundOptions) {
        compoundOptions.forEach(function (option) {
            renderSentenceOption(option, document.getElementById('sitelen'),
                {scale: 1.2, exportable: true});
        });
    }

    return {
        renderLayoutOption: renderSentenceOption,
        renderComplexLayout: renderComplexLayout
    };
}();