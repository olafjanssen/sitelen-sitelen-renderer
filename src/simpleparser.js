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

var options = [], hash = {};

function go(tokens, state, size, direction, index, length, forbidden) {
    var newSize, newState, newForbidden, i, j;

    if (!state) {
        newSize = getSizeOf(tokens[0]);
        newState = [{token: tokens[0], size: newSize, position: [0, 0]}];
        newForbidden = [];
        newForbidden.push(JSON.stringify(newSize));


        for (j = 1; j < tokens.length; j++) {
            go(tokens, newState, newSize, 'right', 1, j, newForbidden);
            go(tokens, newState, newSize, 'down', 1, j, newForbidden);
        }
        return;
    }

    newState = state.slice(0);
    newSize = size.slice(0);
    newForbidden = forbidden.slice(0);

    var prevSize = getSizeOf(tokens[index]),
        glyphPosition = [direction === 'right' ? size[0] : 0, direction === 'down' ? size[1] : 0];

    var sizeSum = [0, 0], addSize;
    // determine size sum
    for (var i = index; i < index + length; i++) {
        addSize = getSizeOf(tokens[i]);
        if ((direction === 'down' && addSize[1] !== prevSize[1]) ||
            (direction === 'right' && addSize[0] !== prevSize[0])) {
            return;
        }
        sizeSum = [sizeSum[0] + addSize[0], sizeSum[1] + addSize[1]];
    }

    var actualAdded = 0;
    // now add the glyphs one by one
    for (var i = index; i < index + length; i++) {
        var glyphSize = [], addX = 0, addY = 0;
        addSize = getSizeOf(tokens[i]);

        switch (direction) {
            case 'down':
                addY = addSize[1] * size[0] / sizeSum[0];
                glyphSize = [addSize[0] * addY / addSize[1], addY];

                newSize = [size[0], size[1] + addY];
                break;
            case 'right':
                addX = addSize[0] * size[1] / sizeSum[1];
                glyphSize = [addX, addSize[1] * addX / addSize[0]];

                newSize = [size[0] + addX, size[1]];
                break;
        }

        if (direction === 'down' && newForbidden.indexOf(JSON.stringify(glyphPosition)) > -1) {
            return;
        } else {
            prevSize = addSize;
            newState.push({token: tokens[i], size: glyphSize, position: glyphPosition});
            actualAdded++;

            // update glyphposition
            glyphPosition = [glyphPosition[0] + (direction === 'down' ? glyphSize[0] : 0),
                glyphPosition[1] + (direction === 'right' ? glyphSize[1] : 0)];

            newForbidden.push(JSON.stringify([glyphPosition[0] + glyphSize[0], glyphPosition[1] + glyphSize[1]]));
        }
    }

    if (index + actualAdded === tokens.length) {
        var newOption = {
            state: newState,
            size: newSize,
            ratio: newSize[0] / newSize[1],
            normedRatio: newSize[0] / newSize[1] < 1 ? newSize[0] / newSize[1] : newSize[1] / newSize[0],
            surface: newSize[0] * newSize[1]
        };
        newOption = normalizeOption(JSON.stringify(newOption));

        if (!hash[JSON.stringify(newOption)]) {
            options.push(newOption);
            hash[JSON.stringify(newOption)] = newOption;
        }
        return;
    }

    for (var j = 1; j < tokens.length - index; j++) {
        go(tokens, newState, newSize, 'right', index + actualAdded, j, newForbidden);
        go(tokens, newState, newSize, 'down', index + actualAdded, j, newForbidden);
    }
}


function convertNounPhrase(tokens) {
    go(tokens);

    options.sort(function (a, b) {
        return a.surface - b.surface;
        //return b.normedRatio - a.normedRatio;
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
    //container.style.fontSize = getNormalizerScale(option)/2 + 'em';

    option.state.forEach(function (glyph) {
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
    option.state.forEach(function (glyph) {
        if (glyph.size[0] < minSize) {
            minSize = glyph.size[0];
        }
        if (glyph.size[1] < minSize) {
            minSize = glyph.size[1];
        }
    });

    option.size = [option.size[0] / minSize, option.size[1] / minSize];
    option.surface /= minSize * minSize;
    option.state.forEach(function (glyph) {
        console.log(glyph);
        glyph.size[0] /= minSize;
        glyph.size[1] /= minSize;
        glyph.position[0] /= minSize;
        glyph.position[1] /= minSize;
    });

    return option;
}

var tokens = ['jan', 'utala', 'pona', 'wan', 'lili', 'wan'];
//var tokens = ['jan', 'utala', 'pona', 'mi', 'wan'];
//var tokens = ['jan', 'lili', 'pona'];
//tokens = 'kili suli pona wan mi'.split(' ');

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

