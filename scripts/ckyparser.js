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
        var x = JSON.stringify(obj, null, 0);
        return x;
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
                                for (var r in rls) {
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
            console.log(parseTable);

            return parseTable;
        }
    }
}();


function parseTableToSitelenHierarchy(parseTable) {
    var state = {},
        sentence = {children: [], parent: undefined},
        container = sentence;

    function traverseParseTable(parseTable, left, right, rootIndex, depth) {
        if (!parseTable[left][right][rootIndex]['middle']) {
            if (state && (state.rule === 'DO' || state.rule === 'PrepPh')) {
                if (state.depth < depth) {
                    container.children.push({token: parseTable[left][right][rootIndex]['token'], children: []});
                    state.items++;

                    if (state.items == 1) {
                        container.children[container.children.length - 1].parent = container;
                        container = container.children[container.children.length - 1];
                    }
                }
            } else {
                container.children.push({token: parseTable[left][right][rootIndex]['token'], children: []});
            }
        } else {
            var rule = parseTable[left][right][rootIndex]['rule'];
            if (rule === 'DO' ||
                rule === 'PrepPh') {
                if (container.parent) {
                    container = container.parent;
                }
                state = {rule: rule, items: 0, depth: depth};
            }

            traverseParseTable(parseTable, left, parseTable[left][right][rootIndex]['middle'], parseTable[left][right][rootIndex]['leftRootIndex'], depth + 1);
            traverseParseTable(parseTable, parseTable[left][right][rootIndex]['middle'], right, parseTable[left][right][rootIndex]['rightRootIndex'], depth + 1);
        }
    }

    for (var i in parseTable[0][parseTable.length - 1]) {
        if (parseTable[0][parseTable.length - 1][i].rule !== 'S') {
            continue;
        }
        traverseParseTable(parseTable, 0, parseTable.length - 1, i, 0);
        break;
    }

    console.log(sentence);
}


function loadTokiPonaGrammar() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var grammar = xmlhttp.responseText.split('\n');

            ckyparser.setGrammar(grammar);

            var parseTable = ckyparser.getParse('mi toki ala e akesi e ma kasi e sike sewi lili tawa ona tan ni');
            parseTableToSitelenHierarchy(parseTable);
        }
    }
    xmlhttp.open("GET", "toki-pona-cnf-grammar.txt", true);
    xmlhttp.send();
}


loadTokiPonaGrammar();