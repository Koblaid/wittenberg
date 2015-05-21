var path = require('path');
var mongoose = require('mongoose');
var express = require('express');
var minimist = require('minimist');
var morgan = require('morgan');
var _ = require('lodash');
var shortid = require('shortid');
var bodyParser = require('body-parser');

var argv = minimist(process.argv.slice(2));
var configFilePath = argv['config'] || '../config.json';
var config = require(configFilePath);


mongoose.connect(config.mongodbUrl, function(err){
  if(err){
    console.log(err);
  } else {
    console.log('MongoDB connection established');
  }
});

var Discussion = mongoose.model('Discussion', {
  name: String,
  arguments: [{
    id: String,
    x: Number,
    y: Number,
    text: String,
  }],
  connections: [{
    sourceId: String,
    targetId: String,
  }],
  sid: {
    type: String,
    unique: true,
    'default': shortid.generate,
  },
});

var app = express();

app.use(bodyParser.json());

app.get('/api/discussion/:sid', function(req, res) {
  var sid = req.params.sid;
  if(!shortid.isValid(sid)){
    return res.status(400).end();
  }
  Discussion
    .findOne({sid: sid})
    .select('arguments connections')
    .lean()
    .exec(function(err, discussion){
      if(err){
        res.status(500);
      }
      var connections = [];
      discussion.connections.forEach(function(conn){
        connections.push([conn.sourceId, conn.targetId]);;
      });
      discussion.connections = connections;
      res.send(discussion);
  });
});

app.post('/api/discussion', function(req, res) {
  Discussion.create(req.body, function(err, result){
    if(err){
      console.log(err);
      return res.sendStatus(500);
    }
    res.send(result.sid);
  });
});

app.put('/api/discussion/:sid', function(req, res){
  var sid = req.params.sid;
  if(!shortid.isValid(sid)){
    return res.status(400).end();
  }
  var connections = [];
  req.body.connections.forEach(function(conn){
    connections.push({sourceId: conn[0], targetId: conn[1]});
  });
  req.body.connections = connections;
  Discussion.update({sid: sid}, req.body, function(err, discuss){
    if(err){
      console.log(err);
      return res.sendStatus(500);
    }
    res.sendStatus(200);
  });
});

app.use(express.static('frontend'));

app.get('/:sid', function(req, res){
  res.sendFile('index.html', {root: path.resolve('frontend')});
});

app.use(morgan(config.morganLogFormat));

var server = app.listen(config.port, function(){
  console.log('Server is listening on port '+server.address().port);
});
