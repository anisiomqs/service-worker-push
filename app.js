'use strict';

var express = require('express');
var bodyParser = require("body-parser");
var app = express();

var Datastore = require('nedb');
//gs://#default#/
var db = new Datastore({ filename: 'gs://#default#/users.db', autoload: true });
var notif_db = new Datastore({ filename: 'gs://#default#/notifications.db', autoload: true });

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
  res.render('index');
});

app.post('/user', function(req, res) {
    var data = JSON.parse(req.body.data);
    db.insert(data);
    res.send(200);
});

app.post('/send_push', function(req, res){
    var data = JSON.parse(req.body.data);
    console.log(data);
    var GCM = require('gcm').GCM;

    var apiKey = 'AIzaSyCBd1A0TXrPJYhIaHvmwcLvazSsEy7N5qc';
    var gcm = new GCM(apiKey);

    var message = {
    	registration_id: data.destination,
    	collapse_key: 'Collapse key', 
    	'data.key1': 'value1',
    	'data.key2': 'value2'
    };

    db.find({subId: data.destination},function (err, docs) {
        var user = docs[0];

        gcm.send(message, function(err, messageId){
            if (err) {
                console.log(err);
            } else {
                data.name = user.name;
                console.log("notif:" + JSON.stringify(data));
                notif_db.insert(data, function (err, newDocs) {
                  console.log("inseridos:" + newDocs);
                });
                console.log("Enviado com id: ", messageId);
            }
        });
    });
});

app.get('/users', function(req, res) {
    var users = [];

    db.find({}, function (err, docs) {
        docs.forEach(function(doc){
            users.push({
                name:doc.name,
                subId:doc.subId
            });     
        });

        res.render('users',{users: users});
    });
});

app.get('/notifications/:name', function(req,res){
    console.log(req.params.name);  
    var name = req.params.name;
    var notifications = [];
    notif_db.find({name: name}, function (err, docs) {
      docs.forEach(function(doc){
        notifications.push({
            title: doc.payload.title,
            message: doc.payload.message
        })
      });

      notif_db.remove({name: name}, {}, function (err, numRemoved) {
          res.setHeader('Content-Type', 'application/json');
          console.log(notifications);
          res.send(JSON.stringify(notifications));      
      });
    });
});

var server = app.listen(process.env.PORT || 8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
