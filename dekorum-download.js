var fs = require('fs');
var url = require('url');

function readAllFiles(indir) {
    var filenames = fs.readdirSync(indir);
    var allFileUrls = filenames.filter(function (filename) {
        return filename.match(/\.txt$/);
    }).map(function (filename) {
        var fullFilename = decodeURIComponent(url.resolve(indir + "/", filename));
        var content = fs.readFileSync(fullFilename, {"encoding": "UTF-8"});
        var urls = content.split("\n").filter(function (x) {
            return x.length != 0;
        });
        console.log("Loaded " + urls.length + " urls from " + fullFilename);
        return urls;
    });
    var bigList = [].concat.apply([], allFileUrls); //pfm flatmap
    console.log("Returning " + bigList.length);
    return bigList;
}

function download(indir, outdir) {
    console.log("Reading content from all .txt files in " + indir);
    var allUrls = readAllFiles(indir);
    console.log("Loaded " + allUrls.length + " urls from " + indir);
    console.log("Finding unique and sorting...");
    var uniqueUrls = allUrls.sort().filter(function (item, pos) {
        return (pos == 0) || (item != allUrls[pos - 1]);
    });
    console.log("Filtered down to " + uniqueUrls.length + " unique urls");
}

module.exports = {
    download: download
};