const express = require('express');
const router = express.Router();
const {
  validateHTMLCode,
  validateCSSCode,
  validateJSCode,
  validatePythonCode,
  validateJavaCode
} = require('../controllers/codeValidationController');
const { protect } = require('../middleware/auth');
const { runCode } = require('../controllers/runtimeController');
const { runtimeLimiter } = require('../middleware/runtimeLimiter');

// All validation routes are protected (require authentication)
router.post('/run/code', protect, runtimeLimiter, runCode);

// HTML validation
router.post('/validate/html', protect, validateHTMLCode);

// CSS validation (coming soon)
router.post('/validate/css', protect, validateCSSCode);

// JavaScript validation (coming soon)
router.post('/validate/javascript', protect, validateJSCode);

// Python validation (coming soon)
router.post('/validate/python', protect, validatePythonCode);

// Java validation (coming soon)
router.post('/validate/java', protect, validateJavaCode);

module.exports = router;
