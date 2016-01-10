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

var options = [];

function go(tokens, state, size, direction, index, length) {
    var newState = state.slice(0),
        newSize = size.slice(0);

    var prevSize = getSizeOf(tokens[index]),
        glyphPosition = [direction === 'right' ? size[0] : 0, direction === 'down' ? size[1] : 0];

    for (var i = index; i < index + length; i++) {
        var addSize = getSizeOf(tokens[i]),
            glyphSize = [];
        switch (direction) {
            case 'right':
                // check if all have the same height
                if (addSize[1] !== prevSize[1]) {
                    // if not skip this option
                    return;
                }
                glyphSize = [addSize[0] / addSize[1] * size[1], newSize[1]];
                newSize[0] += glyphSize[0];
                break;
            case 'down':
                // check if all have the same width
                if (addSize[0] !== prevSize[0]) {
                    // if not skip this option
                    return;
                }
                glyphSize = [newSize[0], addSize[1] / addSize[0] * size[0]];
                newSize[1] += addSize[1] / addSize[0] * size[0];
                break;
        }
        prevSize = addSize;
        newState.push({token: tokens[i], direction: direction, size: glyphSize, position: glyphPosition});

        // update glyphposition
        glyphPosition = [glyphPosition[0] + (direction === 'right' ? glyphSize[0] : 0),
            glyphPosition[1] + (direction === 'down' ? glyphSize[1] : 0)];
    }

    if (index + length === tokens.length) {
        options.push({
            state: newState,
            size: newSize,
            ratio: newSize[0] / newSize[1],
            normedRatio: newSize[0] / newSize[1] < 1 ? newSize[0] / newSize[1] : newSize[1] / newSize[0],
            surface: newSize[0] * newSize[1]
        });
        return;
    }

    for (var j = 1; j < tokens.length - index; j++) {
        go(tokens, newState, newSize, 'right', index + length, j);
        go(tokens, newState, newSize, 'down', index + length, j);
    }
}


function convertNounPhrase(tokens) {
    // choose both to go right and down
    go(tokens, [{token: tokens[0], size: [1, 1], position: [0, 0]}], [1, 1], 'right', 1, 1);
    go(tokens, [{token: tokens[0], size: [1, 1], position: [0, 0]}], [1, 1], 'down', 1, 1);

    options.sort(function (a, b) {
        return a.surface - b.surface;
        //return b.ratio - a.ratio;
    });

    console.log(options);
    options.forEach(function (option) {
        renderOption(option);
    });

}

function renderOption(option) {
    var container = document.createElement('div');
    container.classList.add('toki-nounphrase');
    container.style.width = option.size[0] + 'em';
    container.style.height = option.size[1] + 'em';

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

var tokens = ['jan', 'utala', 'pona', 'wan', 'lili', 'wan'];

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

