var express = require('express');

exports = module.exports

module.exports = {
    explore: explore,
};

function explore(dir){
	var app = express();
	app.engine('jade', require('jade').__express);
	app.use(express.static('static'));
	app.get('/', function(req, res){
		res.render('explore.jade', { names: ['foo', 'bar', 'baz']});
	});

	var server = app.listen(8155, function() {
		console.log('Listening on port %d', server.address().port);
	});
}
