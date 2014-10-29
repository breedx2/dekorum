var getpixels = require("get-pixels");
var fs = require('fs');
var PNG = require('pngjs').PNG;
var autocrop = require('./dekorum-autocrop');
var sstitch = require('./dekorum-sstitch');

function newEmptyPng(){
	var png = new PNG({
		'width': 1280, 'height': 720, filterType: -1
	});
	for(var y = 0; y < 720; y++){
		for(var x = 0; x < 1280; x++){
			var index = 4 * ((1280 * y) + x);
			png.data[index+0] = 200;
			png.data[index+1] = 200;
			png.data[index+2] = 200;
			png.data[index+3] = 255;
		}
	}
	return png;
}

function blit(target, source, sx, sy, tx, ty, width, height){
	console.log("blitting " + width + " x " + height + " from " + sx + "," + sy + " to " + tx + "," + ty);
	for(var y = 0; y < height; y++){
		for(var x = 0; x < width; x++){
			var index = 4 * ((1280 * (y + ty)) + x + tx);
			target[index + 0] = source.get(x + sx, y + sy, 0);
			target[index + 1] = source.get(x + sx, y + sy, 1);
			target[index + 2] = source.get(x + sx, y + sy, 2);
			target[index + 3] = source.get(x + sx, y + sy, 3);
		}
	}
}

// Converts the filename to a 720p PNG
function make720p(filename, callback){
	console.log("Converting to 720p: " + filename);
	getpixels(filename, 'image/jpeg', function(err, pixels){
		if(err){
			console.log("Error loading " + filename + ": " + err);
			callback(err, null);
			return;
		}
		console.log("got pixels", pixels.shape.slice());

		pixels = autocrop.autocrop(pixels, 15);	//consider a more flexible/configurable/dynamic threshold
		console.log("after autocrop", pixels.shape.slice());

		offset = sstitch.sstitch(pixels);
		console.log("Offset stitch is " + offset);

		var sourceWidth = pixels.shape[0];
		var sourceHeight = pixels.shape[1];
		var sourceDepth = pixels.shape[2];	//assumed to be 4bpp

		var png = newEmptyPng();

		var startX = 0;
		var tx = 0;
		var width = Math.min(1280 - tx, sourceWidth); 
		while(tx < 1280){
			var ty = 0;

			var col = tx / sourceWidth;
			var thisOffset = (col == 0) ? 0 : (col * offset[0]) % sourceHeight;

			while(ty < 720){
				var startY = 0;
				var height = sourceHeight;
				if((tx > 0) && (ty == 0)){
					height = sourceHeight - thisOffset;
					startY = thisOffset;
				}
				if(ty + height > 720){
					height = 720 - ty;
				}
				if(tx + width > 1280){
					width = 1280 - tx;
				}
				blit(png.data, pixels, startX, startY, tx, ty, width, height);
				ty += height;
			}
			tx += sourceWidth;
		}
		callback(null, png.pack());
	});
}

module.exports = {
    make720p: make720p 
};
