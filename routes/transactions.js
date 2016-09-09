var express = require('express'),
	transactionsController=require('../controllers/transactionsController'),
	authController=require('../controllers/authController'),
	router = express.Router(),
	bruteforce = require("../bruteforce.js");

router.post('/create',bruteforce.prevent,authController.checkUsernameAndPass, transactionsController.create);

router.post('/:id/cancel',bruteforce.prevent,authController.checkUsernameAndPass, transactionsController.cancel);

router.delete('/:id',bruteforce.prevent,authController.checkUsernameAndPass, transactionsController.delete);

router.get('/:id', transactionsController.show);

module.exports = router;