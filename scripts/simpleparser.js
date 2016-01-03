function renderGlyph(container, word) {
    var fragment = document.createElement('div');
    fragment.style.backgroundImage = 'url(images/wordglyphs/tp-wg-' + word + '.svg)';
    fragment.setAttribute('data-toki', word);
    fragment.classList.add('toki-word');
    container.appendChild(fragment);
    return fragment;
}

function renderContainer(container, word) {
    var fragment = document.createElement('div');
    if (word) {
        fragment.style.backgroundImage = 'url(images/wordglyphs/tp-wg-' + word + '.svg)';
        fragment.setAttribute('data-toki', word);
    }
    fragment.classList.add('toki-container');
    container.appendChild(fragment);
    return fragment;
}

var sentence = [
    ["jan", "suli"],
    ["li", "toki", "ala"],
    ["e", "ma", "kasi"],
    ["e", "musi", ["pi", "jan", "suli"]],
    ["tawa", "ona"],
    ["tan", "ni"],
    ["."]
];


function addGlyph(instruction, target) {
    var fragment = document.createElement('div');
    fragment.setAttribute('data-toki', instruction.glyph);
    fragment.classList.add('toki-word');
    fragment.classList.add('toki-' + instruction.glyph);
    fragment.setAttribute('data-toki-dir',instruction.direction);
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
       }
    });
}



function classifyGroupHead(element) {
    switch (element) {
        case 'li':
        case 'e':
        case 'tawa':
        case 'tan':
        case 'lon':
        case 'pi':
            return 'container';
        case '.':
        case ':':
        case ',':
        case '!':
        case '?':
            return 'punctuation';
        default:
            return 'regular';
    }
}

function parseElements(container, elements) {
    elements.forEach(function (element) {
        if (Array.isArray(element)) {
            var classified = classifyGroupHead(element[0]), subcontainer;

            switch (classified) {
                case 'container':
                    subcontainer = renderContainer(container, element[0]);
                    parseElements(subcontainer, element.splice(1));
                    break;
                case 'punctuation':
                    break;
                case 'regular':
                    subcontainer = renderContainer(container);
                    parseElements(subcontainer, element);
                    break;
            }
        } else {
            renderGlyph(container, element);
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

    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'}
    ]);

    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 3},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'openContainer', glyph: 'li', size: 'regular', children: 1},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'},
        {rule: 'closeContainer'}
    ]);

    addSentence([
        {rule: 'openContainer', glyph: undefined, direction: 'row', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'jan'},
        {rule: 'addGlyph', glyph: 'pona'},
        {rule: 'closeContainer'},
        {rule: 'openContainer', glyph: 'li', size: 'wide', children: 2},
        {rule: 'addGlyph', glyph: 'wile'},
        {rule: 'addGlyph', glyph: 'moku'},
        {rule: 'closeContainer'}
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


