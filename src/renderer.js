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


function renderOption(option, target, position, sizeParent, sizeParent2) {
    "use strict";
    var container = target;

    if (position) {
        container = document.createElementNS(svgNS, 'svg');
        container.style.overflow = 'visible';
        var box = [position[0] * 100 / sizeParent2[0],
            position[1] * 100 / sizeParent2[1],
            sizeParent[0] * 100 / sizeParent2[0],
            sizeParent[1] * 100 / sizeParent2[1]
        ];

        var scale = 1.1;
        var c = [box[0] + box[2] / 2, box[1] + box[3] / 2];
        var matrix = [scale, 0, 0, scale, c[0] - scale * c[0], c[1] - scale * c[1]];

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

        container.setAttribute('preserveAspectRatio', 'none');
        container.setAttribute('width', '' + box[2]);
        container.setAttribute('height', '' + box[3]);
        container.setAttribute('x', '' + box[0]);
        container.setAttribute('y', '' + box[1]);
        container.setAttribute('transform', 'matrix(' + matrix.join(',') + ')');
        var scale2 = option.separator ? 1.3 : 1;
        container.setAttribute('viewBox', [-(100 * scale2 - 100) / 2, -(100 * scale2 - 100) / 2, 100 * scale2, 100 * scale2].join(' '));
        //container.setAttribute('viewBox',[0, 0, 100, 100].join(' '));
        target.appendChild(container);

    }

    option.state.units.forEach(function (glyph) {
        if (glyph.unit.rule === 'word-glyph') {
            var use = document.createElementNS(svgNS, 'use');
            var box = [(glyph.position[0] * 100 / option.size[0]),
                (glyph.position[1] * 100 / option.size[1]),
                (glyph.size[0] * 100 / option.size[0]),
                (glyph.size[1] * 100 / option.size[1])
            ];

            use.setAttributeNS(xlinkns, 'href', '#tp-wg-' + glyph.unit.token);
            use.setAttribute('width', '' + box[2]);
            use.setAttribute('height', '' + box[3]);
            use.setAttribute('x', '' + box[0]);
            use.setAttribute('y', '' + box[1]);

            var scale = 1.2;
            var c = [box[0] + box[2] / 2, box[1] + box[3] / 2];
            var matrix = [scale, 0, 0, scale, c[0] - scale * c[0], c[1] - scale * c[1]];

            use.setAttribute('transform', 'matrix(' + matrix.join(',') + ')');
            container.appendChild(use);
        } else {
            renderOption(glyph.unit, container, glyph.position, glyph.size, option.size);
        }
    });

}

function renderOptions(compoundOptions){
    "use strict";

    for (var i = 0; i < compoundOptions.length; i++) {
        var option = compoundOptions[i];

        var sentenceContainer = createNewElement('svg',
            {
                xmlns: svgNS,
                'xmlns:xlink': xlinkns,
                version: 1.1
            }, {
                display: 'block'
            }, svgNS);

        var box = [0, 0,
            option.size[0] * 100,
            option.size[1] * 100
        ];

        var scale = 1.2;
        sentenceContainer.setAttribute('viewBox', [-(box[2] * scale - box[2]) / 2, -(box[3] * scale - box[3]) / 2, box[2] * scale, box[3] * scale].join(' '));

        var innerContainer = createNewElement('svg',
            {
                width: box[2],
                height: box[3],
                viewBox: [0, 0, 100, 100].join(' '),
                preserveAspectRatio: 'none'
            }, {
                overflow: 'visible'
            }, svgNS);

        renderOption(option, innerContainer);

        sentenceContainer.appendChild(innerContainer);
        document.getElementById('sitelen').appendChild(sentenceContainer);
    }
}