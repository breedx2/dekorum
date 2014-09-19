var express = require('express');
var fs = require('fs');
var url = require('url');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var program = require('commander');

request = request.defaults({jar: true});

START_URL = 'http://www.swdecorating.com';

function findWallpapersAndBorders(callback) {
    var linkText = "Wallpaper & Borders";
    console.log("Finding link: " + linkText);
    request(START_URL, function (error, response, html) {
        if (error) {
            console.log("ERROR: " + error);
            return;
        }
        var $ = cheerio.load(html);
        var link = $('a').filter(function (index) {
            return $(this).text() == linkText;
        }).first();
        callback(link.attr('href'));
    });
}

function findFirstLineStartingWith(bigDoc, target) {
    var lines = bigDoc.split("\n");
    return lines.filter(function (line) {
        return line.slice(0, target.length) == target;
    })[0];
}

function getColors(html) {
    console.log("Finding colors...");
    var cwptxtRaw = findFirstLineStartingWith(html, "var cwptxt");
    eval(cwptxtRaw);
    var cwpidRaw = findFirstLineStartingWith(html, "var cwpids");
    eval(cwpidRaw);
    var result = {};
    for (i = 0; i < cwptxt.length; i++) {
        result[cwptxt[i]] = cwpids[i];
    }
    return result;
}

function buildSubmitColorForm($, colorName, colorId) {
    var form = $("form[name='coveringSearch']");
    var result = {};
    form.find('input, fieldset input, fieldset select').each(function (index, element) {
        var name = $(this).attr('name');
        var value = $(this).attr('value');
        if (value != null) {
            result[name] = value;
        }
    });
    result['radsearchtype'] = 'wallpapers';
    result['color'] = colorId;
    result['colorname'] = colorName;
    result['coveringsearch.x'] = 1;        //PFM, snarfed from the SW js
    return result;
}

function queryStringFromObj(obj){
    var result = "";
    for(var name in obj){
        if(result.length > 0){
            result += "&";
        }
        result += name + "=" + encodeURIComponent(obj[name]);
    }
    return "?" + result;
}

function grabPageInfoFromSearchResults($){
    try {
//        var pageInfo = $.root().find("td.textbold[align='center']").filter(function (index, elem) {
//            return $(this).text().match(/Page \d+ of \d+/);
//        }).first().text().trim().split("\n").filter(function (x) {
//            var testx = (x.indexOf("Page") > -1);
//            console.log("DEBUG: chickin? " + testx);
//            return x.indexOf("Page") > -1;
//        })[0].replace(/\r/g, "").replace(/.*Page (\d+) of (\d+).*/m, "$1,$2").split(',');
        var pageInfo = $.root().find("td.textbold[align='center']").filter(function (index, elem) {
            return $(this).text().match(/Page \d+ of \d+/);
        }).first().text().replace(/(.|[\r?\n])*Page (\d+) of (\d+)(.|[\r?\n])*/m, "$2,$3").split(',');
        return {'current': pageInfo[0].trim(), 'total': pageInfo[1].trim()};
    }
    catch(err){
        console.log(err);
        $.root().find("td.textbold[align='center']").each(function(i, e){
           console.log("MATCH THO");
            console.log($(this).text());
        });
//        console.log($.root().html());
    }
}

function doSearchColor(colorName, colorId, html, wallpapersAndBordersUrl){
    console.log("Submitting form for color: " + colorName + " (id=" + colorId + ")");

    var $ = cheerio.load(html);
    var formData = buildSubmitColorForm($, colorName, colorId);
    var queryString = queryStringFromObj(formData);

    var form = $("form[name='coveringSearch']");
    var actionUri = form.attr('action');
    actionUri = url.resolve(wallpapersAndBordersUrl, actionUri);
    actionUri += queryString;

    console.log("Here we submit to " + actionUri + " ... ");

    request(actionUri, buildSearchResultsProcessor(colorName, colorId, actionUri));
}

function filterKeys(obj, keySubstring){
    var result = {};
    for(var key in obj){
        if(key.toLowerCase().indexOf(keySubstring) > -1){
            result[key] = obj[key];
        }
    }
    return result;
}

function buildSearchResultsProcessor(colorName, colorId, actionUri){
    return function (err, resp, html) {
        if (err) {
            console.log("ERROR: " + err);
        }
        console.log("Processing search results...");
        var $ = cheerio.load(html);
        var pageInfo = grabPageInfoFromSearchResults($);
        console.log("Working on page " + pageInfo['current'] + " of " + pageInfo['total'] + " for color = " + colorName);

        $.root().find("a[onmouseover=\"window.status='View Pattern Details';return true;\"]").each(function(i, elem){
            var srcbit = $(this).find('img').first().attr('src').split('&')
                .filter(function(x){ return x.slice(0,3) == "src"})[0];
            var filename = srcbit.slice(4,srcbit.length);
            //TODO: Don't hard code path, traverse and find it...
            console.log("http://sherwin.scene7.com/is/image/sw/" + filename);
        });

        if(pageInfo['current'] == pageInfo['total']) {       //more pages remaining...
            console.log("No more pages for color = " + colorName);
        }
        else{
            //Next page...
            var nextPageUrl = $.root().find("img[alt='Next Page »']").first().parent().attr('href');
            nextPageUrl = url.resolve(actionUri, nextPageUrl);
            console.log("Next page: " + nextPageUrl);

            request(nextPageUrl, buildSearchResultsProcessor(colorName, colorId, nextPageUrl));
        }
    };
}

function scrape() {
    findWallpapersAndBorders(function (wallpapersAndBordersUrl) {
        if (wallpapersAndBordersUrl.slice(0, 4) != "http") {
            wallpapersAndBordersUrl = START_URL + "/" + wallpapersAndBordersUrl;
        }
        console.log("Navigating to " + wallpapersAndBordersUrl);
        request(wallpapersAndBordersUrl, function (error, response, html) {

            var colors = getColors(html);
            console.log(colors);
            if(program.color){
                console.log("Filtering colors based on commandline...");
                colors = filterKeys(colors, program.color);
            }
            console.log(colors);

            for (var colorName in colors) {
                var colorId = colors[colorName];
                doSearchColor(colorName, colorId, html, wallpapersAndBordersUrl);
                break;
            }
        });
    });
}

//app.get('/scrape', scrape);
//app.listen('8081');
//console.log('Magic happens on port 8081');


program.version('0.0.1')
    .option('-c, --color <color>', 'Just do colors matching <color>')
    .parse(process.argv);

console.log("Color is " + program.color);

scrape();

exports = module.exports = app;