'use strict';

var ckyparser = function () {
    localStorage.clear();

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
        foundLi = false, steps = 0, tokenList = [];

    function traverseParseTable(parseTable, left, right, rootIndex, depth) {
        if (!parseTable[left][right][rootIndex]) {
            return;
        }

        var token = parseTable[left][right][rootIndex]['token'],
            rule = parseTable[left][right][rootIndex]['rule'];

        if (token) {
            tokenList.push(token);
        }

        steps++;

        if (rule === 'Pred' && part.tokens.length > 0) {
            sentence.push({part: 'verbPhrase', sep: foundLi ? 'li' : '', tokens: []});
            part = sentence[sentence.length - 1];
        }
        if (rule === 'DO') {
            sentence.push({part: 'directObject', sep: 'e', tokens: []});
            part = sentence[sentence.length - 1];
        }
        if (rule === 'Prep' || (token === 'tawa' && tokenList[tokenList.length - 2] !== 'li')) {
            sentence.push({part: 'prepPhrase', sep: token, tokens: []});
            part = sentence[sentence.length - 1];
            return;
        }

        if (token === 'li') {
            foundLi = true;
            return;
        }
        if (token === 'e') {
            return;
        }
        if (token === 'o' && part.part === 'subject' && part.tokens.length > 0) {
            part.sep = 'o';
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
    xmlhttp.open("GET", "toki-pona-cnf-grammar.txt", false);
    xmlhttp.send();
}

loadTokiPonaGrammar();


//
function preformat(text) {
    var result = text.match(/[^\.!\?]+[\.!\?]+/g);

    var parsableParts = [], rawParts = [];
    if (!result) { // allow sentence fractions without any punctuation
        result = [text + '|'];
        console.log('WARNING: sentence fraction without punctuation');
    }
    result.forEach(function (sentence) {
        sentence = sentence.trim();

        var parsableSentence = [];
        parsableParts.push(parsableSentence);
        rawParts.push(sentence);

        var body = sentence.substr(0, sentence.length - 1);

        // remove the comma before the la-clause and before a repeating li clause
        body = body.replace(', la ', ' la ');
        body = body.replace(', li ', ' li ');

        // split on context separators comma and colon
        var laparts = body.split(/ la /);
        laparts.forEach(function (lapart, index) {
            var colonparts = lapart.split(/:/);
            colonparts.forEach(function (colonpart, index) {
                var commaparts = colonpart.split(/,/);
                commaparts.forEach(function (commapart, index) {
                    commapart = commapart.trim();

                    parsableSentence.push({content: commapart});
                    if (index < commaparts.length - 1) {
                        parsableSentence.push({punctuation: ['comma']});
                    }
                });

                if (index < colonparts.length - 1) {
                    parsableSentence.push({punctuation: ['semicolon']});
                }
            });
            if (laparts.length === 2 && index === 0) {
                parsableSentence.push({punctuation: ['la']});
            }
        });

        var terminator = sentence.substr(-1);
        switch (terminator) {
            case '.':
                parsableSentence.push({punctuation: ['period']});
                break;
            case '!':
                parsableSentence.push({punctuation: ['exclamation']});
                break;
            default:
                break;
        }

    });
    return {parsable: parsableParts, raw: rawParts};
}

function postprocessing(sentence) {
    var prepositionContainers = ['lon', 'tan', 'kepeken', 'tawa', 'pi'],
        prepositionSplitIndex;

    // split prepositional phrases inside containers (such as the verb li-container)
    sentence.forEach(function (part, index) {
        prepositionSplitIndex = -1;

        part.tokens.forEach(function (token, tokenIndex) {
            if (prepositionContainers.indexOf(token) > -1 && tokenIndex < part.tokens.length - 1) {
                prepositionSplitIndex = tokenIndex;
            }
        });

        if (prepositionSplitIndex > -1) {
            var newParts = [];
            if (prepositionSplitIndex > 0) {
                newParts.push({part: part.part, tokens: part.tokens.slice(0, prepositionSplitIndex)});
            }
            newParts.push({
                part: part.part,
                sep: part.tokens[prepositionSplitIndex],
                tokens: part.tokens.slice(prepositionSplitIndex + 1)
            });
            sentence[index] = {part: part.part, sep: part.sep, parts: newParts};
        }
    });
    return sentence;
}


var parseHash = JSON.parse(localStorage.getItem('parseHash'));
parseHash = parseHash ? parseHash : {};

function parseSentence(sentence) {

    var structuredSentence = [];

    sentence.forEach(function (part) {
        if (part.content) {
            var key = part.content, value = [];
            if (!parseHash[key]) {
                // find proper names
                var properNames = [];
                part.content = part.content.replace(/([A-Z][\w-]*)/g, function (item) {
                    properNames.push(item);
                    return '\'Name\'';
                });
                var parseTable = ckyparser.getParse(part.content);

                value = getStructuredSentence(parseTable);
                if (!value) {
                    value = [];
                }

                value.forEach(function (part) {
                    part.tokens.forEach(function (token, index) {
                        if (token === '\'Name\'') {
                            part.tokens[index] = properNames.shift();
                        }
                    });
                });
                parseHash[key] = value;
            }
            structuredSentence.push.apply(structuredSentence, parseHash[key]);
        } else if (part.punctuation) {
            structuredSentence.push({part: 'punctuation', tokens: part.punctuation});
        }
    });

    structuredSentence = postprocessing(structuredSentence);

    console.log(structuredSentence);

    localStorage.setItem('parseHash', JSON.stringify(parseHash));
    return structuredSentence;
}











