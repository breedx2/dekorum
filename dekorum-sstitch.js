
function rgbDelta(p1, p2){
	//console.log("Diffing " + p1.get(0) + "," + p1.get(1) + "," + p1.get(2) + " with " + 
	//	p2.get(0) + "," + p2.get(1) + "," + p2.get(2));
	return Math.abs(p1.get(0)-p2.get(0)) + Math.abs(p1.get(1)-p2.get(1)) + Math.abs(p1.get(2)-p2.get(2));
}

function colDelta(c1, c2, offset){
	var result = 0;
	for(var i=0; i < c1.shape[0]; i++){
		var p1 = c1.pick(i, null);
		var p2 = c2.pick((i + offset) % c1.shape[0], null);
		result += rgbDelta(p1, p2);
	}
	return result;
}

function findLowestDeltaSeam(col1, col2){
	var result = Number.MAX_VALUE;
	var resultIndex = -1;
	for(var i=0; i < col1.shape[0]; i++){
		var delta = colDelta(col1, col2, i);
		console.log("Col delta (" + i + "): " + delta);
		if(delta < result){
			result = delta;
			resultIndex = i;
		}
	}
	console.log("LOWEST is " + result + " at index " + resultIndex);
	return result;
}

function sstitch(pixels){
	console.log("stitching " + pixels.shape[0] + " by " + pixels.shape[1]);
	var rightCol = pixels.pick(pixels.shape[0] - 1, null, null);
	var leftCol = pixels.pick(0, null, null);
	console.log("DEBUG rightcol: " + rightCol.shape[0] + " by " + rightCol.shape[1]);
	console.log("DEBUG leftcol: " + leftCol.shape[0] + " by " + leftCol.shape[1]);
	findLowestDeltaSeam(rightCol, leftCol);
	return pixels;
}

module.exports = {
    sstitch: sstitch
};
