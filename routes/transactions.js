var express = require('express'),
	transactionsController=require('../controllers/transactionsController'),
	authController=require('../controllers/authController'),
	router = express.Router();

router.post('/create',authController.checkUsernameAndPass, transactionsController.create);

router.post('/:id/cancel',authController.checkUsernameAndPass, transactionsController.cancel);

router.delete('/:id',authController.checkUsernameAndPass, transactionsController.delete);

router.get('/:id', transactionsController.show);

module.exports = router;