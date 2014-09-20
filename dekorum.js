var express = require('express');
var app = express();
var program = require('commander');

var scrape = require('./dekorum-scrape');

program.version('0.0.1')
    .option('-c, --color <color>', 'Just do colors matching <color>')
    .parse(process.argv);

if (program.color) {
    console.log("Limiting scrape to just " + program.color);
}

scrape.scrape(program.color);

exports = module.exports = app;