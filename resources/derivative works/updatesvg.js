/**
 * Created by olafjanssen on 08/01/16.
 */
var fs = require("fs");
var glob = require('glob');

// renaming wronly named files
//var files = glob.sync('../../images/glyphs/*tp-wg-pre-.svg');
//files.forEach(function (file) {
//    var token = file.substring(20, file.length - 14);
//    fs.renameSync(file, '../../images/glyphs/tp-wg-pre-' + token + '.svg');
//    console.log(token);
//});

var files = glob.sync('../../images/glyphs/tp-c-pre-tan*.svg');
//  var files = glob.sync('../../images/sylgl/tp-syl-*.svg');
files.forEach(function (filename) {
    var token = filename.substring(29);
    console.log(token);

    var buf = fs.readFileSync(filename, "utf8");

    var DOMParser = require('xmldom').DOMParser;
    var doc = new DOMParser().parseFromString(buf, 'image/svg+xml');

    var svg = doc.documentElement;

    var viewBoxValues = svg.attributes[5].nodeValue.split(' ');

    var strokeWidth = 2;
    var newViewBoxValues = [parseFloat(viewBoxValues[0]) - strokeWidth, parseFloat(viewBoxValues[1]) - strokeWidth,
        parseFloat(viewBoxValues[2]) + strokeWidth * 2, parseFloat(viewBoxValues[3]) + strokeWidth * 2].join(' ');

    svg.attributes[5].nodeValue = newViewBoxValues;
    svg.attributes[5].value = newViewBoxValues;
    svg.setAttribute('preserveAspectRatio','none');

    var style = doc.createElement('style');
    style.textContent = 'ellipse, polygon, polyline, rect, circle, line, path { stroke-width: 2; vector-effect: non-scaling-stroke;}';

    svg.appendChild(style);

    var svgolib = require('svgo'),
        svgo = new svgolib();

    svgo.optimize(doc.toString(), function (result) {
        "use strict";
        fs.writeFileSync('../../images/glyphs/tp-c-' + token, result.data);
    });

});


