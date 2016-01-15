var sitelenRenderer = function () {
    "use strict";

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
            glyphScale = settings.scale,
            containerScale = option.separator ? settings.scale * 1.1 : 1;

        if (position) {
            var box = [position[0] * 100 / sizeParentNormed[0],
                    position[1] * 100 / sizeParentNormed[1],
                    sizeParent[0] * 100 / sizeParentNormed[0],
                    sizeParent[1] * 100 / sizeParentNormed[1]
                ],
                center = [box[0] + box[2] / 2, box[1] + box[3] / 2],
                matrix = [scale, 0, 0, scale, center[0] - scale * center[0], center[1] - scale * center[1]];

            if (option.separator) {
                var use = createNewElement('use', {
                    href: {
                        ns: xlinkNS,
                        value: '#tp-wg-' + option.separator + (option.ratio > 1.5 ? '-wide' : option.ratio < 0.667 ? '-tall' : '')
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

            container = createNewElement('svg', {
                transform: 'matrix(' + matrix.join(',') + ')',
                viewBox: [-(100 * containerScale - 100) / 2, -(100 * containerScale - 100) / 2, 100 * containerScale, 100 * containerScale].join(' '),
                preserveAspectRatio: 'none',
                height: box[3],
                width: box[2],
                x: box[0],
                y: box[1]
            }, {
                overflow: 'visible'
            }, svgNS);

            target.appendChild(container);
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

                container.appendChild(use);
            } else {
                renderPartOption(glyph.unit, container, settings, glyph.position, glyph.size, option.size);
            }
        });

    }

    /**
     * Render a sentence layout option into a target container.
     * @param option    the sentence layout option
     * @param target    the target DOM container
     * @param settings  rendering settings
     */
    function renderSentenceOption(option, target, settings) {
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
        target.appendChild(sentenceContainer);
    }

    function renderOptions(compoundOptions) {
        compoundOptions.forEach(function (option) {
            renderSentenceOption(option, document.getElementById('sitelen'),
                {scale: 1.2});
        });
    }

    return {
        renderLayoutOption: renderSentenceOption
    };
}();