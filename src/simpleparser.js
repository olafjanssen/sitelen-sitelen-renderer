'use strict';

var smallModifiers = ['kon', 'lili', 'mute', 'sin']

function convertNounPhrase(part) {
    var instructions = [];
    instructions.push({rule: 'openContainer', glyph: part.sep});
    part.tokens.forEach(function (token) {
        if (smallModifiers.indexOf(token) >= 0) {
            instructions[instructions.length - 1].modifier = token;
        } else {
            instructions.push({rule: 'addGlyph', glyph: token});
        }
    });
    instructions.push({rule: 'closeContainer'});

    return instructions;
}

function convertToInstructions(structuredSentence) {

    var instructions = [],
        size;

    structuredSentence.forEach(function (part) {

        switch (part.part) {
            case 'subject':
            case 'verbPhrase':
            case 'directObject':
                instructions.push.apply(instructions, convertNounPhrase(part));
                break;
            case 'punctuation':
                instructions.push({rule: 'addPunctuation', glyph: part.token === '.' ? 'period' : '', size: 'wide'});
                break;
            default:
                console.log('ERR: unknown part');
                break;
        }
    });

    console.log(instructions);
    // determine container sizes
    for (var i = 0; i < instructions.length; i++) {
        if (instructions[i].rule === 'openContainer') {
            var closure = 0, glyphs = 0;
            for (var j = i; j < instructions.length; j++) {
                switch (instructions[j].rule) {
                    case 'openContainer':
                        closure++;
                        break;
                    case 'closeContainer':
                        closure--;
                        if (closure === 0) {
                            instructions[i].size = glyphs === 1 ? 'regular' : glyphs > 3 ? 'double' : 'wide';
                            instructions[i].children = glyphs;
                            closure = -1;
                        }
                        break;
                    case 'addGlyph':
                        glyphs++;
                        break;
                }
                if (closure === -1) {
                    break;
                }
            }
        }
    }
    return instructions;
}
