var svgNS = "http://www.w3.org/2000/svg",
    xlinkns = "http://www.w3.org/1999/xlink";

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
    "use strict";
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
 * @param position  the position of the current container
 * @param sizeParent    the size of the parent container
 * @param sizeParent2   the alternate size of the parent container
 */
function renderPartOption(option, target, position, sizeParent, sizeParent2) {
    "use strict";
    var container = target;

    if (position) {
        var box = [position[0] * 100 / sizeParent2[0],
            position[1] * 100 / sizeParent2[1],
            sizeParent[0] * 100 / sizeParent2[0],
            sizeParent[1] * 100 / sizeParent2[1]
        ];

        var scale = 1.1,
            center = [box[0] + box[2] / 2, box[1] + box[3] / 2],
            matrix = [scale, 0, 0, scale, center[0] - scale * center[0], center[1] - scale * center[1]];

        if (option.separator) {

            var use = createNewElement('use', {
                href: {
                    ns: xlinkns,
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

        var scale2 = option.separator ? 1.3 : 1;
        var container = createNewElement('svg', {
            transform: 'matrix(' + matrix.join(',') + ')',
            viewBox: [-(100 * scale2 - 100) / 2, -(100 * scale2 - 100) / 2, 100 * scale2, 100 * scale2].join(' '),
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
            var scale = 1.2,
                center = [box[0] + box[2] / 2, box[1] + box[3] / 2],
                matrix = [scale, 0, 0, scale, center[0] - scale * center[0], center[1] - scale * center[1]];

            var use = createNewElement('use', {
                href: {
                    ns: xlinkns,
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
            renderPartOption(glyph.unit, container, glyph.position, glyph.size, option.size);
        }
    });

}

/**
 * Render a sentence layout option into a target container.
 * @param option    the sentence layout option
 * @param target    the target DOM container
 */
function renderSentenceOption(option, target) {
    "use strict";

    var box = [0, 0,
            option.size[0] * 100,
            option.size[1] * 100
        ],
        scale = 1.2,
        sentenceContainer = createNewElement('svg',
            {
                xmlns: svgNS,
                'xmlns:xlink': xlinkns,
                version: 1.1,
                viewBox: [-(box[2] * scale - box[2]) / 2, -(box[3] * scale - box[3]) / 2, box[2] * scale, box[3] * scale].join(' ')
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

    renderPartOption(option, innerContainer);

    sentenceContainer.appendChild(innerContainer);
    target.appendChild(sentenceContainer);
}

function renderOptions(compoundOptions) {
    "use strict";

    compoundOptions.forEach(function (option) {
        renderSentenceOption(option, document.getElementById('sitelen'));
    });
}
