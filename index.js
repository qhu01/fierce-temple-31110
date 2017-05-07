var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // Required if we need to use HTTP post parameters
var validator = require('validator'); 
var mongoUri = process.env.MONGODB_URI || process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://heroku_spn0hn8s:pmvrom8ml2gn8shokigd1ouk92@ds157390.mlab.com:57390/heroku_spn0hn8s';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

var vhc = ['JANET','ilFrXqLz', 't4wcLoCT', 'WnVPdTjF', '1fH5MXna', '4aTtB30R', '8CXROgIF', 'w8XMS577', 'ZywrOTLJ', 'cQRzspF5', 'GSXHB9L1', 'TztAkR2g', 'aSOqNo4S', 'ImjNJW4n', 'svEQIneI', 'N10SCqi5', 'QQjjwwH2', 'H0pfmYGr', 'FyUHoAvS', 'bgULOMsX', 'OlOBzZF8', 'Ln7b7ODx', 'ZoxN11Sa', 'itShXf78', 'o6kJKzyI', 'pD0kGOax', 'njr1i7xM', 'wtDRzig8', 'l2r8bViT', 'oZn3b2OZ', 'ym2J1vil'];

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
	db.collection('passengers', function(error,coll){
		if (error){
			console.log("something is wrong in GET/");
			console.log(error);
		}
		else {
			coll.find().sort({created_at: -1}).toArray(function(err, docs){
				//response.send(docs);
				var indexPage = '';
				if (!err) {
					indexPage += "<!DOCTYPE HTML><html><head><title>NotUber</title></head><body><h1>Who are waiting for the car?</h1>";
					for (var count = 0; count < docs.length; count++) {
						indexPage += "<p>" + docs[count].username + " requested a vehicle at " + docs[count].lat + ", " + docs[count].lng + " on " + docs[count].created_at + ".</p>";
					}
					indexPage += "</body></html>"
					response.send(indexPage);
				} 
				else {
					response.send('<!DOCTYPE HTML><html><head><title>What Did You Feed Me?</title></head><body><h1>Whoops, something went terribly wrong!</h1></body></html>');
				}
			})
		};
	});
});

app.get('/vehicle.json', function(request, response) {
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "X-Requested-With");

	var username = request.query.username; 

	if (username && vhc.includes(username)){
		db.collection('vehicles', function(error, coll){
			coll.find({'username': username}).toArray(function(error, returned){
				if (returned.length == 0){
					response.send({});
				}
				else {
					response.send(returned[0]);
				}
			});
		});
	}
	else {
		response.send('{}');
	}
});

app.post('/submit', function(request, response) {
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "X-Requested-With");
	var username = request.body.username; 
	var lat = request.body.lat; 
	var lng = request.body.lng; 
	var toInsert = {
			"username": username, 
			"lat": lat, 
			"lng": lng,
			"created_at": new Date(),
		}
	if (vhc.includes(username)){
		db.collection('vehicles', function(error, coll){
			if (error || username == null || lat == null || lng == null){
				response.send('{"error":"Whoops, something is wrong with your data!"}');
			}
			else {
				coll.remove({'username':username}, function(error, removed){
					coll.insert(toInsert, function(error, saved){
						db.collection('passengers', function(error,coll){
							coll.find({created_at: {$gt: new Date(new Date().getTime() - 1000*60*5)}}).toArray(function(error, returned){
								response.send({"passengers":returned});
							});
						});
					});
				})
			}
		})
	}
	else {
		db.collection('passengers',function(error, coll){
				if (error || username == null || lat == null || lng == null){
					response.send('{"error":"Whoops, something is wrong with your data!"}');
				}
				else {
					coll.remove({'username':username}, function(error, removed){
						coll.insert(toInsert, function(error, saved){
							db.collection('vehicles', function(error,coll){
								coll.find({created_at: {$gt: new Date(new Date().getTime() - 1000*60*5)}}).toArray(function(error, returned){
									response.send({"vehicles":returned});
								});
							}); 
						})
					})
				}
			})
		
	}
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

