var sitelenRenderer = function () {
    'use strict';

    function renderCompoundSentence(sentence, target, settings) {
        if (!settings) {
            settings = {};
        }
        if (!settings.exportable) {
            settings.exportable = true;
        }
        if (!settings.optimalRatio) {
            settings.optimalRatio = 0.75;
        }
        if (!settings.minRatio) {
            settings.minRatio = 0;
        }
        if (!settings.maxRatio) {
            settings.maxRatio = 100;
        }
        if (!settings.ignoreHeight) {
            settings.ignoreHeight = false;
        }
        if (!settings.random) {
            settings.random = false;
        }
        var compounds = [];

        // create sentence parts
        var sentenceCompound = [];
        sentence.forEach(function (part) {
            sentenceCompound.push(part);
            if (part.part === 'punctuation') {
                compounds.push(sentenceCompound);
                sentenceCompound = [];
            }
        });
        if (sentenceCompound.length > 0) {
            compounds.push(sentenceCompound);
        }

        var bestOptions = [];

        var sorter = function (optimal) {
            return function (a, b) {
                return Math.abs(optimal - a.ratio) - Math.abs(optimal - b.ratio);
            };
        };

        compounds.forEach(function (compound) {
            var compoundOptions = sitelenLayout.layoutCompound(compound);
            compoundOptions = compoundOptions.filter(function (option) {
                return option.ratio > settings.minRatio && option.ratio < settings.maxRatio;
            });
            compoundOptions.sort(sorter(settings.optimalRatio));
            bestOptions.push(compoundOptions[settings.random ? Math.floor(Math.random() * compoundOptions.length) : 0]);
        });

        return sitelenCoreRenderer.renderComplexLayout(bestOptions, target, settings);
    }

    function renderInteractiveSentence(sentence) {
        var compound = document.createElement('div');

        document.getElementById('sitelen').appendChild(compound);

        var options = sitelenLayout.layoutCompound(sentence);
        options.sort(function (a, b) {
            return a.ratio - b.ratio;
        });

        var initialOption = [0, 100];
        options.forEach(function (option, index) {
            var dif = Math.abs(option.ratio - 0.8);
            if (dif < initialOption[1]) {
                initialOption = [index, dif];
            }
        });

        var slider = document.createElement('input');
        slider.setAttribute('type', 'range');
        slider.setAttribute('min', 0);
        slider.setAttribute('max', options.length - 1);
        slider.setAttribute('step', 1);
        slider.setAttribute('value', initialOption[0]);

        slider.addEventListener('input', function (event) {
            var optimal = options[slider.value].ratio;
            render(optimal);
        });
        compound.appendChild(slider);

        var pom = document.createElement('a');
        pom.innerHTML = 'download as SVG';
        compound.appendChild(pom);

        render(0.8);

        function render(optimal) {
            var tokens = [];

            sentence.forEach(function (part) {
                if (part.tokens) {
                    part.tokens.forEach(function (token) {
                        tokens.push(token);
                    });
                }
            });

            var filename = tokens.join('-') + '.svg';

            var previousRender = compound.querySelector('svg');
            if (previousRender) {
                compound.removeChild(previousRender);
            }
            renderCompoundSentence(sentence, compound, {optimalRatio: optimal});

            var text = '<?xml version="1.0" encoding="utf-8"?>\n' + compound.querySelector('svg').innerHTML;
            pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            pom.setAttribute('download', filename);
        }

        return compound;
    }

    return {
        renderCompoundSentence: renderCompoundSentence,
        renderInteractiveSentence: renderInteractiveSentence
    };
}();