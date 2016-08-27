var check = require('check-types'),
fs = require('fs');

var config = JSON.parse(fs.readFileSync('config.cnf', 'utf8'));

exports.checkUsernameAndPass = function(req,res,next){
	if(check.nonEmptyString(req.body.username) && check.nonEmptyString(req.body.password)){
		var username = req.body.username;
		var password = req.body.password;
		if(username===config.username && password === config.password){
			next();
		}else{
			res.status(403).send("Not authorized");
		}
	}else{
		res.status(403).send("Not authorized");
	}
};


exports.hasCookie = function(req,res){
	res.send(req.session.loggedIn);
};

exports.setCookie = function(req,res){
	if(check.nonEmptyString(req.body.username) && check.nonEmptyString(req.body.password)){
		var username = req.body.username;
		var password = req.body.password;
		if(username===config.username && password === config.password){
			req.session.loggedIn = true;
			res.send("Success");
		}else{
			res.status(403).send("Not authorized");
		}
	}else{
		res.status(403).send("Not authorized");
	}
};

exports.deleteCookie = function(req,res){
	req.session.loggedIn = false;
	res.send("Success");
};

exports.checkCookie = function (req, res, next) {
	if(req.session.loggedIn)
		next();
	else
		res.status(403).send("Not logged in");
};