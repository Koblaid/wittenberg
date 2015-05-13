var mongoose = require('mongoose');
var express = require('express');
var minimist = require('minimist');
var morgan = require('morgan');

var argv = minimist(process.argv.slice(2));

var mode = argv.mode;
if(mode !== 'dev' && mode !== 'prod'){
  throw Error('--mode must be either "dev" or "prod"');
}

var app = express();
app.use(express.static('frontend'));

if(mode === 'dev'){
  app.use(morgan('dev'));
}

app.listen(argv.port || 3000);
