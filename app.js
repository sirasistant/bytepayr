var express = require('express'),
    bodyParser = require('body-parser'),
    transactionsController=require('./controllers/transactionsController'),
    path = require('path'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    methodOverride = require('method-override'),
    mongoose = require('mongoose'),
    app = express(),
    http = require('http').Server(app),
    readLine = require('readline'),
    io = require('socket.io').listen(http),
	session = require('express-session');

Array.prototype.findBy = function (item, attr) {
	if (attr === undefined)
		return this.indexOf(item);
	for (var i = 0; i < this.length; i++) {
		if (this[i][attr] === item[attr])
			return i;
	}
	return -1;
};

var config = JSON.parse(fs.readFileSync('config.cnf', 'utf8'));

app.use(session({secret: config.secret}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public')));

var transactions = require('./routes/transactions');
app.use('/api/transactions', transactions);

var admin = require('./routes/admin');
app.use('/api/admin', admin);

mongoose.connect('mongodb://localhost/bytepayr');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {

    transactionsController.init(io,function(){
        http.listen(3000, function () {
          console.log('Gateway listening on port 3000');
        });
    });


});