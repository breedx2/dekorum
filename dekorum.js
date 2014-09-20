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
    var result = [];
    for (i = 0; i < cwptxt.length; i++) {
        result.push({"name": cwptxt[i], "id": cwpids[i]});
    }
    return result;
}

function buildColorForm($, color) {
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
    result['color'] = color['id'];
    result['colorname'] = color['name'];
    result['coveringsearch.x'] = 1;        //PFM, snarfed from the SW js
    return result;
}

function queryStringFromObj(obj) {
    var result = "";
    for (var name in obj) {
        if (result.length > 0) {
            result += "&";
        }
        result += name + "=" + encodeURIComponent(obj[name]);
    }
    return "?" + result;
}

function grabPageInfoFromSearchResults($) {
    try {
        var pageInfo = $.root().find("td.textbold[align='center']").filter(function (index, elem) {
            return $(this).text().match(/Page \d+ of \d+/);
        }).first().text().replace(/(.|[\r?\n])*Page (\d+) of (\d+)(.|[\r?\n])*/m, "$2,$3").split(',');
        return {'current': pageInfo[0].trim(), 'total': pageInfo[1].trim()};
    }
    catch(err){
        console.log("Error finding page number info")
        console.log(e);
        console.log("First blood: ");
        console.log($.root().find("td.textbold[align='center']").filter(function (index, elem) {
            return $(this).text().match(/Page \d+ of \d+/);
        }).first().text());
    }
}

function buildFilename(colorName) {
    return colorName.replace(/[/() ]/g, "_").toLowerCase() + ".urls.txt";
}

function openOutputFile(color){
    var filename = buildFilename(color['name']);
    var fd = fs.openSync(filename, "wx");
    console.log("Opened output file: " + filename);
    return fd;
}

function searchColors(colors, context) {

    if (!colors.length) {
        console.log("No more colors.  All done scraping!");
        return;
    }

    var color = colors.pop();
    searchColor(color, colors, context);
}

function searchColor(color, colors, context) {

    var $ = context['$'];

    var fd = openOutputFile(color);

    console.log("Submitting form for color: " + color['name'] + " (id=" + color['id'] + ")");

    var form = $("form[name='coveringSearch']");
    var actionUri = form.attr('action');
    actionUri = url.resolve(context['referer'], actionUri);
    var formData = buildColorForm($, color);
    actionUri += queryStringFromObj(formData);

    console.log("Here we submit to " + actionUri + " ... ");

    request(actionUri, buildSearchResultsProcessor(color, colors, actionUri, fd, context));
}

function buildSearchResultsProcessor(color, colors, actionUri, fd, context) {
    return function (err, resp, html) {
        if (err) {
            console.log("ERROR: " + err);
        }
        console.log("Processing search results...");
        var $ = cheerio.load(html);
        var pageInfo = grabPageInfoFromSearchResults($);
        console.log("Working on page " + pageInfo['current'] + " of " + pageInfo['total'] + " for color = " + color['name']);

        $.root().find("a[onmouseover=\"window.status='View Pattern Details';return true;\"]").each(function (i, elem) {
            var srcbit = $(this).find('img').first().attr('src').split('&')
                .filter(function (x) {
                    return x.slice(0, 3) == "src"
                })[0];
            var filename = srcbit.slice(4, srcbit.length);
            //TODO: Don't hard code path, traverse and find it...
            var imageUrl = "http://sherwin.scene7.com/is/image/sw/" + filename;
            console.log(imageUrl);
            fs.writeSync(fd, imageUrl + "\n");
        });

        if (pageInfo['current'] == pageInfo['total']) {       //no more pages remaining...
            console.log("No more pages for color = " + color['name']);
            fs.closeSync(fd);
            console.log("Closed output file: " + buildFilename(color['name']));
            setImmediate(function(){ searchColors(colors, context) });
        }
        else {
            //Next page...
            var nextPageUrl = $.root().find("img[alt='Next Page »']").first().parent().attr('href');
            nextPageUrl = url.resolve(actionUri, nextPageUrl);
            console.log("Next page: " + nextPageUrl);

            request(nextPageUrl, buildSearchResultsProcessor(color, colors, nextPageUrl, fd, context));
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
            if (program.color) {
                console.log("Filtering colors based on commandline...");
                colors = colors.filter(function (color) {
                    return color['name'].toLowerCase().indexOf(program.color) > -1;
                });
            }
            console.log(colors);

            var $ = cheerio.load(html);

            searchColors(colors, {'$': $, 'referer': wallpapersAndBordersUrl});
        });
    });
}

program.version('0.0.1')
    .option('-c, --color <color>', 'Just do colors matching <color>')
    .parse(process.argv);

if (program.color) {
    console.log("Limiting scrape to just " + program.color);
}

scrape();

exports = module.exports = app;