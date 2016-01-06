'use strict';

var ckyparser = function () {

    var hashMap = {};

    function create2dArray(dim) {
        var arr = new Array(dim);
        for (var i = 0; i < dim; i++) {
            arr[i] = new Array(dim);
            for (var j = 0; j < dim; j++) {
                arr[i][j] = [];
            }
        }
        return arr;
    }

    function makeKey(obj) {
        if (typeof obj === 'string') {
            obj = [obj];
        }
        return JSON.stringify(obj, null, 0);
    }

    function parse(grammar, tokens) {
        var tokLen = tokens.length + 1;
        var parseTable = create2dArray(tokLen);
        for (var right = 1; right < tokLen; right++) {
            var token = tokens[right - 1];
            var terminalRules = grammar[makeKey(token)];
            for (var r in terminalRules) {
                var rule = terminalRules[r];
                parseTable[right - 1][right].push({
                    rule: rule,
                    token: token
                });
            }
            for (var left = right - 2; left >= 0; left--) {
                for (var mid = left + 1; mid < right; mid++) {
                    var leftSubtreeRoots = parseTable[left][mid];
                    var rightSubtreeRoots = parseTable[mid][right];
                    for (var leftRootIndx in leftSubtreeRoots) {
                        for (var rightRootIndx in rightSubtreeRoots) {
                            var rls = grammar[makeKey([leftSubtreeRoots[leftRootIndx]['rule'], rightSubtreeRoots[rightRootIndx]['rule']])];
                            if (rls) {
                                for (r in rls) {
                                    parseTable[left][right].push({
                                        rule: rls[r],
                                        middle: mid,
                                        leftRootIndex: leftRootIndx,
                                        rightRootIndex: rightRootIndx
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        return parseTable;
    }

    function grammarToHashMap(rules) {
        var hashMap = {};
        for (var i in rules) {
            var rule = rules[i];
            var parts = rule.split('->');
            var root = parts[0].trim();

            var productions = parts[1].split('|');
            for (var j in productions) {
                var childs = (productions[j].trim()).split(' ');
                var key = makeKey(childs);
                if (!hashMap[key]) {
                    hashMap[key] = [];
                }
                hashMap[key].push(root);
            }
        }
        return hashMap;
    }

    function traverseParseTable(parseTable, left, right, rootIndex) {
        if (!parseTable[left][right][rootIndex]['middle']) {
            return '<li><a href="#">' + parseTable[left][right][rootIndex]['rule'] + '</a><ul><li><a href="#">' + parseTable[left][right][rootIndex]['token'] + '</a> endpoint</li></ul></li>';
        }
        return '<li><a href="#">' + parseTable[left][right][rootIndex]['rule'] + '</a><ul>' + traverseParseTable(parseTable, left, parseTable[left][right][rootIndex]['middle'], parseTable[left][right][rootIndex]['leftRootIndex']) + traverseParseTable(parseTable, parseTable[left][right][rootIndex]['middle'], right, parseTable[left][right][rootIndex]['rightRootIndex']) + '</ul></li>';
    }


    return {
        setGrammar: function (grammar) {
            hashMap = grammarToHashMap(grammar);
        },
        getParse: function (sentence) {
            var parseTable = parse(hashMap, sentence.split(' '));
            return parseTable;
        }
    }
}();


function getStructuredSentence(parseTable) {
    var part = {part: 'subject', tokens: []},
        sentence = [part],
        foundLi = false, steps = 0;

    function traverseParseTable(parseTable, left, right, rootIndex, depth) {
        if (!parseTable[left][right][rootIndex]) {
            return;
        }

        var token = parseTable[left][right][rootIndex]['token'],
            rule = parseTable[left][right][rootIndex]['rule'];

        steps++;

        if (rule === 'Pred') {
            sentence.push({part: 'verbPhrase', sep: foundLi ? 'li' : '', tokens: []});
            part = sentence[sentence.length - 1];
        }
        if (rule === 'DO') {
            sentence.push({part: 'directObject', sep: 'e', tokens: []});
            part = sentence[sentence.length - 1];
        }

        if (token === 'li') {
            foundLi = true;
            return;
        }
        if (token === 'e') {
            return;
        }

        if (token) {
            part.tokens.push(token);
        } else {
            traverseParseTable(parseTable, left, parseTable[left][right][rootIndex]['middle'], parseTable[left][right][rootIndex]['leftRootIndex'], depth + 1);
            traverseParseTable(parseTable, parseTable[left][right][rootIndex]['middle'], right, parseTable[left][right][rootIndex]['rightRootIndex'], depth + 1);
        }
    }

    traverseParseTable(parseTable, 0, parseTable.length - 1, 0, 0);

    return steps === 0 ? null : sentence;
}


function loadTokiPonaGrammar() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var grammar = xmlhttp.responseText.split('\n');
            ckyparser.setGrammar(grammar);
        }
    };
    xmlhttp.open("GET", "toki-pona-cnf-grammar.txt", true);
    xmlhttp.send();
}

loadTokiPonaGrammar();


//
function preformat(text) {
    var result = text.match(/[^\.!\?]+[\.!\?]+/g);

    var parsableParts = [];

    result.forEach(function (sentence) {
        sentence = sentence.trim();

        var parsableSentence = [];
        parsableParts.push(parsableSentence);

        var body = sentence.substr(0, sentence.length - 1);

        // remove the comma before the la-clause.
        body = body.replace(', la ', ' la ');

        // split on context separators comma and colon
        var colonparts = body.split(/:/);
        colonparts.forEach(function (colonpart, index) {
            var commaparts = colonpart.split(/,/);
            commaparts.forEach(function (commapart, index) {
                commapart = commapart.trim();

                parsableSentence.push({content: commapart});
                if (index < commaparts.length - 1) {
                    parsableSentence.push({punctuation: ','});
                }
            });

            if (index < colonparts.length - 1) {
                parsableSentence.push({punctuation: ':'});
            }
        });

        var terminator = sentence.substr(-1);
        parsableSentence.push({punctuation: terminator});

    });

    return parsableParts;
}

function parseSentence(sentence) {
    var structuredSentence = [];

    sentence.forEach(function (part) {
        if (part.content) {
            var parseTable = ckyparser.getParse(part.content);
            structuredSentence.push.apply(structuredSentence, getStructuredSentence(parseTable));
        } else if (part.punctuation) {
            structuredSentence.push({part: 'punctuation', token: part.punctuation});
        }
    });

    return structuredSentence;
}











