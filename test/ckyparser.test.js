beforeEach(function () {
    jasmine.addMatchers({
        toBeTheSameInstructions: function () {
            return {
                compare: function (a,b) {
                    var result = {pass: true, message: "Expected instructions converted."};

                    for (var i = 0; i < b.length; i++) {
                        if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
                            result.pass = false;
                            result.message = "Discrepancy of instruction " + i + ": expected\n" + JSON.stringify(a[i]) + "\n but got \n" + JSON.stringify(b[i]);
                            return result;
                        }
                    }
                    return result;
                }
            };
        }
    });
});

describe("Testing Noun Phrases", function () {
    //it("tenpo pi lili mi la mi lukin e sitelen pona.", function () {
    //    var text = 'tenpo pi lili mi la mi lukin e sitelen pona.',
    //        tokenized = [[{content: 'tenpo pi lili mi la mi lukin e sitelen pona'},{punctuation: ['period']}]],
    //        structured = [
    //            {part: 'subject', tokens: ['jan']},
    //            {part: 'punctuation', tokens: ['period']}
    //        ];
    //
    //    var parsableText = preformat(text);
    //    var structuredSentence = parseSentence(parsableText[0]);
    //
    //    expect(JSON.stringify(parsableText)).toBe(JSON.stringify(tokenized));
    //    expect(JSON.stringify(structuredSentence)).toBe(JSON.stringify(structured));
    //});

    it("jan -- Single Noun", function () {
        var text = 'jan',
            tokenized = [[{content: 'jan'},{punctuation: ['period']}]],
            structured = [
            {part: 'subject', tokens: ['jan']},
            {part: 'punctuation', tokens: ['period']}
        ];

        var parsableText = preformat(text);
        var structuredSentence = parseSentence(parsableText[0]);

        expect(JSON.stringify(parsableText)).toBe(JSON.stringify(tokenized));
        expect(JSON.stringify(structuredSentence)).toBe(JSON.stringify(structured));
    });

    it("jan pona -- Noun Modifier", function () {
        var text = 'jan pona',
            tokenized = [[{content: 'jan pona'},{punctuation: ['period']}]],
            structured = [
                {part: 'subject', tokens: ['jan', 'pona']},
                {part: 'punctuation', tokens: ['period']}
            ];

        var parsableText = preformat(text);
        var structuredSentence = parseSentence(parsableText[0]);

        expect(JSON.stringify(parsableText)).toBe(JSON.stringify(tokenized));
        expect(JSON.stringify(structuredSentence)).toBe(JSON.stringify(structured));
    });

    it("jan pona li pona -- Noun Modifier li Verb", function () {
        var text = 'jan pona li pona',
            tokenized = [[{content: 'jan pona li pona'},{punctuation: ['period']}]],
            structured = [
                {part: 'subject', tokens: ['jan', 'pona']},
                {part: 'verbPhrase', sep: 'li', tokens: ['pona']},
                {part: 'punctuation', tokens: ['period']}
            ];

        var parsableText = preformat(text);
        var structuredSentence = parseSentence(parsableText[0]);

        expect(JSON.stringify(parsableText)).toBe(JSON.stringify(tokenized));
        expect(JSON.stringify(structuredSentence)).toBe(JSON.stringify(structured));
    });

});