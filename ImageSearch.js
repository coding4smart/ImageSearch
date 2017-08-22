/*
 * URL Shortern Microservice,
 *
 * tangjicheng@gmail.com
 *
 * 1.accepts a request url and generate a shorter one to response,
 * get error if url is invalid http(s) url,
 * 2.redirect to the original url if request to access the shorter
 * url.
 *
 * returns {'original_url':url,'short_url':short_url}.
 *
 */
var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var fs = require("fs");
var Bing = require('node-bing-api')({ accKey: "52b57dae102e4a9e9261a96b2a0ffc74" });

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/api/latest/imagesearch", function (request, response) {
  
  var latestsearch = [];
  var dburl = 'mongodb://fcc:77Ac00bb@ds127173.mlab.com:27173/freecodedb';
  fs.readFile( __dirname + "/" + ".env", 'utf8', function (err, data) {
       //console.log( data );
       if(err) return console.log("Error when reading dburl: "+err);
       dburl = data;
   });
  if(dburl) {
    mongo.connect(dburl, function(err,db) {
      if(err)
        return console.log("Error when connect mongodb :"+err);
      var search_json = [];
      db.collection('image_search').find({}, { sort:[['when',-1]]}).limit(10).toArray(function (error,data) {
        if(error)
          return console.log("Error when insert short url: "+error);
        console.log(data);
        data.forEach(function(value) {
          var search_record = {"term": value.term, "when": value.when};
          console.log(search_record);
          search_json.push(search_record);
        });
        
        response.send(JSON.stringify(search_json));
        response.end();
      });
      db.close();
    });
  }
});
  
// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.post("/api/imagesearch/*", function (request, response) {
  
  let offset = request.query.offset || 0;
  let url = request.url;
  let filtURL = url.split('?')[0];
  let keyword = filtURL.replace('/api/imagesearch/','').replace('%20',' ');
  var saved_search = {"term": keyword, "when": new Date().toISOString()};
      
  //store search request to mongodb
  var dburl = 'mongodb://fcc:77Ac00bb@ds127173.mlab.com:27173/freecodedb';
  fs.readFile( __dirname + "/" + ".env", 'utf8', function (err, data) {
       //console.log( data );
       if(err) return console.log("Error when reading dburl: "+err);
       dburl = data;
   });
  if(dburl) {
  
    mongo.connect(dburl, function(err,db) {
      if(err)
        return console.log("Error when connect mongodb :"+err);
      //console.log('start db');
      db.collection('image_search').insert(saved_search,function (error,data) {
        if(error)
          return console.log("Error when insert image search: "+error);
      });
      db.close();
    });
  }

  //search function
  Bing.images(keyword, {
  count: 10,   // Number of results (max 50) 
  offset: offset    // Skip offset result 
  }, function(error, res, body){
    if(error)
      return console.log("Error when searching Bing.com :"+error);
    var images = body.value;
    for(var i=0;i<images.length;i++) {
      var contentUrl = images[i].contentUrl;
      var fURL = contentUrl.split('&');
      var offURL = fURL[fURL.length-2].split('=')[1];
      var repURL = offURL.replace(/%2f/g,'/').replace(/%3a/g,':');
      
      var cURL = images[i].hostPageUrl;
      var cfURL = cURL.split('&');
      var ctxURL = cfURL[cfURL.length-2].split('=')[1];
      var context = ctxURL.replace(/%2f/g,'/').replace(/%3a/g,':');
    }
  });

  //set to response
  response.sendStatus(200);
  response.end();
});

// Simple in-memory store for now
var dreams = [
  "Find and count some sheep",
  "Climb a really tall mountain",
  "Wash the dishes"
];

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
