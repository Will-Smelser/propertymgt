var express = require('express');
var router = express.Router();

var model = require('../models/property');

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Express' });
});

module.exports = router;