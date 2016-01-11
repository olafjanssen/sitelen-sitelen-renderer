"use strict";

var smallModifiers = ['kon', 'lili', 'mute', 'sin'],
    narrowModifiers = ['wan', 'tu', 'anu', 'en', 'kin'];

function getSizeOf(token) {
    if (smallModifiers.indexOf(token) > -1) {
        return [1, 0.5];
    } else if (narrowModifiers.indexOf(token) > -1) {
        return [0.5, 1];
    } else {
        return [1, 1];
    }
}

var options = [], hash = {}, minSurface = 1e6;

function go(units, state, iterator) {
    console.log(state, iterator);
    var newSize, newState, newForbidden, i, j;

    if (!state) {
        var singleSize = getSizeOf(units[0]);
        newState = {
            units: [{token: units[0], size: singleSize, position: [0, 0]}],
            size: singleSize,
            forbidden: [JSON.stringify(singleSize)]
        };

        for (j = 1; j < units.length; j++) {
            go(units, newState, {goesDown: false, index: 1, length: j});
            go(units, newState, {goesDown: true, index: 1, length: j});
        }
        return;
    }

    var goesDown = iterator.goesDown,
        index = iterator.index,
        length = iterator.length;

    newState = JSON.parse(JSON.stringify(state));
    newSize = newState.size;
    newForbidden = newState.forbidden;

    var prevSize = getSizeOf(units[index]),
        glyphPosition = [!goesDown ? state.size[0] : 0, goesDown ? state.size[1] : 0];

    var sizeSum = [0, 0], addSize;
    // determine size sum
    for (i = index; i < index + length; i++) {
        addSize = getSizeOf(units[i]);
        if ((goesDown && addSize[1] !== prevSize[1]) ||
            (!goesDown && addSize[0] !== prevSize[0])) {
            return;
        }
        sizeSum = [sizeSum[0] + addSize[0], sizeSum[1] + addSize[1]];
    }

    var actualAdded = 0;
    // now add the glyphs one by one
    for (i = index; i < index + length; i++) {
        var glyphSize = [], add = 0,
            addAxis = goesDown ? 1 : 0,
            fixedAxis = goesDown ? 0 : 1;

        addSize = getSizeOf(units[i]);

        add = addSize[addAxis] * state.size[fixedAxis] / sizeSum[fixedAxis];
        glyphSize[addAxis] = add;
        glyphSize[fixedAxis] = addSize[fixedAxis] * add / addSize[addAxis];

        if (i === index) {
            newSize[addAxis] += add;
        }
        if (goesDown && newForbidden.indexOf(JSON.stringify(glyphPosition)) > -1) {
            return;
        }

        prevSize = addSize;
        newState.units.push({token: units[i], size: glyphSize, position: glyphPosition});
        actualAdded++;

        // update glyph position
        glyphPosition = [glyphPosition[0] + (goesDown ? glyphSize[0] : 0),
            glyphPosition[1] + (!goesDown ? glyphSize[1] : 0)];

        newForbidden.push(JSON.stringify([glyphPosition[0] + (!goesDown ? glyphSize[0] : 0), glyphPosition[1] + (goesDown ? glyphSize[1] : 0)]));
    }

    if (index + actualAdded === units.length) {
        var newOption = {
            state: newState,
            size: newSize,
            ratio: newSize[0] / newSize[1],
            normedRatio: newSize[0] / newSize[1] < 1 ? newSize[0] / newSize[1] : newSize[1] / newSize[0],
            surface: newSize[0] * newSize[1]
        };
        console.log('ADD OPTION ', newOption);

        newOption = normalizeOption(JSON.stringify(newOption));

        minSurface = Math.min(minSurface, newOption.surface);

        // surface can't be 3 times larger than the optimum
        if (!hash[JSON.stringify(newOption)] && newOption.surface / minSurface < 3) {
            options.push(newOption);
            hash[JSON.stringify(newOption)] = newOption;
        }
        return;
    }

    for (j = 1; j < units.length - index; j++) {
        go(units, newState, {goesDown: false, index: index + actualAdded, length: j});
        go(units, newState, {goesDown: true, index: index + actualAdded, length: j});
    }
}


function convertNounPhrase(tokens) {
    go(tokens);

    options.sort(function (a, b) {
        return a.surface - b.surface;
    });

    options.forEach(function (option) {
        renderOption(option);
    });
}

function renderOption(option) {
    var container = document.createElement('div');
    container.classList.add('toki-nounphrase');
    container.style.width = option.size[0] + 'em';
    container.style.height = option.size[1] + 'em';

    option.state.units.forEach(function (glyph) {
        var element = document.createElement('div');
        element.style.width = glyph.size[0] + 'em';
        element.style.height = glyph.size[1] + 'em';
        element.style.left = glyph.position[0] + 'em';
        element.style.top = glyph.position[1] + 'em';
        element.setAttribute('data-toki-word', glyph.token);

        container.appendChild(element);
    });
    document.getElementById('sitelen').appendChild(container);
}

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

var tokens = ['jan', 'tu', 'utala', 'mute', 'pona', 'wan', 'lili', 'wan'];
//var tokens = ['jan', 'utala', 'pona', 'mi', 'wan'];
//var tokens = ['jan', 'lili', 'pona'];
//tokens = 'kili suli pona mi'.split(' ');

setTimeout(function () {
    convertNounPhrase(tokens);
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

