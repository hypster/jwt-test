var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User = require('./models/user'); // get our mongoose model

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================


//sample route
app.get('/setup', function (req, res, next) {
  var user = new User({
    username: 'huang',
    password: '123',
    admin: true
  })
  user.save()
    .then(user => {
      console.log('user saved');
      res.status(200).json({
        success: true
      })
    })
    .catch(err => next(err))
})

//show users
var apiRoutes = express.Router();
apiRoutes.post('/authenticate', function (req, res, next) {
  User.findOne({
      username: req.body.username
    })
    .then(user => {
      if (user) {
        if (req.body.password != user.password) {
          res.status(403)
            .json({
              success: false,
              message: 'authentication failure. password incorrect'
            })
        } else {
          var payload = {
            admin: user.admin
          }
          var token = jwt.sign(payload, app.get('superSecret'), {
            expiresIn: 5184000
          })
          res.json({
            success: true,
            message: 'enjoy your token',
            token: token
          })
        }
      } else {
        res.status(403)
          .json({
            success: false,
            message: 'authentication failure. user not exist'
          })
      }
    })
    .catch(err => {
      next(err)
    })
})
apiRoutes.use(function (req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token']
  if (!token) {
    res.status(401)
      .json({
        success: false,
        message: 'no token provided'
      })
  }
  jwt.verify(token, app.get('superSecret'), function(err, decoded) {
    if (err) {
      res.status(401).json({
        success: false,
        message: 'failed to authenticate token'
      })
    }else {
      req.decoded = decoded
      next()
    }
  })
})

apiRoutes.get('/', function (req, res, next) {
  res.status(200)
    .json({
      message: 'welcome to the coolest api in the world'
    });
})
apiRoutes.get('/users', function (req, res, next) {
  User.find({})
    .then(users => {
      res.status(200).json({
        users: users
      })
    })
    .catch(err => next(err))
})

app.use('/api', apiRoutes);

// basic route
app.get('/', function (req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// err route
app.use(function (err, req, res, next) {
  res.status(500)
    .json({
      err: err
    })
})

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);