"use strict";


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

function renderOption(option, target, position, sizeParent) {
    var container = document.createElement('div'),
        sizeMultiplier = 1;
    container.classList.add('toki-nounphrase');

    if (position) {
        container.style.left = position[0] + 'em';
        container.style.top = position[1] + 'em';
    }
    if (sizeParent) {
        console.log(sizeParent, option.size);
        sizeMultiplier = sizeParent[0] / option.size[0];
    }

    container.style.width = sizeMultiplier * option.size[0] + 'em';
    container.style.height = sizeMultiplier * option.size[1] + 'em';

    if (option.separator) {
        container.setAttribute('data-toki-container', option.separator);
    }

    sizeMultiplier = (option.separator ? 0.8 : 1);

    option.state.units.forEach(function (glyph) {
        if (glyph.unit.rule === 'word-glyph') {
            var element = document.createElement('div');
            element.style.width = glyph.size[0] * 100 / option.size[0] * sizeMultiplier + '%';
            element.style.height = glyph.size[1] * 100 / option.size[1] * sizeMultiplier + '%';
            element.style.left = (option.separator ? 10 : 0) + glyph.position[0] * 100 / option.size[0] * sizeMultiplier + '%';
            element.style.top = (option.separator ? 10 : 0) + glyph.position[1] * 100 / option.size[1] * sizeMultiplier + '%';
            element.setAttribute('data-toki-word', glyph.unit.token);
            container.appendChild(element);
        } else {
            renderOption(glyph.unit, container, glyph.position, glyph.size);
        }
    });
    target.appendChild(container);
}


var tokens = ['jan', 'tu', 'utala', 'mute', 'pona', 'wan', 'lili', 'wan'];
//var tokens = ['jan', 'utala', 'pona', 'mi', 'wan'];
//var tokens = ['jan', 'lili', 'pona'];
//tokens = 'kili suli pona mi'.split(' ');

function layoutCompound() {
    var sentence = [
        {part: 'subject', tokens: ['jan', 'utala', 'lili']},
        {part: 'verbPhrase', sep: ['li'], tokens: ['wile', 'jo']},
        {part: 'directObject', sep: ['e'], tokens: ['tenpo', 'suwi', 'mute']},
        {part: 'punctuation', token: '.'}
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

    //for (var i = 0; i < compoundOptions.length; i++) {
    var option = compoundOptions[1];

    var sentenceContainer = document.createElement('div');
    sentenceContainer.classList.add('toki-sentence');
    sentenceContainer.style.width = option.size[0] + 'em';
    sentenceContainer.style.height = option.size[1] + 'em';
    renderOption(option, sentenceContainer);
    document.getElementById('sitelen').appendChild(sentenceContainer);
    //}

}


setTimeout(function () {
    //convertNounPhrase(tokens);
    layoutCompound();
}, 500);


//function convertToInstructions(structuredSentence) {
//
//    var instructions = [],
//        size;
//
//    structuredSentence.forEach(function (part) {
//
//        switch (part.part) {
//            case 'subject':
//            case 'verbPhrase':
//            case 'directObject':
//                instructions.push.apply(instructions, convertNounPhrase(part));
//                break;
//            case 'punctuation':
//                instructions.push({rule: 'addPunctuation', glyph: part.token === '.' ? 'period' : '', size: 'wide'});
//                break;
//            default:
//                console.log('ERR: unknown part');
//                break;
//        }
//    });
//
//    // determine container sizes
//    for (var i = 0; i < instructions.length; i++) {
//        if (instructions[i].rule === 'openContainer') {
//            var closure = 0, regularGlyphs = 0, narrowGlyphs = 0;
//            for (var j = i; j < instructions.length; j++) {
//                switch (instructions[j].rule) {
//                    case 'openContainer':
//                        closure++;
//                        break;
//                    case 'closeContainer':
//                        closure--;
//                        if (closure === 0) {
//                            // round narrow glyphs
//                            var roundglyphs = Math.round(regularGlyphs + narrowGlyphs / 2);
//                            // add metadata to the container
//                            instructions[i].size = roundglyphs === 1 ? 'regular' :
//                                roundglyphs > 3 || (roundglyphs === 3 && narrowGlyphs === 1) ? 'double' : 'wide';
//                            instructions[i].children = roundglyphs;
//                            closure = -1;
//                        }
//                        break;
//                    case 'addGlyph':
//                        // narrow glyphs only count as half
//                        if (narrowModifiers.indexOf(instructions[j].glyph) > -1) {
//                            narrowGlyphs++;
//                        } else {
//                            regularGlyphs++;
//                        }
//                        break;
//                }
//                if (closure === -1) {
//                    break;
//                }
//            }
//        }
//    }
//    return instructions;
//}

