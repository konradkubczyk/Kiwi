const express = require('express');
const router = express.Router();

// GET /licenses
router.get('/', function (req, res, next) {
    const licensesDict = require('../licenses.json');
    const licensesArray = Object.keys(licensesDict).map(key => licensesDict[key]);

    res.render('licenses', { title: 'Licenses' , licenses: licensesArray});
});

module.exports = router;
