/* global sitelenLayout, sitelenCoreRenderer, sitelenParser */

/**
 * User friendly wrapper for rendering sitelen sitelen.
 *
 * @type {{renderCompoundSentence, renderInteractiveSentence}}
 */
var sitelenRenderer = function () {
    'use strict';

    /**
     * Render a single static sentence.
     *
     * @param sentence  the structured sentence
     * @param target    the element to render in
     * @param settings  the settings object
     */
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
        if (!settings.output) {
            settings.output = {format: 'inlineSVG'};
        }
        if (!settings.styling) {
            settings.styling = {};
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

        var rendered = sitelenCoreRenderer.renderComplexLayout(bestOptions, target, settings);

        // add background element
        if (settings.output.background) {
            if (settings.output.background instanceof Node) {
                rendered.insertBefore(settings.output.background, rendered.childNodes[0]);
            }
        }

        // determine output format
        switch (settings.output.format) {
            case 'inlineSvg':
                return;
            case 'svg':
                renderAsSvgImg(rendered);
                return;
            case 'png':
                renderAsPng(rendered);
                return;
            case 'css-background':
                renderAsCssBackground(rendered);
                return;
        }
    }

    /**
     * Render a single interactive structured sentence.
     * @param sentence  the structured sentence
     * @param settings  rendering settings object
     * @returns {Element}   the rendered element
     */
    function renderInteractiveSentence(sentence, settings) {
        if (!settings) {
            settings = {};
        }

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
        slider.setAttribute('min', '0');
        slider.setAttribute('max', '' + (options.length - 1));
        slider.setAttribute('step', '1');
        slider.setAttribute('value', '' + initialOption[0]);

        slider.addEventListener('input', function () {
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

            var previousRender = compound.querySelector('[data-sitelen-sentence]');
            if (previousRender) {
                compound.removeChild(previousRender);
            }

            settings.optimalRatio = optimal;
            renderCompoundSentence(sentence, compound, settings);

            var text = '<?xml version="1.0" encoding="utf-8"?>\n' + compound.querySelector('svg').outerHTML;
            pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            pom.setAttribute('download', filename);
        }

        return compound;
    }

    function init() {
        [].slice.call(document.querySelectorAll('[data-sitelen]')).forEach(function (element) {
            var text = element.textContent,
                structuredSentences = sitelenParser.parse(text);

            element.innerHTML = '';

            var ratio = element.getAttribute('data-sitelen-ratio');

            structuredSentences.forEach(function (structuredSentence) {
                renderCompoundSentence(structuredSentence, element, {optimalRatio: ratio ? ratio : 0.8});
            });
        });
    }

    function renderAsSvgImg(element, callback) {
        var svgData = new XMLSerializer().serializeToString(element);

        var img = document.createElement('img');
        img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(svgData));
        img.setAttribute('data-sitelen-sentence', '');

        img.onload = function () {
            element.parentNode.replaceChild(img, element);
            callback(img);
        };
    }

    function renderAsCssBackground(element, callback) {
        var svgData = new XMLSerializer().serializeToString(element);

        var img = document.createElement('div');
        img.setAttribute('data-sitelen-sentence', '');
        img.style.backgroundImage = 'url(data:image/svg+xml;base64,' + btoa(svgData) + ')';
        element.parentNode.replaceChild(img, element);
    }


    function renderAsPng(element) {
        var svg = element;
        var svgData = new XMLSerializer().serializeToString(svg);
        svgData = svgData.replace('path{stroke-width:2;', 'path{stroke-width:4;');

        var canvas = document.createElement("canvas");
        var svgSize = svg.getBoundingClientRect();
        canvas.width = 2 * svgSize.width;
        canvas.height = 2 * svgSize.height;
        var ctx = canvas.getContext("2d");

        var img = document.createElement("img");
        img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));

        img.onload = function () {
            ctx.drawImage(img, 0, 0);

            var outImg = document.createElement("img");
            outImg.setAttribute('data-sitelen-sentence', '');
            outImg.src = canvas.toDataURL('image/png');
            outImg.style.width = svgSize.width + 'px';
            outImg.style.height = svgSize.height + 'px';
            element.parentNode.replaceChild(outImg, element);
        };
    }

    window.onload = function () {
        init();
    };

    return {
        renderCompoundSentence: renderCompoundSentence,
        renderInteractiveSentence: renderInteractiveSentence
    };
}();