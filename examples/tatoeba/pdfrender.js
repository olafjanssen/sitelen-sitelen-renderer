"use strict";
var page = require('webpage').create();
page.open('http://localhost:8080/examples/tatoeba/tatoeba-book.html', function(status) {
    console.log("Status: " + status);
    if(status === "success") {
        page.render('example.png');
    }
    phantom.exit();
});
