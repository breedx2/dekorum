var fs = require('fs');
var url = require('url');
var request = require('request');

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

function filenameFromUrl(outdir, webUrl){
    var filename = url.parse(webUrl).pathname.split('/').slice(-1).toString();
    return url.resolve(outdir + "/", filename);
}

function fileExists(outdir, webUrl){
    var filename = filenameFromUrl(outdir, webUrl);
    return fs.existsSync(filename);
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
    console.log("Checking to see which have already been downloaded....");

    var neededUrls = uniqueUrls.filter(function(webUrl){
        var exists = fileExists(outdir, webUrl);
        if(exists){
            console.log("Skipping " + webUrl + " (exists)");
        }
        return !exists;
    });

    function downloadUrls(urls){
        if(urls.length == 0){
            console.log("No more urls to fetch!  Wow.  All done.");
            return;
        }

        var currentUrl = urls.pop();
        var outputFilename = filenameFromUrl(outdir, currentUrl);

        function completeHandler(err, resp, html){
            if(err){
                console.log("Failed to download " + currentUrl);
                console.log(err);
                if(fs.existsSync(outputFilename)){
                    fs.unlinkSync(outputFilename);
                    console.log("Removed partial/broken file: " + outputFilename);
                }
                urls.push(currentUrl);
                console.log("Waiting 5 seconds and trying again...");
                setTimeout(function(){ downloadUrls(urls);}, 5000);
                return;
            }
            console.log("Download complete!");
            setTimeout(function(){ downloadUrls(urls);}, 2500);
        }

        console.log("Fetching " + currentUrl + " ... ");
        request(currentUrl, completeHandler).pipe(fs.createWriteStream(outputFilename));
    }

    downloadUrls(neededUrls);
}

module.exports = {
    download: download
};