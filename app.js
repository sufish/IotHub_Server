require('dotenv').config()
var mongoose = require('mongoose');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var deviceRouter = require('./routes/devices');
var tokensRouter = require('./routes/tokens')
var webHookeRouter = require('./routes/emqx_web_hook')
var messageRouter = require('./routes/messages')
var tagsRouter = require('./routes/tags')


var app = express();
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true })


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/devices', deviceRouter);
app.use('/tokens', tokensRouter);
app.use('/emqx_web_hook', webHookeRouter)
app.use('/messages', messageRouter)
app.use('/tags', tagsRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
