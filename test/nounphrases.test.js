
describe("Testing Noun Phrases", function () {
    it("Single Noun", function () {
        var structured = [
            {part: 'subject', tokens: ['jan']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'regular', children: 1},
            {rule: 'addGlyph', glyph: 'jan'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("Single Noun with Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan','pona']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
            {rule: 'addGlyph', glyph: 'jan'},
            {rule: 'addGlyph', glyph: 'pona'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("Single Noun with Small Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan','lili']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'regular', children: 1},
            {rule: 'addGlyph', glyph: 'jan', modifier: 'lili'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

});