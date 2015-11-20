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
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
  res.render('index');
});

app.post('/user', function(req, res) {
    var data = JSON.parse(req.body.data);
    console.log(data);
    db.insert(data);
    res.send(200);
});

app.post('/send_push', function(req, res){
    var data = JSON.parse(req.body.data);
    var GCM = require('gcm').GCM;

    var apiKey = 'AIzaSyCBd1A0TXrPJYhIaHvmwcLvazSsEy7N5qc';
    var gcm = new GCM(apiKey);

    db.find({},function (err, docs) {
        docs.forEach(function(user) {
            var userNotification = data;

            var message = {
                registration_id: user.subId,
                collapse_key: 'Collapse key', 
                'data.key1': 'value1',
                'data.key2': 'value2'
            };

            gcm.send(message, function(err, messageId){
                if (err) {
                    console.log(err);
                } else {
                    console.log("notif:" + JSON.stringify(userNotification));
                    userNotification.destination = user.subId;
                    notif_db.insert(userNotification, function (err, newDocs) {
                        userNotification.destination = user.subId;
                        console.log("inseridos:" + JSON.stringify(userNotification));
                    });
                }
            });
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

app.get('/notifications/:id', function(req,res){
    var notifications = [];
    var id = req.params.id;
    console.log("id: " + id);
    notif_db.find({destination : id}, function (err, docs) {
      docs.forEach(function(doc){
        notifications.push({
            title: doc.payload.title,
            message: doc.payload.message
        })
      });

      notif_db.remove({destination : id}, {}, function (err, numRemoved) {
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
