var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var massive = require('massive');
//Need to enter username and password for your database
var connString = "postgres://postgres:mikhail4@localhost:3001/assessbox";

var app = express();

app.use(bodyParser.json());
app.use(cors());

//The test doesn't like the Sync version of connecting,
//  Here is a skeleton of the Async, in the callback is also
//  a good place to call your database seeds.
var db = massive.connect({connectionString : connString},
  function(err, localdb){
    db = localdb;
    app.set('db', db);

    db.user_create_seed(function(){
      console.log("User Table Init");
    });
    db.vehicle_create_seed(function(){
      console.log("Vehicle Table Init")
    });
})

app.get('/api/users', (req, res, next) => {
  db.run('select * from users', (err, users) =>{
    res.send(users);
  })
  })


app.get('/api/vehicles', (req, res, next) => {
  db.run('select * from vehicles', (err, vehicles) => {
    res.send(vehicles);
  })
})

app.post('/api/users', (req, res, next) => {
  db.users.insert({firstname: req.body.firstName, lastname: req.body.lastName, email: req.body.email}, (err) =>{
    res.send('user added');
  })
})

app.post('/api/vehicles', (req, res, next) => {
  db.vehicles.insert({make: req.body.make, model: req.body.model, year: req.body.year, ownerid: req.body.ownerId}, (err) =>{
    res.send('vehicle added');
  })
})

app.get('/api/user/:userId/vehiclecount', (req, res, next) => {
  db.run('select count(make) as num from vehicles where ownerid = $1', [req.params.userId], (err, num) => {
    res.send({count: num});
  })
})

app.get('/api/user/:userId/vehicle', (req, res, next) => {
  db.run('select * from vehicles where ownerid = $1', [req.params.userId], (err, vehicles) =>{
    res.send(vehicles);
  })
})

app.get('/api/vehicle', (req, res, next) => {
  if(req.query.value){
  db.run('select * from vehicles v join users u on u.id = v.ownerid where email = $1 or firstname like "$1%"', [req.query.value], (err, vehicles) => {
  res.send(vehicles);
})
}
})

app.get('/api/newervehiclesbyyear', (req, res, next) => {
  db.run('select make, model, year, firstname, lastname from vehicles v join users u on u.id = v.ownerid where year >= 2000 order by year desc', (err, vehicles) =>{
  res.send(vehicles);
})
})

app.put('/api/vehicle/:vehicleId/user/:userId', (req, res, next) => {
  db.run('update vehicles set ownerid = $2 where id = $1', [Number(req.params.vehicleId), Number(req.params.userId)], (err) =>{
  res.send('vehicle ownership changed')
})
})

app.delete('/api/user/:userId/vehicle/:vehicleId', (req, res, next) => {
  db.run('update vehicles set ownerid = null where ownerid = $1', [req.params.userId], (err) => {
    res.send('ownership removed');
  })
})

app.delete('/api/vehicle/:vehicleId', (req, res, next) => {
  db.run('delete from vehicles where id = $1', [req.params.vehicleId], (err) => {
    res.send('vehicle deleted');
  })
})

app.listen('3000', function(){
  console.log("Successfully listening on : 3000")
})

module.exports = app;
