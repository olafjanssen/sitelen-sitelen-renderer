'use strict';

function addGlyph(instruction, target) {
    var fragment = document.createElement('div');
    fragment.setAttribute('data-toki', instruction.glyph);
    fragment.classList.add('toki-word');
    if (instruction.glyph) {
        fragment.classList.add('toki-' + instruction.glyph);
    } else if (instruction.syllable) {
        fragment.classList.add('toki-syl-' + instruction.syllable);
    }
    if (instruction.modifier) {
        fragment.classList.add('toki-mod-' + instruction.modifier);
    }
    fragment.setAttribute('data-toki-dir', instruction.direction);
    target.appendChild(fragment);
    return fragment;
}

function addPunctuation(instruction, target) {
    var fragment = document.createElement('div');
    fragment.setAttribute('data-toki', instruction.glyph);
    fragment.setAttribute('data-toki-size', instruction.size);
    fragment.classList.add('toki-punctuation');
    fragment.classList.add('toki-' + instruction.glyph);
    target.appendChild(fragment);
    return fragment;
}

function openContainer(instruction, target) {
    var fragment = document.createElement('div');
    fragment.setAttribute('data-toki-size', instruction.size);
    fragment.setAttribute('data-toki-children', instruction.children);
    fragment.classList.add('toki-' + instruction.glyph);

    fragment.classList.add('toki-container');
    target.appendChild(fragment);
    return fragment;
}


function renderInstructions(instructions, target) {
    instructions.forEach(function (instruction) {
        switch (instruction.rule) {
            case 'openContainer':
                target = openContainer(instruction, target);
                break;
            case 'addGlyph':
                addGlyph(instruction, target);
                break;
            case 'closeContainer':
                target = target.parentNode;
                break;
            case 'addPunctuation':
                addPunctuation(instruction, target);
                break;
        }
    });
}


function addSentence(instructions) {
    var container = document.createElement('div');
    container.classList.add('toki-sentence');
    renderInstructions(instructions, container);
    document.body.appendChild(container);
}

function convertToInstructions(structuredSentence) {
    var instructions = [],
        size;

    structuredSentence.forEach(function (part) {

        switch (part.part) {
            case 'subject':
                size = part.tokens.length < 4 ? 'wide' : 'double';
                instructions.push({rule: 'openContainer', glyph: undefined, size: size, children: part.tokens.length});
                part.tokens.forEach(function (token) {
                    instructions.push({rule: 'addGlyph', glyph: token});
                });
                instructions.push({rule: 'closeContainer'});
                break;
            case 'verbPhrase':
                size = part.tokens.length < 4 ? 'wide' : 'double';
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


window.onload = function () {

    var sentence = [
        {part: 'subject', tokens: ['ale']},
        {part: 'verbPhrase', sep: ['li'], tokens: ['jo']},
        {part: 'directObject', sep: ['e'], tokens: ['tenpo']},
        {part: 'punctuation', token: '.'}
    ];

    addSentence(convertToInstructions(sentence));


    // toki pona proverbs

    // ale li jo e tenpo
    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'ale'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'jo'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'e', size: 'wide', children: 1},
        {rule: 'addGlyph', glyph: 'tenpo'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // ale li pona
    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'ale'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // toki pona li toki pona
    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'toki'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'li', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'toki'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // nasin pona li mute
    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'nasin'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'li', size: 'wide', children: 1},
        {rule: 'addGlyph', glyph: 'mute'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // jan sona li jan nasa.
    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'sona'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'li', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'nasa'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // o olin e jan poka.
    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', syllable: 'o'},
        {rule: 'addGlyph', glyph: 'olin'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'e', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'poka'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // jan li suli mute. mani li suli lili.
    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'suli', modifier: 'mute'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'},
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'mani'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'suli', modifier: 'lili'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);


    // pilin pona li pana e sijelo pona.
    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'pilin'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'li', size: 'wide', children: 1},
        {rule: 'addGlyph', glyph: 'pana'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'e', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'sijelo'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // o pana e pona tawa ma.
    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', syllable: 'o'},
        {rule: 'addGlyph', glyph: 'pana'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'e', size: 'wide', children: 1},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'tawa', size: 'wide', children: 1},
        {rule: 'addGlyph', glyph: 'ma'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan', modifier: 'lili'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'}
    ]);

    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan', modifier: 'mute'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'}
    ]);

    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan', modifier: 'kon'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'}
    ]);

    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan', modifier: 'sin'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'}
    ]);

    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // jan li moku.
    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // jan pona li moku.
    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 3},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // mi moku e kili.
    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 3},
        {rule: 'addGlyph', glyph: 'mi'},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'openContainer', glyph: 'e', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'kili'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // mi moku e kili.
    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'mi'},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'e', size: 'wide', children: 1},
        {rule: 'addGlyph', glyph: 'kili'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // jan pona li moku.
    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'li', size: 'wide', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // jan utala pona li moku.
    addSentence([
        {rule: 'openContainer', glyph: undefined, size: 'double', children: 4},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'utala'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);


    // jan pona li wile moku.
    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'li', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'wile'},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // jan pona li wile moku kili suwi.
    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'li', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'wile'},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'e', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'kili'},
        {rule: 'addGlyph', glyph: 'suwi'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // jan pona li moku e kili suwi.
    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 3},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'e', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'kili'},
        {rule: 'addGlyph', glyph: 'suwi'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // jan li pona tawa mi.
    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'tawa', size: 'wide', children: 1},
        {rule: 'addGlyph', glyph: 'sina'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    // jan pona li moku e kili suwi tawa jan utala.
    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 3},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'e', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'kili'},
        {rule: 'addGlyph', glyph: 'suwi'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'tawa', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'utala'},
        {rule: 'closeContainer'},
        {rule: 'addPunctuation', glyph: 'period', size: 'wide'}
    ]);

    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 1},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 3},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'}
    ]);

    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'tall', children: 1},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'tall', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'tall', children: 3},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'}
    ]);

    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'double', children: 4},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'double', children: 5},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'double', children: 6},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'double', children: 7},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'double', children: 8},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'double', children: 9},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'closeContainer'}

    ]);

};


