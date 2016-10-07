/**
 * Core renderer of sitelen sitelen, expects input that is parsed and turned into a layout.
 *
 * @type {{renderLayoutOption, renderComplexLayout, renderAllOptions}}
 */
var sitelenCoreRenderer = function () {
    'use strict';

    var sprite;
    // load the rendering set
    var xhr = new XMLHttpRequest();
    xhr.open('get', '../../images/sprite.css.svg', false);
    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) {
            return;
        }
        var svg = xhr.responseXML.documentElement;
        sprite = svg;

        // include in document for efficient rendering of non-exportable sitelen
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
     * Get custom scaling and transforming of special glyphs, as compared to word glyphs.
     *
     * @param option    the layout option to consider
     * @param baseScale the base scale of the container
     * @returns {number[]}  an array of non-uniform scale factors
     */
    function getSeparatorScale(option, baseScale) {
        var scale = [baseScale * (option.ratio < 0.667 ? 1.2 : 0.92),
            baseScale * (option.ratio < 0.667 ? 0.9 : 0.92), 0, 0];

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
        if (option.ratio > 1.5 && option.separator === 'pi') {
            scale[1] = baseScale * 1.5;
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
                    viewBox: [-(box[2] * settings.scale - box[2]) / 2,
                        -(box[3] * settings.scaleSkew - box[3]) / 2,
                        box[2] * settings.scaleSkew,
                        box[3] * settings.scaleSkew].join(' ')
                }, {}, svgNS);

        sentenceContainer.setAttribute('data-sitelen-sentence', null);

        var styling = document.createElement('style');
        styling.innerHTML = 'ellipse,polygon,polyline,rect,circle,line,path{stroke-width:2;stroke:black;vector-effect:non-scaling-stroke} .filler{stroke:none;}';

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
        renderLayoutOption: renderSentenceOption,
        renderComplexLayout: renderComplexLayout,
        renderAllOptions: renderOptions
    };
}();
/*global
 sitelenCoreRenderer
 */

/**
 * Produces all the different layout options for a given structured sentence.
 *
 * @type {{layoutCompound}}
 */
var sitelenLayout = function () {
    'use strict';

    /**
     * Obtain the layout of an entire container and its children.
     *
     * @param units the units to layout, can be glyphs, syllables or containers
     * @returns {Array} a laid out container
     */
    function layoutContainer(units) {
        var options = [], hash = {}, minSurface = 1e6;

        function normalizeOption(option) {
            option = JSON.parse(option);

            var minSize = 1;
            option.state.units.forEach(function (glyph) {
                if (glyph.size[0] < minSize) {
                    minSize = Math.max(glyph.size[0], glyph.size[1]);
                }
            });

            option.size = [option.size[0] / minSize, option.size[1] / minSize];
            option.surface /= minSize * minSize;
            option.state.units.forEach(function (glyph) {
                glyph.size[0] /= minSize;
                glyph.size[1] /= minSize;
                glyph.position[0] /= minSize;
                glyph.position[1] /= minSize;
            });

            return option;
        }

        function go(units, state, iterator) {
            var newSize, newState, newForbidden, i, j,
                goesDown, index, length,
                prevSize, unitPosition, newOption;

            // place the first unit directly
            if (!state) {
                var singleSize = units[0].size;
                newState = {
                    units: [{unit: units[0], size: singleSize, position: [0, 0]}],
                    size: singleSize,
                    forbidden: [JSON.stringify(singleSize)]
                };

                if (units.length === 1) {
                    newOption = {
                        type: 'container',
                        state: newState,
                        size: singleSize,
                        ratio: singleSize[0] / singleSize[1],
                        normedRatio: singleSize[0] / singleSize[1] < 1 ? singleSize[0] / singleSize[1] : singleSize[1] / singleSize[0],
                        surface: singleSize[0] * singleSize[1]
                    };
                    options.push(newOption);
                    hash[JSON.stringify(newOption)] = newOption;
                    return;
                }
                for (j = 1; j < units.length; j++) {
                    go(units, newState, {goesDown: false, index: 1, length: j});
                    go(units, newState, {goesDown: true, index: 1, length: j});
                }
                return;
            }

            // set up aliases, start parameters and clone the state
            goesDown = iterator.goesDown;
            index = iterator.index;
            length = iterator.length;
            newState = JSON.parse(JSON.stringify(state));
            newSize = newState.size;
            newForbidden = newState.forbidden;
            prevSize = units[index].size;
            unitPosition = [!goesDown ? state.size[0] : 0, goesDown ? state.size[1] : 0];

            // determine size sum and check if all following glyphs are compatible
            var sizeSum = [0, 0], addSize;
            for (i = index; i < index + length; i++) {
                addSize = units[i].size;
                if ((goesDown && addSize[1] !== prevSize[1]) ||
                    (!goesDown && addSize[0] !== prevSize[0])) {
                    return;
                }
                sizeSum = [sizeSum[0] + addSize[0], sizeSum[1] + addSize[1]];
            }

            // now add the units one by one
            for (i = index; i < index + length; i++) {
                var glyphSize = [], add = 0,
                    addAxis = goesDown ? 1 : 0,
                    fixedAxis = goesDown ? 0 : 1;

                addSize = units[i].size;

                add = addSize[addAxis] * state.size[fixedAxis] / sizeSum[fixedAxis];
                glyphSize[addAxis] = add;
                glyphSize[fixedAxis] = addSize[fixedAxis] * add / addSize[addAxis];

                if (i === index) {
                    newSize[addAxis] += add;
                }
                if (goesDown && newForbidden.indexOf(JSON.stringify(unitPosition)) > -1) {
                    return;
                }

                prevSize = addSize;
                newState.units.push({unit: units[i], size: glyphSize, position: unitPosition});

                // update glyph position to slot for next glyph
                unitPosition = [unitPosition[0] + (goesDown ? glyphSize[0] : 0),
                    unitPosition[1] + (!goesDown ? glyphSize[1] : 0)];

                // forbid next glyphs to start at the lower-right corner of a previous glyph (this breaks the reading flow rules
                newForbidden.push(JSON.stringify([unitPosition[0] + (!goesDown ? glyphSize[0] : 0),
                    unitPosition[1] + (goesDown ? glyphSize[1] : 0)]));
            }

            // if all units are used up we can stop and add the final result
            if (index + length === units.length) {
                newOption = {
                    type: 'container',
                    state: newState,
                    size: newSize,
                    ratio: newSize[0] / newSize[1],
                    normedRatio: newSize[0] / newSize[1] < 1 ? newSize[0] / newSize[1] : newSize[1] / newSize[0],
                    surface: newSize[0] * newSize[1]
                };

                newOption = normalizeOption(JSON.stringify(newOption));

                minSurface = Math.min(minSurface, newOption.surface);

                // surface can't be 2 times larger than the optimum
                if (!hash[JSON.stringify(newOption)] && newOption.surface / minSurface < 2) {
                    options.push(newOption);
                    hash[JSON.stringify(newOption)] = newOption;
                }
                return;
            }

            for (j = 1; j < units.length - (index + length) + 1; j++) {
                go(units, newState, {goesDown: false, index: index + length, length: j});
                go(units, newState, {goesDown: true, index: index + length, length: j});
            }
        }

        go(units);
        return options;
    }

    /**
     * Obtain the layout of the glyphs in a single container.
     *
     * @param tokens    the tokens in a container
     * @returns {Array|*}   the laid out container
     */
    function convertNounPhrase(tokens) {
        var smallModifiers = ['kon', 'lili', 'mute', 'sin'],
            narrowModifiers = ['wan', 'tu', 'anu', 'en', 'kin'],
            punctuation = ['period', 'exclamation', 'question'],
            singlePunctuation = ['comma', 'colon'],
            largePunctuation = ['la', 'banner'],
            options;

        function getSizeOf(token) {
            if (singlePunctuation.indexOf(token) > -1) {
                return [4, 0.5];
            } else if (punctuation.indexOf(token) > -1) {
                return [4, 0.75];
            } else if (largePunctuation.indexOf(token) > -1) {
                return [4, 1];
            } else if (smallModifiers.indexOf(token) > -1) {
                return [1, 0.5];
            } else if (narrowModifiers.indexOf(token) > -1) {
                return [0.5, 1];
            } else {
                return [1, 1];
            }
        }

        var units = [];
        tokens.forEach(function (token) {
            units.push({rule: 'word-glyph', token: token, size: getSizeOf(token)});
        });

        options = layoutContainer(units);

        return options;
    }

    /**
     * Obtain the layout of the syllables in a cartouche.
     *
     * @param tokens    the tokens in a cartouche
     * @returns {Array|*}   the laid out cartouche syllables
     */
    function convertCartouche(tokens) {
        var narrowSyls = ['li', 'ni', 'si', 'lin', 'nin', 'sin', 'le', 'ne', 'se', 'len', 'nen', 'sen', 'lo', 'no', 'so', 'lon', 'non', 'son', 'la', 'na', 'sa', 'lan', 'nan', 'san', 'lu', 'nu', 'su', 'lun', 'nun', 'sun'],
            options;

        function getSizeOf(token) {
            if (narrowSyls.indexOf(token) > -1) {
                return [0.5, 1];
            } else {
                return [1, 1];
            }
        }

        var units = [];
        tokens.forEach(function (token) {
            units.push({rule: 'syl-glyph', token: token, size: getSizeOf(token)});
        });

        options = layoutContainer(units);

        return options;
    }

    /**
     * Obtain the layout of a complex compound sentence.
     *
     * @param sentence  the compounds of a sentence
     * @returns {Array} the full layout
     */
    function layoutCompound(sentence) {
        var hashMap = [], compoundOptions = [];

        sentence.forEach(function (part) {
            var npOptions = [];
            if (part.parts) {
                npOptions = layoutCompound(part.parts);
            } else if (part.sep === 'cartouche') {
                npOptions = convertCartouche(part.tokens);
            } else {
                npOptions = convertNounPhrase(part.tokens);
            }

            hashMap.push({part: part.part, sep: part.sep, options: npOptions});
        });

        function go(index, units) {
            hashMap[index].options.forEach(function (option) {
                var newIndex = index + 1,
                    newUnits = units.slice(0);

                option.type = hashMap[index].part === 'punctuation' ? 'punctuation' : 'container';
                option.separator = hashMap[index].sep;
                newUnits.push(option);
                if (newIndex < hashMap.length) {
                    go(newIndex, newUnits);
                } else {
                    compoundOptions.push.apply(compoundOptions, layoutContainer(newUnits));
                }
            });
        }

        if (hashMap.length > 0) {
            go(0, []);
        } else {
            console.log('WARNING: empty text to layout');
        }
        return compoundOptions;
    }

    return {
        layoutCompound: layoutCompound
    };
}();

/**
 * User friendly wrapper for rendering sitelen sitelen.
 *
 * @type {{renderCompoundSentence, renderInteractiveSentence}}
 */
var sitelenRenderer = function () {
    'use strict';

    /**
     * Render a single static sentence.
     *
     * @param sentence  the structured sentence
     * @param target    the element to render in
     * @param settings  the settings object
     * @returns {Element}   the rendered element
     */
    function renderCompoundSentence(sentence, target, settings) {
        if (!settings) {
            settings = {};
        }
        if (!settings.exportable) {
            settings.exportable = true;
        }
        if (!settings.optimalRatio) {
            settings.optimalRatio = 0.75;
        }
        if (!settings.minRatio) {
            settings.minRatio = 0;
        }
        if (!settings.maxRatio) {
            settings.maxRatio = 100;
        }
        if (!settings.ignoreHeight) {
            settings.ignoreHeight = false;
        }
        if (!settings.random) {
            settings.random = false;
        }
        var compounds = [];

        // create sentence parts
        var sentenceCompound = [];
        sentence.forEach(function (part) {
            sentenceCompound.push(part);
            if (part.part === 'punctuation') {
                compounds.push(sentenceCompound);
                sentenceCompound = [];
            }
        });
        if (sentenceCompound.length > 0) {
            compounds.push(sentenceCompound);
        }

        var bestOptions = [];

        var sorter = function (optimal) {
            return function (a, b) {
                return Math.abs(optimal - a.ratio) - Math.abs(optimal - b.ratio);
            };
        };

        compounds.forEach(function (compound) {
            var compoundOptions = sitelenLayout.layoutCompound(compound);
            compoundOptions = compoundOptions.filter(function (option) {
                return option.ratio > settings.minRatio && option.ratio < settings.maxRatio;
            });
            compoundOptions.sort(sorter(settings.optimalRatio));
            bestOptions.push(compoundOptions[settings.random ? Math.floor(Math.random() * compoundOptions.length) : 0]);
        });

        return sitelenCoreRenderer.renderComplexLayout(bestOptions, target, settings);
    }

    /**
     * Render a single interactive structured sentence.
     * @param sentence  the structured sentence
     * @returns {Element}   the rendered element
     */
    function renderInteractiveSentence(sentence) {
        var compound = document.createElement('div');

        document.getElementById('sitelen').appendChild(compound);

        var options = sitelenLayout.layoutCompound(sentence);
        options.sort(function (a, b) {
            return a.ratio - b.ratio;
        });

        var initialOption = [0, 100];
        options.forEach(function (option, index) {
            var dif = Math.abs(option.ratio - 0.8);
            if (dif < initialOption[1]) {
                initialOption = [index, dif];
            }
        });

        var slider = document.createElement('input');
        slider.setAttribute('type', 'range');
        slider.setAttribute('min', 0);
        slider.setAttribute('max', options.length - 1);
        slider.setAttribute('step', 1);
        slider.setAttribute('value', initialOption[0]);

        slider.addEventListener('input', function (event) {
            var optimal = options[slider.value].ratio;
            render(optimal);
        });
        compound.appendChild(slider);

        var pom = document.createElement('a');
        pom.innerHTML = 'download as SVG';
        compound.appendChild(pom);

        render(0.8);

        function render(optimal) {
            var tokens = [];

            sentence.forEach(function (part) {
                if (part.tokens) {
                    part.tokens.forEach(function (token) {
                        tokens.push(token);
                    });
                }
            });

            var filename = tokens.join('-') + '.svg';

            var previousRender = compound.querySelector('svg');
            if (previousRender) {
                compound.removeChild(previousRender);
            }
            renderCompoundSentence(sentence, compound, {optimalRatio: optimal});

            var text = '<?xml version="1.0" encoding="utf-8"?>\n' + compound.querySelector('svg').innerHTML;
            pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            pom.setAttribute('download', filename);
        }

        return compound;
    }

    function init(){
        [].slice.call(document.querySelectorAll('[data-sitelen]')).forEach(function (element) {
            var text = element.textContent,
                structuredSentences = sitelenParser.parse(text);

            element.innerHTML = '';

            var ratio = element.getAttribute('data-sitelen-ratio');

            structuredSentences.forEach(function (structuredSentence, index) {
                renderCompoundSentence(structuredSentence, element, {optimalRatio: ratio ? ratio : 0.8});
            });
        });
    }

    window.onload = function () {
        init();
    };

    return {
        renderCompoundSentence: renderCompoundSentence,
        renderInteractiveSentence: renderInteractiveSentence
    };
}();
/**
 * Parsing toki pona texts into sentences and sentence parts, and then into structured sentences that reflect the
 * structure of sitelen sitelen blocks.
 *
 * @type {{parse}}
 */
var sitelenParser = function () {
    'use strict';

    /**
     * Core parser into sitelen sitelen structure.
     * @param parseable a sentence to parse
     * @returns {*[]} a structured sentence array
     */
    function getSimpleStructuredSentence(parseable) {
        var tokens = parseable.split(' '),
            prepositions = ['tawa', 'lon', 'kepeken'],
            objectMarker = ['li', 'e'],
            part = {part: 'subject', tokens: []},
            sentence = [part];

        tokens.forEach(function (token, index) {
            if (objectMarker.indexOf(token) > -1 &&
                index < tokens.length - 1) {
                sentence.push({part: 'objectMarker', sep: token, tokens: []});
                part = sentence[sentence.length - 1];
                return;
            } else if (prepositions.indexOf(token) > -1 && objectMarker.indexOf(tokens[index - 1]) === -1 &&
                index < tokens.length - 1 && objectMarker.indexOf(tokens[index + 1]) === -1) {
                sentence.push({part: 'prepPhrase', sep: token, tokens: []});
                part = sentence[sentence.length - 1];
                return;
            } else if (token === 'o' && part.tokens.length > 0) {
                // the o token should be in a container when it is used to address something, not in commands
                part.sep = 'o';
                return;
            } else if (token === 'a' && part.tokens.length > 0 && part.sep) {
                // the a token should never be in a container
                sentence.push({part: 'interjection', sep: null, tokens: [token]});
                part = sentence[sentence.length - 1];
                return;
            }

            part.tokens.push(token);
        });

        // filter out empty parts
        sentence = sentence.filter(function (part) {
            return part.tokens.length > 0;
        });
        return sentence;

    }

    /**
     * Preformats a given text, so that it splits it on punctuation marks.
     * @param text  text to preformat
     * @returns {{parsable: Array, raw: Array}} parsable array of raw text and punctuation
     */
    function preformat(text) {
        var result = text.match(/[^\.!\?#]+[\.!\?#]+/g);

        var parsableParts = [], rawParts = [];
        if (!result) { // allow sentence fractions without any punctuation
            result = [text + '|'];
            console.log('WARNING: sentence fraction without punctuation');
        }
        result.forEach(function (sentence) {
            sentence = sentence.trim();

            var parsableSentence = [];
            parsableParts.push(parsableSentence);
            rawParts.push(sentence);

            var body = sentence.substr(0, sentence.length - 1);

            // remove the comma before the la-clause and before a repeating li clause
            body = body.replace(', la ', ' la ');
            body = body.replace(', li ', ' li ');

            // split on context separators comma and colon
            var laparts = body.split(/ la /);
            laparts.forEach(function (lapart, index) {
                var colonparts = lapart.split(/:/);
                colonparts.forEach(function (colonpart, index) {
                    var commaparts = colonpart.split(/,/);
                    commaparts.forEach(function (commapart, index) {
                        commapart = commapart.trim();

                        parsableSentence.push({content: commapart});
                        if (index < commaparts.length - 1) {
                            parsableSentence.push({punctuation: ['comma']});
                        }
                    });

                    if (index < colonparts.length - 1) {
                        parsableSentence.push({punctuation: ['colon']});
                    }
                });
                if (laparts.length === 2 && index === 0) {
                    parsableSentence.push({punctuation: ['la']});
                }
            });

            var terminator = sentence.substr(-1);
            switch (terminator) {
                case '.':
                    parsableSentence.push({punctuation: ['period']});
                    break;
                case ':':
                    parsableSentence.push({punctuation: ['colon']});
                    break;
                case '!':
                    parsableSentence.push({punctuation: ['exclamation']});
                    break;
                case '?':
                    parsableSentence.push({punctuation: ['question']});
                    break;
                case '#':
                    parsableSentence.push({punctuation: ['banner']});
                    break;
                default:
                    break;
            }

        });
        return {parsable: parsableParts, raw: rawParts};
    }

    /**
     * Split proper names into Toki Pona syllables. It is assumed that the proper name follows standard Toki Pona rules.
     * @param properName the proper name string to split into syllables
     */
    function splitProperIntoSyllables(properName) {
        if (properName.length === 0) {
            return [];
        }

        var vowels = ['o', 'u', 'i', 'a', 'e'],
            syllables = [],
            first = properName.substr(0, 1),
            third = properName.substr(2, 1),
            fourth = properName.substr(3, 1);

        // ponoman, monsi, akesi

        if (vowels.indexOf(first) === -1) {
            if (third === 'n' && vowels.indexOf(fourth) === -1) {
                syllables.push(properName.substr(0, 3));
                syllables = syllables.concat(splitProperIntoSyllables(properName.substr(3)));
            } else {
                syllables.push(properName.substr(0, 2));
                syllables = syllables.concat(splitProperIntoSyllables(properName.substr(2)));
            }
        } else {
            if (properName.length === 2) {
                return [properName];
            } else {
                syllables.push(first);
                syllables = syllables.concat(splitProperIntoSyllables(properName.substr(1)));
            }
        }

        return syllables;
    }

    /**
     * Postprocessing for the simple parses that splits the structured sentence into more structure, such as prepositional
     * phrases, proper names and the pi-construct.
     *
     * @param sentence  the structured sentence
     * @returns {*} a processed structured sentence
     */
    function postprocessing(sentence) {
        var prepositionContainers = ['lon', 'tan', 'kepeken', 'tawa', 'pi'],
            prepositionSplitIndex,
            nameSplitIndex;

        // split prepositional phrases inside containers (such as the verb li-container)
        sentence.forEach(function (part, index) {
            prepositionSplitIndex = -1;

            part.tokens.forEach(function (token, tokenIndex) {
                if (prepositionContainers.indexOf(token) > -1 && tokenIndex < part.tokens.length - 1) {
                    prepositionSplitIndex = tokenIndex;
                }
            });

            if (prepositionSplitIndex > -1) {
                var newParts = [];
                if (prepositionSplitIndex > 0) {
                    newParts.push({part: part.part, tokens: part.tokens.slice(0, prepositionSplitIndex)});
                }
                newParts.push({
                    part: part.part,
                    sep: part.tokens[prepositionSplitIndex],
                    tokens: part.tokens.slice(prepositionSplitIndex + 1)
                });
                sentence[index] = {part: part.part, sep: part.sep, parts: newParts};
            }
        });

        // split proper names inside containers
        sentence.forEach(function (part, index) {
            nameSplitIndex = -1;
            if (!part.tokens) {
                return;
            }
            part.tokens.forEach(function (token, tokenIndex) {
                if (token.substr(0, 1).toUpperCase() === token.substr(0, 1)) {
                    nameSplitIndex = tokenIndex;
                }
            });

            if (nameSplitIndex > -1) {
                var newParts = [];
                if (nameSplitIndex > 0) {
                    newParts.push({part: part.part, tokens: part.tokens.slice(0, nameSplitIndex)});
                }
                newParts.push({
                    part: part.part,
                    sep: 'cartouche',
                    tokens: splitProperIntoSyllables(part.tokens[nameSplitIndex].toLowerCase())
                });
                if (nameSplitIndex < part.tokens.length - 1) {
                    newParts.push({part: part.part, tokens: part.tokens.slice(nameSplitIndex + 1)});
                }
                sentence[index] = {part: part.part, sep: part.sep, parts: newParts};
            }
        });
        return sentence;
    }

    /**
     * Main parser that processes a sentence.
     *
     * @param sentence  the input sentence
     * @returns {Array} the structured sentence
     */
    function parseSentence(sentence) {
        var structuredSentence = [];

        sentence.forEach(function (part) {
            if (part.content) {
                // find proper names
                var properNames = [];
                part.content = part.content.replace(/([A-Z][\w-]*)/g, function (item) {
                    properNames.push(item);
                    return '\'Name\'';
                });

                var value = getSimpleStructuredSentence(part.content);

                value.forEach(function (part) {
                    part.tokens.forEach(function (token, index) {
                        if (token === '\'Name\'') {
                            part.tokens[index] = properNames.shift();
                        }
                    });
                });
                structuredSentence.push.apply(structuredSentence, value);
            } else if (part.punctuation) {
                structuredSentence.push({part: 'punctuation', tokens: part.punctuation});
            }
        });

        structuredSentence = postprocessing(structuredSentence);
        return structuredSentence;
    }

    /**
     * Parser wrapper that splits a text into sentences that are parsed.
     * @param text  a full text
     * @returns {Array} an array of structured sentences
     */
    function parse(text) {
        return preformat(text.replace(/\s\s+/g, ' ')).parsable.map(function (sentence) {
            return parseSentence(sentence);
        });
    }

    return {
        parse: parse
    };
}();




