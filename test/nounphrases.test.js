describe("Testing Noun Phrases", function () {
    it("jan -- Single Noun", function () {
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

    it("jan pona -- Single Noun with Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan', 'pona']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
            {rule: 'addGlyph', glyph: 'jan'},
            {rule: 'addGlyph', glyph: 'pona'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("jan lili -- Single Noun with Small Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan', 'lili']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'regular', children: 1},
            {rule: 'addGlyph', glyph: 'jan', modifier: 'lili'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("jan tu -- Single Noun with Narrow Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan', 'tu']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
            {rule: 'addGlyph', glyph: 'jan'},
            {rule: 'addGlyph', glyph: 'tu'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("jan tu wan -- Single Noun with Double Narrow Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan', 'tu', 'wan']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
            {rule: 'addGlyph', glyph: 'jan'},
            {rule: 'addGlyph', glyph: 'tu'},
            {rule: 'addGlyph', glyph: 'wan'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("jan tu tu wan -- Single Noun with Triple Narrow Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan', 'tu', 'tu', 'wan']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'wide', children: 3},
            {rule: 'addGlyph', glyph: 'jan'},
            {rule: 'addGlyph', glyph: 'tu'},
            {rule: 'addGlyph', glyph: 'tu'},
            {rule: 'addGlyph', glyph: 'wan'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("jan tu tu tu wan -- Single Noun with Quadruple Narrow Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan', 'tu', 'tu', 'tu', 'wan']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'wide', children: 3},
            {rule: 'addGlyph', glyph: 'jan'},
            {rule: 'addGlyph', glyph: 'tu'},
            {rule: 'addGlyph', glyph: 'tu'},
            {rule: 'addGlyph', glyph: 'tu'},
            {rule: 'addGlyph', glyph: 'wan'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("jan lili pona -- Double Noun with Small Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan', 'lili', 'pona']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'wide', children: 2},
            {rule: 'addGlyph', glyph: 'jan', modifier: 'lili'},
            {rule: 'addGlyph', glyph: 'pona'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("jan pona lili -- Double Noun with Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan', 'utala', 'pona']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'wide', children: 3},
            {rule: 'addGlyph', glyph: 'jan'},
            {rule: 'addGlyph', glyph: 'utala'},
            {rule: 'addGlyph', glyph: 'pona'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("jan lili utala mi -- Triple Noun with Small Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan', 'lili', 'utala', 'mi']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'wide', children: 3},
            {rule: 'addGlyph', glyph: 'jan', modifier: 'lili'},
            {rule: 'addGlyph', glyph: 'utala'},
            {rule: 'addGlyph', glyph: 'mi'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("jan utala pona mi -- Triple Noun with Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan', 'utala', 'pona', 'mi']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'double', children: 4},
            {rule: 'addGlyph', glyph: 'jan'},
            {rule: 'addGlyph', glyph: 'utala'},
            {rule: 'addGlyph', glyph: 'pona'},
            {rule: 'addGlyph', glyph: 'mi'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

    it("jan utala pona tu -- Triple Noun with Narrow Modifier", function () {
        var structured = [
            {part: 'subject', tokens: ['jan', 'utala', 'pona', 'tu','tu']}
        ], instructions = [
            {rule: 'openContainer', glyph: undefined, size: 'double', children: 4},
            {rule: 'addGlyph', glyph: 'jan'},
            {rule: 'addGlyph', glyph: 'utala'},
            {rule: 'addGlyph', glyph: 'pona'},
            {rule: 'addGlyph', glyph: 'tu'},
            {rule: 'addGlyph', glyph: 'tu'},
            {rule: 'closeContainer'}
        ];

        expect(JSON.stringify(convertToInstructions(structured))).toBe(JSON.stringify(instructions));

        addSentence(instructions);
    });

});