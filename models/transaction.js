var mongoose = require('mongoose');

/* 
 Modelo de datos de transacción
 */
var STATES = {
    AWAITING_PAYMENT: "AWAITING_PAYMENT",
    PAID: "PAID",
    EXPIRED: "EXPIRED"
};

var transactionSchema = mongoose.Schema({
    amount: Number,
    address: String,
    paid: Number,
    unconfirmed: Number,
    state: {type: String, enum: [STATES.AWAITING_PAYMENT, STATES.PAID, STATES.EXPIRED]},
    description: String,
    createdAt: Date
});

var Transaction = mongoose.model('Transaction', transactionSchema);

Transaction.STATES = STATES;

module.exports = Transaction;