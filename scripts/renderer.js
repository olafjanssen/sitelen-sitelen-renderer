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


function addSentence(instructions, reset) {
    console.log(instructions);
    var container = document.createElement('div');
    container.classList.add('toki-sentence');
    renderInstructions(instructions, container);
    if (reset) {
        document.getElementById('sitelen').innerHTML = '';
    }
    document.getElementById('sitelen').appendChild(container);
}



