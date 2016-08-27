var bitcoin = require('bitcoin'),
    Transaction = require('../models/transaction'),
    transactionsController = require('../controllers/transactionsController.js'),
    fs = require("fs"),
    check = require('check-types');

var config = JSON.parse(fs.readFileSync('config.cnf', 'utf8'));

var client = new bitcoin.Client(config.connector);

function JSONtoAmount(value) {
    return Math.round(1e8 * value);
}

var binded = [];

function updateBinded() {
    var requested = [];
    var requests = [];
    Transaction.find({
        '_id': { $in: binded}
    }, function(err, bindedTransactions){
        if(err){
            console.log(err);
            return;
        }
        for (var i = bindedTransactions.length - 1; i >= 0; i--) {
            var transaction = bindedTransactions[i];
            requested.push(transaction);
            requests.push({
                method: "getreceivedbyaddress",
                params: [transaction.address, 0]
            });
            requests.push({
                method: "getreceivedbyaddress",
                params: [transaction.address, config.minimumConfirmations]
            });
        }

        var responses = Array.apply(null, new Array(Math.floor(requests.length / 2))).map(function (x, i) {return {};});
        if (requests.length > 0) {
            var callbackCount = 0;
            client.cmd(requests, function (err, response, resHeaders) {
                if(err){
                    console.log("Error connecting to bitcoin daemon: ",err);
                    callbackCount++;
                    return;
                }
                if (response !== undefined) {
                    var transaction = requested[Math.floor(callbackCount / 2)];
                    var isUnconfirmed = callbackCount % 2 == 0;
                    var amount = JSONtoAmount(parseFloat(response));
                    responses[Math.floor(callbackCount / 2)][isUnconfirmed ? "unconfirmed" : "paid"] = amount;
                }
                callbackCount++;

                if (callbackCount === requests.length) {
                    for (var i = 0; i < responses.length; i++) {
                        var transaction = requested[i];
                        var paid = responses[i].paid;
                        var unconfirmed = responses[i].unconfirmed - responses[i].paid;
                        //The amount retrieved by the JSON-RPC is the amount with n or more confirmation,
                        // so the amount unconfirmed is the amount confirmed+unconfirmed
                        if (check.greaterOrEqual(paid, 0) && check.greaterOrEqual(unconfirmed, 0)) {
                            console.log("Amount payed for ", transaction.address, " was ", transaction.paid, ",now is ", paid, ",unconfirmed is ", unconfirmed);
                            transactionsController.updateTransaction(transaction, paid, unconfirmed);
                        }
                    }
                }
            });
        }
    });
}

exports.init = function (callback) {
    console.log("Starting bitcoind connector");
    setInterval(updateBinded, 1000);
    callback();
};

exports.createAddress = function (callback) {
    client.getNewAddress('gateway', function (err, address) {
        callback(err, address);
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


exports.balance = function(req,res){
    client.getBalance("gateway",function(balance){
        res.json({balance:balance});
    });
};

exports.transfer = function(req,res){
     res.status(500).send("Bitcoind connector does not support money transfer.");
};