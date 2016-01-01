// words == tokens
function parse( words, grammar, rootRule ) {
    // initialize chart
    // (length of chart == number of tokens + 1)
    var chart = [];
    for(var i = 0; i < words.length + 1; i++) {
        chart[i] = [];
    }
    // used for indexing states by id
    // (needed for backtracking)
    var idToStateMap = {};
    var id = 0;
    
    // each state contains fields:
    // 1) lhs - left hand side of rule (string)
    // 2) rhs - right hand side of rule (array)
    // 3) dot - index to subrule of right hand side rule (if state is complete - dot == length of rhs) (int)
    // 4) pos - index of chart column, which contains state, from which given state was derived (int)
    // 5) id - unique id of given state (int)
    // 6) ref - object with fields 'dot' (int) and 'ref' (int)
    // 'dot' - index to right hand side subrule (int)
    // 'ref' - id of state, which derived from this subrule (int) - used in backtracking, to generate parsing trees
    
    // check if given state incomplete:
    // if 'dot' points to the end of right hand side rules or not
    function incomplete( state ) {
        return state['dot'] < state['rhs'].length;
    }
    
    // checks whenever right hand side subrule, to which points 'dot' - terminal or non-terminal
    function expectedNonTerminal( state, grammar ) {
        var expected = state['rhs'][state['dot']];
        if( grammar[expected] ) {
            return true;
        }
        return false;
    }
    
    // ads newState to column in chart (indexed by specific position)
    // also - adds id to newState, and adds it to index: idToStateMap
    // (if given column already contains this state - dosn't add duplicate, but merge 'ref')
    //
    // TODO: use HashSet + LinkedList
    function addToChart( newState, position ) {
        if(!newState['ref']) {
            newState['ref'] = [];
        }
        newState['id'] = id;        

        // TODO: use HashSet + LinkedList
        for(var x in chart[position]) {
            var chartState = chart[position][x];
            if(chartState['lhs'] == newState['lhs']
              && chartState['dot'] == newState['dot']
              && chartState['pos'] == newState['pos']
              && JSON.stringify(chartState['rhs']) == JSON.stringify(newState['rhs'])) {
                chartState['ref'] = chartState['ref'].concat(newState['ref']);
                return;
            }
        }        
        
        chart[position].push(newState);
        idToStateMap[id] = newState;

        id++;
    }
    
    // this function is called in case when 'dot' points to non-terminal
    // using all rules for given non-terminal - creating new states, 
    // and adding them to chart (to column with index 'j')
    function predictor( state, j, grammar ) {
        var nonTerm = state['rhs'][state['dot']];
        var productions = grammar[nonTerm];
        for(var i in productions) {
            var newState = {
                'lhs': nonTerm,
                'rhs': productions[i],
                'dot': 0,
                'pos': j
            };
            addToChart(newState, j);
        }
    }

    // this function is called in case when 'dot' points to terminal
    // in case, when part of speech of word with index 'j' corresponds to given terminal -
    // (terminal - can produce this part of speech, or terminal == word[j])
    // creating new state, and add it to column with index ('j' + 1)
    function scanner( state, j, grammar ) {
        var term = state['rhs'][state['dot']];
        var termPOS = grammar.partOfSpeech( words[j] );
        termPOS.push( words[j] );
        for(var i in termPOS) {
            if(term == termPOS[i]) {
                var newState = {
                    'lhs': term,
                    'rhs': [words[j]],
                    'dot': 1,
                    'pos': j
                };
                addToChart(newState, j + 1);
                break;
            }
        }
    }
    
    // this function is called in case when given state is completed ('dot' == length of 'rhs')
    // it means that discovered state could be appended to its parent state (and shift dot in parent state)
    // actually - parent state is not changed, but new state is generated (parent state is cloned + shift of dot)
    // new state is added to chart (to column with index 'k')
    function completer( state, k ) {
        var parentChart = chart[state['pos']];
        for(var i in parentChart) {
            var stateI = parentChart[i];
            if(stateI['rhs'][stateI['dot']] == state['lhs']) {
                var newState = {
                    'lhs': stateI['lhs'],
                    'rhs': stateI['rhs'],
                    'dot': stateI['dot'] + 1,
                    'pos': stateI['pos'],
                    'ref': stateI['ref'].slice()
                };
                newState['ref'].push({
                    'dot': stateI['dot'],
                    'ref': state['id']
                });
                addToChart(newState, k);
            }
        }
    }
    
    // printing chart to console.log
    // TODO: remove
    function log( message, chart ) {
        console.log(message);
        for(var o in chart) {
            console.log(JSON.stringify(chart[o])); 
        }
        console.log();
    }
    
    // Earley algorithm
    // http://en.wikipedia.org/wiki/Earley_parser#Pseudocode
    
    // initial seed - adding states, which correponds to productions, where lhs is rootRule
    var rootRuleRhss = grammar[rootRule];
    for(var i in rootRuleRhss) {
        var initialState = {
            'lhs': rootRule,
            'rhs': rootRuleRhss[i],
            'dot': 0,
            'pos': 0
        };
        addToChart(initialState, 0);
    }
    log('init', chart);
    for(var i = 0; i < words.length + 1; i++) {
        j = 0;
        while( j < chart[i].length) {
            var state = chart[i][j];
            if( incomplete(state) ) { 
                if( expectedNonTerminal(state, grammar) ) {                                                            
                    predictor(state, i, grammar);                
                    log('predictor',chart);                
                } else {
                    scanner(state, i, grammar);
                    log('scanner',chart);                
                }
            } else {
                completer(state, i);            
                log('completer',chart);            
            }
            j++;
        }
    }
    
    log('done', chart);
    console.log('');
    for(var id in idToStateMap) {
        console.log(id + '\t' + JSON.stringify(idToStateMap[id], null, 0));    
    }
    
    // search for state, which has rootRule in lhs
    // iterating through last column of chart
    var roots = [];
    var lastChartColumn = chart[chart.length - 1];
    for(var i in lastChartColumn) {
        var state = lastChartColumn[i];
        if( state['lhs'] == rootRule && !incomplete( state ) ) {
            // this is the root of valid parse tree
            roots.push(state);
        }
    }
    
    console.log('\n' + 'roots');
    console.log(JSON.stringify(roots, null, 0));
}


function processGrammar( grammar ) {
    var processed = {};
    for(var i in grammar) {
        var rule = grammar[i];
        var parts = rule.split('->');
        var lhs = parts[0].trim();;
        var rhs = parts[1].trim();
        if(!processed[lhs]) {
            processed[lhs] = [];
        }
        var rhsParts = rhs.split('|');
        for(var j in rhsParts) {
            processed[lhs].push(rhsParts[j].trim().split(' '));
        }
    }
    processed.partOfSpeech = function( word ) {
        return [];
    }
    return processed;
}

/*
var grammar = {
    'R': [['S']],
    'S': [['S', 'add_sub', 'M'], ['M'], ['num']],
    'M': [['M', 'mul_div', 'T'], ['T'], ['num']],
    'T': [['num']]
};
grammar.partOfSpeech = function( word ) {
    if( '+' == word || '-' == word ) return ['add_sub'];
    if( '*' == word || '/' == word ) return ['mul_div'];
    return ['num'];
}
*/

//parse('2 + 3 + 4'.split(' '), grammar);
var grammar = [
    'R -> S',
    'S -> S add_sub M | M | num',
    'M -> M mul_div T | T | num',
    'T -> num',
    'num -> 2 | 3 | 4',
    'add_sub -> + | -',
    'mul_div -> * | /'
];
parse('2 + 3 * 4'.split(' '), processGrammar(grammar), 'R');
//alert(JSON.stringify(processGrammar(grammar), null, 4))
