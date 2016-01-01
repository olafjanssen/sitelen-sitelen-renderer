#!python3

"""
This program use the CKY algorithm to parse entered sentences according to
a given CNF grammer.

To execute, give one command line argument: the name of the grammer file.
The grammer in this file must be in Chomsky Normal Form, meaning each
nonterminal goes to either one terminal or two nonterminals.  The file
should contain 1 grammar rule per line in the format:

  S -> NP VP
  N -> the
  
All tokens (including ->) must be separated by whitespace.  
The left and right side of each rule should be separated by a -> token.
There should be only 1 left-side token for each rule and it should be a 
non-terminal.  There should be 1 or 2 right-side tokens for each rule.  
Non-terminals must start with a capital letter.  A token (except for ->) 
with any other starting character is considered a terminal.

The program will read one sentence per line from standard in, and
output a corresponding 'S' or 'not S' depending on whether the input
was a valid sentence or not.  End input with ^D on *nix or ^Z on Windows.  
You can also redirection input/output to/from files.

Author: Zach Tomaszewski
Created: 07 Oct 2012
"""

import re
import sys

NONTERM = '[A-Z]' #how to recognize a non-terminal with re.match
TERM = '[^A-Z]'   #how to recognize a terminal with re.match
DEBUG = False     #whether to print the state of the table at end of parse

def main():
    """ 
    Handles command line arguments, then calls parse.
    """
    try:
        if len(sys.argv) == 1 or len(sys.argv) > 2:
            print(__doc__)
        else:
            rules = loadRules(sys.argv[1])
            grammar = Grammar(rules)
            while True:
                sentence = sys.stdin.readline()
                if not sentence:
                    break
                elif sentence.startswith('#') or sentence == '\n':
                    continue  #comment or blank line
                else:
                    print(parse(grammar, sentence)) #to stdout

    except IOError as e:
        print(e)


"""
Loads the CFK grammer from the given file.

Returns the grammar as a list of rules.  Each rule is simply a list of 
trimmed tokens of the format ['NonTerm', '->', 'NonTerm', 'NonTerm'] or
['NonTerm', '->', 'term'].

Raises an IOError if file cannot be read or is not formatted properly.

"""
def loadRules(filename):
    rules = list()
    with open(filename, 'r') as filein:
        for i, line in enumerate(filein):
            if not line:
                continue  # allow blank lines
            else:
                rule = line.split()
                if len(rule) not in [3, 4]:
                    raise IOError("Line " + str(i + 1) + 
                                  " is not in CNF: " + line)
                elif rule[1] != '->':
                    raise IOError("Line " + str(i + 1) + 
                                  " is missing -> as second token: " + line)
                else:
                    rules.append(rule)
    return rules                    


class Grammar:
  """
  A set of CNF rules converted into a more useful format for reverse-lookup.
  """

  def __init__(self, rules):
        """
        Given a set of CNF rules in the format returned by loadRules,
        constructs a new object with these fields:
        
        * rules - original list of rules
        
        * nonterms - A dictionary of all-non-terminal rules, but reversed 
          so that the keys are ('NonTerm', 'NonTerm') tuples and the 
          corresponding values are the list of the initial left-hand-side
          nonterminals.

        * terms -> A dictionary of terminals where the values are the 
        nonterminals that lead directly to that terminal.
        
        """
        self.rules = rules
        self.terms = dict()
        self.nonterms = dict()
        
        # reformat rules
        for rule in rules:
            if len(rule) == 3:      # nonterm -> term
                key = rule[2]
                into = self.terms
            elif len(rule) == 4:    # nonterm -> nonterm noterm
                key = (rule[2], rule[3])
                into = self.nonterms
            else:
                assert false                
            into[key] = into.get(key, []) + [rule[0]]
                

def parse(grammar, sentence):
    """
    Uses CKY algorithm to parse the given sentence according to the
    given grammar.  Returns results as a printable string.
    """
    tokens = sentence.split()
    if not tokens:
        return "not S: no tokens in sentence"

    # set up 2D matrix of empty dictionaries.
    # Each dictionary will be keyed by possible nonterminals.
    # Each nonterminal's value is a list of parse sub-trees,
    # where each sub-tree is either a terminal string or a tuple
    # of the form: (leftNonterm, leftPtr, rightNonterm, rightPtr).
    #
    table = []
    for token in tokens:
        table.append([dict() for x in range(len(tokens))])        

    # load terminals along central diagonal of matrix
    for (i, token) in enumerate(tokens):
        if re.match(NONTERM, token):
            token = "'" + token + "'"
        if token not in grammar.terms:
            return ("not S: " + token + " is not a terminal "
                "in the grammar.")
        else:
            for head in grammar.terms[token]:
                table[i][i][head] = [token]
    
    # Now progress through each next diagonal towards upper-right corner.
    # for each diagonal...
    for diagonal in range(1, len(tokens)): 
        diagLen = len(tokens) - diagonal
        # for each cell along this current diagonal...
        for i in range(diagLen):            
            row = i
            col = row + diagonal
            # for each pair of cells contributing to this cell in diagonal...
            for offset in range(diagonal):                  
                offsetRow = row + offset + 1
                offsetCol = row + offset
                for left, leftPtr in table[row][offsetCol].items():
                    for right, rightPtr in table[offsetRow][col].items():
                        for head in grammar.nonterms.get((left, right), []):
                            # update this cell in diagonal with contributions
                            derivations = table[row][col].get(head, list())
                            derivations.append((left, leftPtr, right, rightPtr))
                            table[row][col][head] = derivations

    if DEBUG:
        print()
        for row in table:
            print(row)

    upperRight = table[0][len(tokens) - 1] 
    if 'S' in upperRight:
        result = 'S: '
        for parse in upperRight['S']:
            for p in formatParse(parse):
                result += '[S ' + p + '] / '
        return result[:-2]  #chop off last '/ '
    else:
        return 'not S'


def formatParse(parse):
    """
    Given a recursive tuple of the (left, leftPtr, right, rightPtr) sort
    produced internally by the parse function, returns an easier-to-read
    string format.  Returns a list of such strings, since there may be more
    than one unique subtree.
    """
    if isinstance(parse, str):  #such as for S -> term case
        return [parse]
    elif isinstance(parse, list):
        options = list()
        for elem in parse:
            options.extend(formatParse(elem))
        return options
    elif isinstance(parse, tuple):
        #produce a list of all possible returned subtree formats
        options = list()        
        for opt1 in formatParse(parse[1]):
            pre = '[' + parse[0] + ' ' + opt1 + '] '
            for opt2 in formatParse(parse[3]):
                options.append(pre + '[' + parse[2] + ' ' + opt2 + ']')
        return options
    else:
        assert false, "Oops: shouldn't happen."
    
        
if __name__ == '__main__':
    main();
          
