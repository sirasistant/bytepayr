var walletConnector = require('../connectors/socketWalletConnector'),
    check = require('check-types'),
    Transaction = require('../models/transaction'),
    moment = require('moment');

var io;

var subscriptions = {};

exports.create = function (req, res) {
    var amount = req.body.amount;
    var description = req.body.description;
    if (check.greater(amount, 0) && check.string(description)) {
        walletConnector.createAddress(function (err, address) {
            if (err) {
                console.error(err);
                res.status(500).send("Failed to create address");
            }
            if (check.nonEmptyString(address)) {
                var transaction = new Transaction({
                    amount: amount,
                    address: address,
                    description: description,
                    paid: 0,
                    unconfirmed: 0,
                    state: Transaction.STATES.AWAITING_PAYMENT,
                    createdAt: new Date()
                });
                transaction.save(function (err) {
                    if (err)
                        return console.error(err);
                    console.log("Creating transaction, amount: ", amount, "satoshi, address: ", address);
                    walletConnector.bindUpdates(transaction._id.toString());
                    res.status(200).json(transaction);
                });
            } else {
                res.status(500).send("Failed to create address");
            }
        });
    } else {
        res.status(400).send("Bad format");
    }
};

exports.delete = function (req, res) {
    var id = req.params.id;
    if (check.string(id)) {
        Transaction.find({_id: id}, function (err, transactions) {
            if (transactions.length == 1) {
                var transaction = transactions[0];
                transaction.remove(function (err) {
                    if (err)
                        res.status(500).send("Error deleting");
                    else
                        res.status(200).send("Success");
                });
            } else {
                res.status(404).send("Transaction not found");
            }
        });
    } else {
        res.status(400).send("Bad format");
    }
};

exports.cancel = function (req, res) {
    var id = req.params.id;
    if (check.string(id)) {
        Transaction.find({_id: id}, function (err, transactions) {
            if (transactions.length == 1) {
                var transaction = transactions[0];
                transaction.state = Transaction.STATES.EXPIRED;
                transaction.save(function (err) {
                    if (err) {
                        console.log("Error saving transaction: ", transaction._id);
                        return;
                    }
                    walletConnector.unbindUpdates(id);
                    res.status(200).json(transaction);
                });

            } else {
                res.status(404).send("Transaction not found");
            }
        });
    } else {
        res.status(400).send("Bad format");
    }
};

exports.show = function (req, res) {
    var id = req.params.id;
    if (check.string(id)) {
        Transaction.find({_id: id}, function (err, transactions) {
            if (transactions.length == 1) {
                var transaction = transactions[0];
                res.status(200).json(transaction);
            } else {
                res.status(404).send("Transaction not found");
            }
        });
    } else {
        res.status(400).send("Bad format");
    }
};

exports.updateTransaction = function (transaction, paid, unconfirmed) {
    var transactionId = transaction._id;
    if ((transaction.paid != paid || transaction.unconfirmed != unconfirmed)) {
        transaction.paid = paid;
        transaction.unconfirmed = unconfirmed;
        if (transaction.paid >= transaction.amount && transaction.state === Transaction.STATES.AWAITING_PAYMENT) {
            console.log("Transaction ", transaction._id, " has been paid");
            transaction.state = Transaction.STATES.PAID;
            walletConnector.unbindUpdates(transaction._id.toString());
        }
        transaction.save(function (err) {
            if (err) {
                console.log("Error saving transaction: ", transaction._id);
                return;
            }

            if (subscriptions[transactionId]) {
                for (var i = 0; i < subscriptions[transactionId].length; i++) {
                    var socket = subscriptions[transactionId][i];
                    exports.sendStatusToSubscriber(transaction._id, socket);
                }
            }
        });
    }
};

exports.sendStatusToSubscriber = function (transactionId, socket) {
    Transaction.find({_id: transactionId}, function (err, transactions) {
        if (transactions && transactions.length == 1) {
            var transaction = transactions[0];
            socket.emit("transactionUpdate", transaction);
        } else {
            console.log("Transaction ", transactionId, " not found when updating");
        }
    });
};

exports.list = function(req,res){
    Transaction.find({}, function (err, transactions) {
        var objects = transactions.map(function(transaction){
            return transaction.toObject();
        });
        res.json(transactions)
    });
};

exports.init = function (socketIo,callback) {
    console.log("Starting transactions controller");

    if(socketIo){
        io = socketIo;

        io.on('connection', function (socket) {
            socket.on('subscribe', function (msg) {
                var transactionId = msg.transaction;
                if (check.string(transactionId)) {
                    if (!subscriptions[transactionId]) {
                        subscriptions[transactionId] = [];
                    }
                    subscriptions[transactionId].push(socket);
                    exports.sendStatusToSubscriber(transactionId, socket);
                }
            });

            socket.on('unsubscribe', function (msg) {
                var transactionId = msg.transaction;
                if (check.string(transactionId) && subscriptions[transactionId]) {
                    var index = subscriptions[transactionId].indexOf(socket);
                    if (index != -1) {
                        subscriptions[transactionId].splice(index, 1);
                    }
                    if (subscriptions[transactionId].length == 0) {
                        subscriptions[transactionId] = undefined;
                    }
                }
            });

            socket.on('disconnect', function () {
                    for (var transactionId in subscriptions) {
                        if (subscriptions[transactionId] !== undefined) {
                            var index = subscriptions[transactionId].indexOf(socket);
                            if (index != -1) {
                                subscriptions[transactionId].splice(index, 1);
                                if (subscriptions[transactionId].length == 0) {
                                    subscriptions[transactionId] = undefined;
                                }
                            }
                        }
                    }
                }
            );
        });
    }
    walletConnector.init(function(){
        Transaction.find({state: Transaction.STATES.AWAITING_PAYMENT}, function (err, transactions) {
            console.log("Unpaid transactions: ", transactions.map(function (obj) {
                return obj._id
            }));
            for (var i = transactions.length - 1; i >= 0; i--) {
                var transaction = transactions[i];
                walletConnector.bindUpdates(transaction._id.toString());
            }
            callback();
        });
        
    });
};


