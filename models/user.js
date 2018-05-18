var mongoose = require('mongoose')
var user = new mongoose.Schema({
  username: String,
  password: String,
  admin: Boolean
})
module.exports = mongoose.model('User', user)