var socketClient = require('socket.io-client'),
    Transaction = require('../models/transaction'),
    transactionsController = require('../controllers/transactionsController.js'),
    fs = require("fs"),
    check = require('check-types'),
    async = require('async');

var config = JSON.parse(fs.readFileSync('config.cnf', 'utf8'));

var socket = socketClient(config.connector.host+":"+config.connector.port);

socket.on('connect_failed', function(){
    throw new Error("Socket connection failed");
});

socket.on('disconnect', function(){
    throw new Error("Socket connection closed");
});

var binded = [];

var updateAddress = function(transaction,address,callback){
    socket.emit('getReceivedForAddress',{address:address,minConfirmations:0},function(unconfirmed){
        socket.emit('getReceivedForAddress',{address:address,minConfirmations:config.minimumConfirmations},function(paid){
            unconfirmed -= paid; //Since unconfirmed is from 0 to minimumConfirmations, we have to substract
            console.log("Amount payed for ", transaction.address, " was ", transaction.paid, ",now is ", paid, ",unconfirmed is ", unconfirmed);
            transactionsController.updateTransaction(transaction, paid, unconfirmed);
            callback();
        });
    });
};

var updateAllTransactions = function(callback){
    Transaction.find({
        '_id': { $in: binded}
    }, function(err, bindedTransactions){
        if(err){
            console.log(err);
            return;
        }
        async.each(bindedTransactions, function(transaction, callback) {
            var address = transaction.address;
            updateAddress(transaction,address,callback);
        }, callback);
    });
};

socket.on('newBlock',function(){
    console.log("New block received");
    updateAllTransactions(function(err){
       console.log("New block processed");
    });
});

socket.on('transactionReceived',function(address){
    Transaction.find({address: address}, function (err, transactions) {
        if (transactions.length == 1) {
            var transaction = transactions[0];
            console.log("Money received in address: "+address+" with transaction id: "+transaction._id);
            updateAddress(transaction,transaction.address,function(){});
        } 
    });
});

exports.init = function (callback) {
    console.log("Starting socket wallet connector");
    socket.emit('login',{user:config.connector.user,pass:config.connector.pass},function(authed){
        if(authed){
            console.log("Connected to the wallet");
            callback();
        }else{
            throw new Error("Authentication error");
        }
    });
};

exports.createAddress = function (callback) {
    socket.emit('generateAddress', function (address) {
        var err = !address?new Error("Error getting address"):null;
        callback(err, address);
    });
};

exports.bindUpdates = function (transactionId) {
    binded.push(transactionId);
    Transaction.find({_id: transactionId}, function (err, transactions) {
        if (transactions.length == 1) {
            var transaction = transactions[0];
            var address = transaction.address;
            socket.emit('subscribeForAddress',address);
            updateAddress(transaction,address,function(){});
        } else {
            throw new Error("Transaction not found when binding");
        }
    });
};

exports.unbindUpdates = function (transactionId) {
    var index = binded.indexOf(transactionId);
    if (index != -1) {
        binded.splice(index,1);
        Transaction.find({_id: transactionId}, function (err, transactions) {
            if (transactions.length == 1) {
                var transaction = transactions[0];
                var address = transaction.address;
                socket.emit('unsubscribeForAddress',address);
            } else {
                throw new Error("Transaction not found when unbinding");
            }
        });
    } else {
        console.log("Transaction id not found when unbinding");
    }
};

exports.binded = binded;

exports.balance = function(req,res){
    socket.emit("getBalance",function(balance){
        res.json({balance:balance});
    });
};

exports.transfer = function(req,res){
    socket.emit("sendTransaction",{amount:req.body.amount,address:req.body.address},function(achieved, error){
       if(achieved){
           res.sendStatus(200);
       } else{
           res.status(400).send(error);
       }
    });
};