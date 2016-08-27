var bitcoin = require('bitcoin'),
    Transaction = require('../models/transaction'),
    transactionsController = require('../controllers/transactionsController.js'),
    fs = require("fs"),
    check = require('check-types'),
    request = require('request'),
    async = require('async');

var config = JSON.parse(fs.readFileSync('config.cnf', 'utf8'));

var performRequest = function(method,queryString,callback){
    queryString.password = config.connector.pass;
    queryString.api_code = config.connector.api_code;
    request({url:"http://"+config.connector.host+":"+config.connector.port+"/merchant/"+config.connector.user+"/"+method, qs:queryString},
        function(err, response, body) {
        callback(err,response,body);
    });
};

function JSONtoAmount(value) {
    return Math.round(1e8 * value);
}

var binded = [];

function updateBinded() {
    Transaction.find({
        '_id': { $in: binded}
    }, function(err, bindedTransactions){
        if(err){
            console.log(err);
            return;
        }

        var requested = [];
        var requests = [];

        async.each(bindedTransactions, function(transaction, callback) {
            performRequest("address_balance",{address:"",confirmations:0},function(err,response,body){
                if(err){
                    callback(err);
                }
                var unconfirmed = body.balance;
                performRequest("address_balance",{address:"",confirmations:config.minimumConfirmations},function(err,response,body) {
                    var paid = body.balance;

                    if (check.greaterOrEqual(paid, 0) && check.greaterOrEqual(unconfirmed, 0)) {
                        console.log("Amount payed for ", transaction.address, " was ", transaction.paid, ",now is ", paid, ",unconfirmed is ", unconfirmed);
                        transactionsController.updateTransaction(transaction, paid, unconfirmed);
                    }

                    callback(err);
                });
            });
        },  function(err){
            // if any of the file processing produced an error, err would equal that error
            if(err) {
                // One of the iterations produced an error.
                // All processing will now stop.
                console.log('A request failed to process');
            }
        });
    });
}

exports.init = function () {
    console.log("Starting blockchain connector");
    setInterval(updateBinded, 1000);
};

exports.createAddress = function (callback) {
    performRequest("new_address",{},function(err,response,body){
        console.log("body:",body);
        callback(err, body.address);
    });
};

exports.bindUpdates = function (transactionId) {
    binded.push(transactionId);
};

exports.unbindUpdates = function (transactionId) {
    var index = binded.indexOf(transactionId);
    if (index != -1) {
        binded.splice(index,1);
    } else {
        console.log("Transaction not found when unbinding");
    }
};

exports.binded = binded;
