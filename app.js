var express         = require('express');
var path            = require('path');
var favicon         = require('serve-favicon');
var logger          = require('morgan');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var flash           = require('connect-flash');
var handlebars      = require('express-handlebars');

var session         = require('express-session');
var User            = require('./models/user');

var routes      = require('./routes/index');
var users       = require('./routes/user');
var protect     = require('./routes/protect');
var property    = require('./routes/property');

var app = express();


app.engine('handlebars', handlebars({
    defaultLayout: 'main',
    partialsDir: ['views/user/partials']
}));
app.set('view engine', 'handlebars');
app.enable('view cache');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}))
app.use(flash());

app.all('*', protect);
app.use('/', routes);
app.use('/user', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;


