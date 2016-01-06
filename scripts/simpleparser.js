'use strict';

function convertToInstructions(structuredSentence) {
    var instructions = [],
        size;

    structuredSentence.forEach(function (part) {

        switch (part.part) {
            case 'subject':
                size = part.tokens.length == 1 ? 'regular' : part.tokens.length < 4 ? 'wide' : 'double';
                instructions.push({rule: 'openContainer', glyph: undefined, size: size, children: part.tokens.length});
                part.tokens.forEach(function (token) {
                    instructions.push({rule: 'addGlyph', glyph: token});
                });
                instructions.push({rule: 'closeContainer'});
                break;
            case 'verbPhrase':
                size =  part.tokens.length == 1 ? 'regular' : part.tokens.length < 4 ? 'wide' : 'double';
                instructions.push({rule: 'openContainer', glyph: part.sep, size: size, children: part.tokens.length});
                part.tokens.forEach(function (token) {
                    instructions.push({rule: 'addGlyph', glyph: token});
                });
                instructions.push({rule: 'closeContainer'});
                break;
            case 'directObject':
                size = part.tokens.length < 4 ? 'wide' : 'double';
                instructions.push({rule: 'openContainer', glyph: part.sep, size: size, children: part.tokens.length});
                part.tokens.forEach(function (token) {
                    instructions.push({rule: 'addGlyph', glyph: token});
                });
                instructions.push({rule: 'closeContainer'});
                break;
            case 'punctuation':
                instructions.push({rule: 'addPunctuation', glyph: part.token === '.' ? 'period' : '', size: 'wide'});
                break;
            default:
                console.log('ERR: unknown part');
                break;
        }
    });

    return instructions;
}

