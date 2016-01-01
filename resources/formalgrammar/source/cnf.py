#!python3

"""
This program converts a given grammar to Chomsky Normal Form (CNF).

The program should be invoked with two command line arguments:
the name of the input file and the name of the output file.
The outputfile may be omitted, in which case output is printed
to the screen (stdout).  If the outputfile already exists, it will be 
over-written.

The input file should have one grammar rule per line using the format:
  
  S -> NP VP | IVP
  NP -> the N
  
All tokens (including -> and |) must be separated by whitespace.  
The left and right side of each rule should be separated by a -> token.
There should be only 1 left-side token for each rule and it should be a 
non-terminal.  There should be 1 or more right-side tokens for each rule.  
(That is, this program does not support empty right-sides or etas.)  
Non-terminal must start with a capital letter.  Non-terminals of the 
form PREFIX + '\d+' (where \d+ is one or more digits) are reserved and may 
not occur in the input grammar.  A token (except for -> or |) with 
any other starting character is considered a terminal.

The output will contain the same rules converted to CNF.  In CNF, each
rule translates a non-terminal to either 2 non-terminals or a 1 terminal.

Author: Zach Tomaszewski
Created: 28 Sep 2012
"""

import re
import sys

PREFIX = 'ZZ'     #prefix of produced dummy nonterminals
NONTERM = '[A-Z]' #how to recognize a non-terminal with re.match
TERM = '[^A-Z]'   #how to recognize a terminal with re.match


def main():
    """ 
    Handles command line arguments and output redirection, then calls convert.
    """
    if len(sys.argv) == 1 or len(sys.argv) > 3:
        print(__doc__)
    else:
        if len(sys.argv) == 3:
            # redirect all output to given file instead
            sys.stdout = open(sys.argv[2], 'w')            
        
        cnf = convert(loadRules(sys.argv[1]))           
        for rule in cnf:
            print(" ".join(rule))
            
        sys.stdout = sys.__stdout__  # restore normal stdout


def loadRules(filename):
    """
    Returns a list of rules read from the given file.  Each rule is itself 
    a rule of tokens, including the '->' token, with whitespace removed.  
    Any rules with a '|' on the right side are split/converted to multiple 
    rules with the same initial token.
    """
    rules = list()
    with open(filename, 'r') as filein:
        for i, line in enumerate(filein):
            tokens = line.split()
            #print(tokens)
            if not tokens:
                continue  #blank line
            elif tokens[0].startswith('#'):
                continue  #comment
            elif len(tokens) < 3 or tokens[1] != '->':
                # bad input format
                sys.stderr.write("ERROR: Line " + str(i) +" is not a valid rule: "
                    "either incomplete or missing '->' as second token.\n")
                return
            else:
                while '|' in tokens:
                    # break up |s into multiple rules
                    rules.append(tokens[:tokens.index('|')])  #grab up to |
                    tokens[2:tokens.index('|') + 1] = []  #cut from -> to |
                rules.append(tokens)
    return rules                


def convert(rules):
    """
    Does the work of converting the given rules contents to CNF.
    Given rules must be in the format as returned by loadRules. 
    Returns a list of the resulting CNF-formatted rules.
    """    
    cnf = list()
    counter = 1
    
    # first pass: error checking (since will introduce reserved words later)
    for rule in rules:
        # prevent any reserved word clashes
        for token in rule:
            if re.match(PREFIX + '\d+', token):
                sys.stderr.write("ERROR: Rule contains a token of reserved "
                    "form '" + PREFIX + "\d+': " + " ".join(rule) + "\n")
                return []
    
        # rules should not start with non terminals
        if re.match(TERM, rule[0]):
            sys.stderr.write("ERROR: Rule starts with terminal: " + \
                " ".join(rule) + "\n")
            return []
    
    # second pass: processing
    for rule in rules:
        if len(rule) == 3:
            if re.match(TERM, rule[2]):
                # nonterm -> term, which is fine
                cnf.append(rule)
            else:
                # nonterm -> nonterm, which is a unit production
                # For all A -> B, B -> ?, convert to A -> ?
                for r in rules:
                    if rule[2] == r[0]:
                        rules.append(rule[0:2] + r[2:])
        elif len(rule) == 4 and \
                re.match(NONTERM, rule[2]) and re.match(NONTERM, rule[3]):
            # nonterm -> two nonterms, also fine
            cnf.append(rule)
            
        else:
            # either len 4 with mix of terms and non terms,
            # or else just many nonterms
            # first, get rid of all terms
            dummied = rule[0:2]  # up to -> of original,
            for token in rule[2:]:
                if re.match(TERM, token):
                    dummy = PREFIX + str(counter)
                    counter += 1
                    dummied.append(dummy)
                    rules.append([dummy, '->', token])
                else:
                    dummied.append(token)

            #now go through dummied and trim down to two nonterms at a time
            while len(dummied) > 4:
                dummy = PREFIX + str(counter)
                counter += 1
                equiv = [dummy, '->'] + dummied[2:4]
                cnf.append(equiv)
                dummied[2:4] = [dummy]
            cnf.append(dummied)                  
    return cnf
    

# run main
if __name__ == '__main__':
    main();
  