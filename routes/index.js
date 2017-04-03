var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Mapas de Nicaragua' });
});

/* GET map1 page. */
router.get('/map1', function(req, res, next) {
  res.render('map1', { title: 'Mapas de Nicaragua' });
});

module.exports = router;
