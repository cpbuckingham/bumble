var express = require('express');
var router = express.Router();
var unirest = require('unirest');
var bumdb = require('monk')(process.env.MONGOLAB_URI);
var userCollection = bumdb.get('user');
var catCollection = bumdb.get('cat');
var bcrypt= require('bcrypt');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/reddit', function (req,res,next) {
  console.log("step 1");
  userCollection.findOne({_id:req.body.user_id}).then(function (response) {
    var testcats = response.interest;
    var random = Math.floor(Math.random() * (testcats.length));
    var categoryChosen = (testcats[random]);
    console.log(categoryChosen);
    unirest.get('https://www.reddit.com/r/'+testcats[random]+'.json?')
    .end(function (response) {
      var randomchild = Math.floor(Math.random() * (response.body.data.children.length));
      var info = response.body.data.children[randomchild].data;
      console.log(info);
      console.log(info.domain);
      // if(info.domain === "self."+categoryChosen)
      info.category = categoryChosen;
      if(info.domain === "youtube.com" || info.domain === "twitter.com" || info.domain === "vine.co" || info.domain === "m.youtube.com" || info.domain === "google.com" || info.domain === "en-maktoob.news.yahoo.com"){
        unirest.get('http://api.embed.ly/1/oembed?key=:'+process.env.EMBEDLY_API+'&url='+info.url)
        .end(function (tube) {
          console.log(tube.body);
          var regex = /src="(.+?)"/;
          var matches = regex.exec(tube.body.html);
          res.json(matches[1]);
        });
      }else{
        res.json(info);
      }
    });
  });
});



router.get("/reddittrend", function (req, res, next) {
  unirest.get("https://www.reddit.com/.json")
  .end(function (response) {
    var info = response.body.data.children;
    res.json(info);
  });
});

router.post('/insert', function (req, res, next) {
  //var category={};
  // category[req.body.interest] = {liked:[], disliked:[], time: {timeliked:[], timedisliked:[], timeall:[]}};
  //catCollection.insert({user_id:req.body.user_id, categoryname:req.body.interest, liked:[], disliked:[], indifferent:[], alltime:[], timeliked:[], timedisliked:[]});
  catCollection.insert({user_id:req.body.user_id, categoryname:req.body.interest, site:[]}).then(function () {
  userCollection.update({_id:req.body.user_id}, {$push:{interest:req.body.interest}});
  }).then(function (response) {
   res.json(response);
  });
});


router.post('/articleInfo', function (req, res, next) {
  catCollection.update({user_id:req.body.user_id, categoryname:req.body.category}, {$push:{site:{url:req.body.url, opinion:req.body.opinion, time:req.body.timer}}}).then(function (response) {
    res.json(response);
  });
});

router.post("/subscriber", function (req, res, next) {
  var subscriberinfo = {};
  var counter = 0;
  var length = req.body.category.length;
 for (var i = 0; i < length; i++) {
   var last = req.body.category[length-1];
   var catname = req.body.category[i];
   unirest.get('https://www.reddit.com/r/'+req.body.category[i]+'/about.json?')
   .end(function (response) {
     subscriberinfo[response.body.data.display_name] = response.body.data.subscribers;
     counter ++;
     if(counter === length){
       res.json(subscriberinfo);
     }
   });
 };
});

router.post("/userinfo", function (req, res, next) {
  userCollection.findOne({_id:req.body.user_id}).then(function (response) {
    res.json(response);
  });
});

router.post('/checkuser', function (req, res, next) {
   userCollection.findOne({email:req.body.email}).then(function (response) {
     if (response === null){
     console.log(response);
     res.json(response);
   }else{
     var compare = response.password;
     if(bcrypt.compareSync(req.body.password, compare)){
       response.good = true;
       res.json(response);
     }else{
       response.good = false;
       res.json(response);
     }
   }
   });
});

router.post('/insertuser', function (req, res, next) {
  var hash = bcrypt.hashSync(req.body.password, 8);
  userCollection.insert({name:req.body.name, email:req.body.email, password:hash, interest:[]}).then(function (response) {
    res.json(response);
  });




});

module.exports = router;
