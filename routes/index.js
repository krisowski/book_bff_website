var express = require('express');
var router = express.Router();

var request = require('request');
var jp = require('jsonpath');

var goodGuyLib = require('good-guy-http');
var goodGuy = require('good-guy-http')({
  maxRetries: 2,

  defaultCaching: {                  // default caching settings for responses without Cache-Control                    
    cached: true,                    // - whether such responses should be cached at all 
    timeToLive: 5000,                // - for how many ms 
    mustRevalidate: false            // - is it OK to return a stale response and fetch in the background? 
  },
  cache: goodGuyLib.inMemoryCache(10)}
);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/book/:isbn', function(req, res, next) {
  console.log('ISBN', req.params.isbn)

  goodGuy('https://book-catalog-proxy-2.herokuapp.com/book?isbn=' + req.params.isbn).then(function(response) {
    console.log(response.body);

    req.esiOptions = {
        headers: {
            'Accept': 'text/html'
        }
    };
    var body = JSON.parse(response.body);

    //var title = body.items[0].volumeInfo.title;
    //var cover = body.items[0].volumeInfo.imageLinks.thumbnail;

    //var title = jp.query(body.items[0], '$..title');
    //var cover = jp.query(body.items[0], '$..thumbnail');

    var title = jp.query(body, '$.items[*]..title');
    var cover = jp.query(body, '$.items[*]..thumbnail');

    //res.send(body);
    //res.render('book', {title: title, cover: cover});
    //res.render('book', { title: title, cover: cover, partials: { layout: 'layout_file' } });
    
    var availabilityUrl = (process.env.INVENTORY_SERVICE || 'https://book-inventory-us-prod.herokuapp.com/stock/')+req.params.isbn;
    res.render('book', {
      partials: {
        layout: 'layout_file'
      },
      title: title,
      cover: cover,
      availabilityUrl: availabilityUrl
    });
  })

});

module.exports = router;
