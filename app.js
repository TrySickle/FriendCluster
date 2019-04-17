var mongoose = require("mongoose");
var User = require('./models/user')
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

var express = require('express')
var bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/users', function(req, res) {
    User.find({}, (err, users) => {
        return res.status(200).json({
            users: users
        })
    })
})

app.get('/users/user/:id', function(req, res, next) {
    if (req.params.id) {
        User.findOne({id: req.params.id}, (err, user) => {
            return res.status(200).json({
                user: user
            })
        })
    } else {
        return res.status(400).json({
          message: "missing id"
        });
    }
})

app.post('/users/user', function(req, res) {
    if (req.body.id && req.body.latitude && req.body.longitude) {
        const user = {
            id: req.body.id,
            location: {
                type: 'Point',
                coordinates: [req.body.latitude, req.body.longitude]
            }
        }
        User.find({id:req.body.id}, (err, users) => {
            if (users.length) {
                return res.status(204).json({
                    user:users
                });
            } else {
                User.create(user, (err, usr) => {
                  return res.status(201).json({
                    user: usr
                  });
                });
            }
        })
        
    } else {
        return res.status(400).json({
            message: "missing body values"
        })
    }
})

app.put('/users/user/:id', function(req, res) {
    if (req.params.id && req.body.latitude && req.body.longitude) {
        const user = {
            id: req.body.id,
            location: {
                type: 'Point',
                coordinates: [req.body.latitude, req.body.longitude]
            }
        }
        User.findOneAndUpdate({id: req.params.id}, user, (err, usr) => {
            return res.status(201).json({
                user: usr
            })
        })
    } else {
        return res.status(400).json({
          message: "missing body values"
        });
    }
})

app.get('/users/user/:id/circle', function(req, res) {
    if (req.params.id) {
        User.find({}, (err, users) => {
            if (users.length == 0) {
                return res.status(200).json({
                    centroid: [],
                    locations: users
                })
            }
            var userLocations = []
            var x = 0
            var y = 0
            var z = 0
            for (var i = 0; i < users.length; i++) {
                userLocations.push(users[i].location.coordinates)
                var cosLat = Math.cos(users[i].location.coordinates[0] * Math.PI / 180)
                var cosLon = Math.cos(users[i].location.coordinates[1] * Math.PI / 180)
                var sinLat = Math.sin(users[i].location.coordinates[0] * Math.PI / 180)
                var sinLon = Math.sin(users[i].location.coordinates[1] * Math.PI / 180)
                var xi = cosLat * cosLon
                var yi = cosLat * sinLon
                var zi = sinLat
                x += xi
                y += yi
                z += zi
            }
            x = x / users.length
            y = y / users.length
            z = z / users.length

            var lon = Math.atan2(y, x)
            var hyp = Math.sqrt(x * x + y * y)
            var lat = Math.atan2(z, hyp)

            lon = lon * 180 / Math.PI
            lat = lat * 180 / Math.PI
            if (users.length == 1) {
                lat = users[0].location.coordinates[0]
                lon = users[0].location.coordinates[1]
            }
            return res.status(200).json({
                centroid: [lat, lon],
                locations: userLocations
            })
        })
    } else {
        return res.status(400).json({
          message: "missing id"
        });
    }
})

app.delete('/users/user/:id', function(req, res) {
    if (req.params.id) {
        User.findOneAndDelete({id: req.params.id}, (err, user) => {
            return res.status(204).json({
                deleted: user
            })
        })
    } else {
        return res.status(400).json({
          message: "missing id"
        });
    }
})

app.listen(4675, () => {
    console.log("Example app listening on port 4675!");
});
