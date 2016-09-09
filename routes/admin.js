var express = require('express'),
    transactionsController=require('../controllers/transactionsController'),
    walletConnector = require('../connectors/socketWalletConnector'),
    authController=require('../controllers/authController'),
    router = express.Router(),
    bruteforce = require("../bruteforce.js");

router.get('/login',authController.hasCookie);

router.post('/login',bruteforce.prevent,authController.setCookie);

router.delete('/login',authController.deleteCookie);

router.get('/transactions',authController.checkCookie,transactionsController.list);

router.get('/balance',authController.checkCookie,walletConnector.balance);

router.post('/transfer',authController.checkCookie,walletConnector.transfer);

module.exports = router;