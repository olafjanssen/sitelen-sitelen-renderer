'use strict';

function addGlyph(instruction, target) {
    var fragment = document.createElement('div');
    fragment.setAttribute('data-toki', instruction.glyph);
    fragment.classList.add('toki-word');
    fragment.classList.add('toki-' + instruction.glyph);
    fragment.setAttribute('data-toki-dir',instruction.direction);
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


function renderInstructions(instructions, target){
    instructions.forEach(function(instruction) {
       switch (instruction.rule){
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

window.onload = function () {

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

}


