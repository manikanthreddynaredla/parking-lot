const express = require('express');
const router = express.Router();
const { loginUser,checkin, checkout } = require('../controllers/authcontroller');

router.post('/login', loginUser);
router.post('/checkin', checkin);
router.post('/checkout', checkout);

module.exports = router;
