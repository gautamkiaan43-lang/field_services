const express = require('express');
const router = express.Router();
const publicLinksController = require('./publicLinks.controller');
const { authenticate } = require('../../middlewares/auth');

// Public route to validate a token
router.get('/validate/:token', publicLinksController.validateLink);

// Protected routes for admins/managers to manage links
router.post('/generate', authenticate, publicLinksController.generateLink);

module.exports = router;
