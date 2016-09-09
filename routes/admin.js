var express = require('express'),
    transactionsController=require('../controllers/transactionsController'),
    walletConnector = require('../connectors/socketWalletConnector'),
    authController=require('../controllers/authController'),
    router = express.Router(),
    bruteforce = require("../bruteforce.js");

router.get('/login',bruteforce.prevent,authController.hasCookie);

router.post('/login',bruteforce.prevent,authController.setCookie);

router.delete('/login',authController.deleteCookie);

router.get('/transactions',bruteforce.prevent,authController.checkCookie,transactionsController.list);

router.get('/balance',bruteforce.prevent,authController.checkCookie,walletConnector.balance);

router.post('/transfer',bruteforce.prevent,authController.checkCookie,walletConnector.transfer);

module.exports = router;