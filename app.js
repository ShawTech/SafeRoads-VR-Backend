var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var cmd = require('node-cmd');


var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
const port = process.env.PORT || 3456;



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);


// Get panorama of streetview.
app.get('/streetview/panorama', function(req, res) {
	console.log(req.query);
	var lat = req.query.lat;
	var lng = req.query.lng;

	if (lat === undefined || lng === undefined) {
		return res.status(410).json({'path': '', 'created': false, 'error': 'lat lang undefined'});
	}

	var fileName = 'public/images/' + lat + lng + '.png';

	if (fs.existsSync(fileName)) {
			return res.status(200).json({'path': fileName, 'created': 'cached', 'error': false});
	}
	var runThis = 'extract-streetview ' + lat + ',' + lng + ' -z 4 > ' + fileName;
	cmd.get(runThis,
		function(err, data, stderr) {
			console.log('Done ' + runThis);

			if (err) {
				fs.unlink(fileName, function(error) {
					if (error) {
						console.log(error);
					}
				});
				return res.status(410).json({'path': '', 'created': false, 'error': 'Could not decode lat lang'});
			}

			const fileSizeInMb = fs.statSync(fileName).size / 1000000.0;
			console.log('file size: ' + fileSizeInMb);
			if (fileSizeInMb < 1.5) {
				fs.unlink(fileName, function(error) {
					if (error) {
						console.log(error);
					}
				});
				return res.status(410).json({'path': '', 'created': false, 'error': 'Invalid panorama for lat ' + lat + ', long ' + lng});
			}

			return res.status(200).json({'path': fileName, 'created': true, 'error': false});
		}
	);

});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, () => {
	console.log("Server running on port " + port);
});