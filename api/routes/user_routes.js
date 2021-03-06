'use strict';

var User = require('../models/User');
var Item = require('../models/Item');
var eat_auth = require('../lib/eat_auth');

var bodyparser = require('body-parser');

module.exports = function(app, passport, appSecret) {
  app.use(bodyparser.json());

  //create user
  app.post('/create_user', function(req, res) {
    User.findOne({"basic.name": req.body.name}, function(err, user) {
      if(user !== null) return res.json({msg: 'user already created'});
      var newUser = new User();
      newUser.basic.name = req.body.name;
      newUser.basic.password = newUser.generateHash(req.body.password);
      newUser.save(function(err, user) {
        if(err) return res.status(500).send({'msg': 'could not save user'});
        user.generateToken(appSecret, function(err, token) {
          if(err) return res.status(500).send({'msg': 'could not generate token'});
          res.json({eat: token, name: user.basic.name});
        });
      });
    });
  });

  //sign in
  app.get('/sign_in', passport.authenticate('basic', {session: false}), function(req, res) {
    req.user.generateToken(appSecret, function(err, token) {
      if(err) return res.status(500).send({'msg': 'could not generate token'});
      res.json({eat: token, name: req.user.basic.name});
    });
  });

  //delete user
  app.delete('/delete_user/:name', eat_auth(appSecret), function(req, res) {
    User.findOneAndRemove({"basic.name": req.params.name}, function(err, data) {
      if(err) return res.status(500).send({'msg': 'could not remove'});
      res.json(data);
    });
  });

  //update user profile with liked item
  app.put('/like_item/:item', eat_auth(appSecret), function(req, res) {
    Item.findOne({"name": req.params.item}, function(err,data) {
      if(err) return res.status(500).send({'msg':'could not find item'});

      var likedItem = data;
      
      User.findOne({"basic.name": req.body.name}, function(err, data) {
        if(err) return res.status(500).send({'msg':'could not find user'});
        var newUser = data;

        newUser.likes.push(JSON.stringify(likedItem));
      
        User.update({"basic.name": req.body.name}, newUser, function(err) {
          if(err) return res.status(500).send({'msg': 'could not add liked item'});
          res.json(newUser);
        });
      });
    });
  });

  app.get('/get_likes/:name', eat_auth(appSecret), function(req, res) {
    User.findOne({"basic.name": req.params.name}, function(err, data) {
      if(err) return res.status(500).send({'msg': 'could not retrieve liked list'});
      for (var i = 0; i < data.likes.length; i++){
        data.likes[i] = JSON.parse(data.likes[i]);
      }
      res.json(data.likes);
    });
  });
};
