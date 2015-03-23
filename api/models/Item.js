'use strict';

var mongoose = require('mongoose');

var itemSchema = mongoose.Schema({
  name: String,

  picture: String,

  time: Integer
});

module.exports('Item', itemSchema);
