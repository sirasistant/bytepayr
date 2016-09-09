var ExpressBrute = require('express-brute');

var store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
module.exports = new ExpressBrute(store);