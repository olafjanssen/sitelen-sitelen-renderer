"use strict";

var svgNS = "http://www.w3.org/2000/svg",
    xlinkns = "http://www.w3.org/1999/xlink";

var padding = 0;

function layoutContainer(units) {

    var options = [], hash = {}, minSurface = 1e6;

    function normalizeOption(option) {
        option = JSON.parse(option);

        var minSize = 1;
        option.state.units.forEach(function (glyph) {
            if (glyph.size[0] < minSize) {
                minSize = glyph.size[0];
            }
            if (glyph.size[1] < minSize) {
                minSize = glyph.size[1];
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

            // surface can't be 3 times larger than the optimum
            if (!hash[JSON.stringify(newOption)] && newOption.surface / minSurface < 3) {
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

function convertNounPhrase(tokens) {
    var smallModifiers = ['kon', 'lili', 'mute', 'sin'],
        narrowModifiers = ['wan', 'tu', 'anu', 'en', 'kin'],
        options;

    function getSizeOf(token) {
        if (smallModifiers.indexOf(token) > -1) {
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

    console.log(units);
    options = layoutContainer(units);

    //options.sort(function (a, b) {
    //    return a.surface - b.surface;
    //});
    //
    //options.forEach(function (option) {
    //    renderOption(option);
    //});

    return options;
}

function renderOption(option, target, position, sizeParent, sizeParent2) {
    var container = target;
    var padding = [0, 0];//[10 / option.ratio, 10];
    var contpad = padding;

    if (position) {
        container = document.createElementNS(svgNS, 'svg');
        container.style.overflow = 'visible';
        var wh = [sizeParent[0] * 100 / sizeParent2[0], sizeParent[1] * 100 / sizeParent2[1]];
        var box = [position[0] * 100 / sizeParent2[0],
            position[1] * 100 / sizeParent2[1],
            sizeParent[0] * 100 / sizeParent2[0],
            sizeParent[1] * 100 / sizeParent2[1]
        ];

        var scale = 1.1;
        var c = [box[0] + box[2] / 2, box[1] + box[3] / 2];
        var matrix = [scale, 0, 0, scale, c[0] - scale * c[0], c[1] - scale * c[1]];

        if (option.separator) {

            var use = document.createElementNS(svgNS, 'use');
            use.setAttribute('transform', 'matrix(' + matrix.join(',') + ')');
            use.setAttributeNS(xlinkns, 'href', '#tp-wg-' + option.separator + (option.ratio > 1.5 ? '-wide' : option.ratio < 0.667 ? '-tall' : ''));
            use.setAttribute('preserveAspectRatio', 'none');
            use.setAttribute('width', '' + box[2]);
            use.setAttribute('height', '' + box[3]);
            use.setAttribute('x', '' + box[0]);
            use.setAttribute('y', '' + box[1]);
            use.setAttribute('viewBox', [0, 0, 100, 100].join(' '));
            //target.appendChild(use);
            target.insertBefore(use, target.firstChild);
        }

        container.setAttribute('preserveAspectRatio', 'none');
        container.setAttribute('width', '' + box[2]);
        container.setAttribute('height', '' + box[3]);
        container.setAttribute('x', '' + box[0]);
        container.setAttribute('y', '' + box[1]);
        container.setAttribute('transform', 'matrix(' + matrix.join(',') + ')');
        var scale2 = option.separator?1.3:1;
        container.setAttribute('viewBox', [-(100 * scale2 - 100) / 2, -(100 * scale2 - 100) / 2, 100 * scale2, 100 * scale2].join(' '));
        //container.setAttribute('viewBox',[0, 0, 100, 100].join(' '));
        target.appendChild(container);

    }

    option.state.units.forEach(function (glyph) {
        if (glyph.unit.rule === 'word-glyph') {
            var padding = [0, 0];
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

var tokens = ['jan', 'tu', 'utala', 'mute', 'pona', 'wan', 'lili', 'wan'];
//var tokens = ['jan', 'utala', 'pona', 'mi', 'wan'];
//var tokens = ['jan', 'lili', 'pona'];
//tokens = 'kili suli pona mi'.split(' ');

function layoutCompound() {
    var sentence = [
        {part: 'subject', tokens: ['jan', 'utala', 'pona', 'mi']},
        {part: 'verbPhrase', sep: ['li'], tokens: ['wile', 'jo']}
        //{part: 'directObject', sep: ['e-wide'], tokens: ['tenpo', 'suwi', 'mute']}
        //{part: 'punctuation', token: '.'}
    ];
    var data = [
        ['jan', 'utala', 'pona'],
        ['wile', 'moku'],
        ['kili', 'suwi']
    ], hashMap = [], compoundOptions = [];

    sentence.forEach(function (part) {
        if (part.part === 'punctuation') {
            return;
        }
        var npOptions = convertNounPhrase(part.tokens);
        hashMap.push({sep: part.sep, options: npOptions});
    });

    function go(index, units) {
        hashMap[index].options.forEach(function (option) {
            var newIndex = index + 1,
                newUnits = units.slice(0);
            option.type = 'container';
            option.separator = hashMap[index].sep;
            newUnits.push(option);
            if (newIndex < hashMap.length) {
                go(newIndex, newUnits);
            } else {
                compoundOptions.push.apply(compoundOptions, layoutContainer(newUnits));
            }
        });
    }

    go(0, []);

    for (var i = 0; i < compoundOptions.length; i++) {
        var option = compoundOptions[i];
        var padding = [0, 0]; //[10 / option.ratio, 10];
        var sentenceContainer = document.createElementNS(svgNS, 'svg');
        sentenceContainer.style.display = 'block';
        sentenceContainer.setAttribute('xmlns', svgNS);
        sentenceContainer.setAttribute('xmlns:xlink', xlinkns);
        sentenceContainer.setAttribute('version', '1.1');
        sentenceContainer.setAttribute('preserveAspectRatio', 'none');

        var box = [0, 0,
            option.size[0] * 100,
            option.size[1] * 100
        ];

        var scale = 1.2;
        var c = [box[0] + box[2] / 2, box[1] + box[3] / 2];
        var matrix = [scale, 0, 0, scale, c[0] - scale * c[0], c[1] - scale * c[1]];
        sentenceContainer.setAttribute('viewBox', [-(100 * scale - 100) / 2, -(100 * scale - 100) / 2, 100 * scale, 100 * scale].join(' '));
        sentenceContainer.setAttribute('width', '' + box[2]);
        sentenceContainer.setAttribute('height', '' + box[3]);
        sentenceContainer.style.overflow = 'visible';
        renderOption(option, sentenceContainer);
        document.getElementById('sitelen').appendChild(sentenceContainer);
    }

}


setTimeout(function () {
    //convertNounPhrase(tokens);
    layoutCompound();
}, 100);


