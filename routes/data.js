var express = require('express');
var router = express.Router();

/* GET data. */
router.get('/', function(req, res, next) {
  const data = [100, 50, 300, 40, 350, 250]; // assuming this is coming from the database
  res.json(data);
});

module.exports = router;
