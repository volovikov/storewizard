
var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var msg = require('./message');
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);

http.listen(8082, function() {
    console.log('Listening on *:8082');
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public/site'))

app.all('/', function(req, res, next) {
    return res.redirect('/home/');
});

app.listen(process.env.PORT || 8081);

app.get('/home/', function(req, res, next) {
    var site = app.settings.input.site,
        offset = app.settings.input.offset;

    site.GetProductList(function(err, results) {
        if (err) {
            return res.render('index', {
                offset: offset,
                products: []
            });
        } else {
            return res.render('index', {
                offset: offset,
                products: results
            });
        }
    });
});

app.get('/solution/', function(req, res, next) {
    var site = app.settings.input.site,
        offset = app.settings.input.offset;

    site.GetProductList(function(err, results) {
        if (err) {
            return res.render('solution', {
                offset: offset,
                products: []
            });
        } else {
            return res.render('solution', {
                offset: offset,
                products: results
            });
        }
    });
});

app.get('/support/', function(req, res, next) {
    var site = app.settings.input.site,
        offset = app.settings.input.offset;

    site.GetResponseList(function(err, response) {
        if (err) {
            return res.render('support', {
                offset: offset,
                response: [],
                faq: [],
                offer: []
            });
        } else {
            site.GetOfferList(function(err, offer) {
                if (err) {
                    return res.render('support', {
                        offset: offset,
                        response: [],
                        faq: [],
                        offer: []
                    });
                } else {
                    site.GetFaqList(function(err, faq) {
                        if (err) {
                            res.render('support', {
                                offset: offset,
                                response: [],
                                faq: [],
                                offer: []
                            });
                        } else {
                            return res.render('support', {
                                offset: offset,
                                response: response,
                                faq: faq,
                                offer: offer
                            });
                        }
                    });
                }
            });
        }
    });
});

app.get('/blog/', function(req, res, next) {
    var site = app.settings.input.site,
        offset = app.settings.input.offset;

    site.GetBlogList(function(err, results) {
        if (err) {
            return res.render('blog', {
                offset: [],
                business: [],
                soft: [],
                other: [],
                news: []
            });
        } else {
            var business = [],
                    soft = [],
                    other = [],
                    news = [];

            for (var i in results) {
                var item = results[i];
                if (item.group == 'Бизнесу') {
                    business.push(item);
                } else if (item.group == 'Как пользоваться') {
                    soft.push(item);
                } else if (item.group == 'Разное') {
                    other.push(item);
                } else if (item.group == 'Новости') {
                    news.push(item);
                }
            }
            return res.render('blog', {
                offset: offset,
                business: business,
                soft: soft,
                other: other,
                news: news
            });
        }
    });
});

app.get('/price/product/:product/period/:period', function(req, res, next) {
    var site = app.settings.input.site,
        product = req.params.product,
        period = req.params.period;

    site.GetProductPrice(product, function(err, results) {
        if (err) {
            return res.json({success: false, message: err});
        } else if (period == 1) {
            return res.json({success: true, data: {total: parseInt(results), permonth: results, discount: '0'}});
        } else if (period == 3) {
            return res.json({success: true, data: {total: parseInt(results * 3 * 0.95), permonth: results, discount: '5%'}});
        } else if (period == 6) {
            return res.json({success: true, data: {total: parseInt(results * 6 * 0.90), permonth: results, discount: '10%'}});
        } else if (period == 12) {
            return res.json({success: true, data: {total: parseInt(results * 12 * 0.85), permonth: results, discount: '15%'}});
        } else {
            return res.json({success: true, data: {total: 0, permonth: 0, discount: '0'}});
        }
    });
});

app.post('/callback/', function(req, res) {
    var site = app.settings.input.site,
        params = req.body;

    site.SaveCallback(params, function(err, results) {
        if (err) {
            return res.json({success: false, message: err});
        } else {
            return res.json({success: true, message: msg.COMPLETE_SEND_MESSAGE});
        }
    });
});

app.post('/register/', function(req, res) {
    var site = app.settings.input.site,
        params = req.body;

    site.Register(params, function(err, results) {
        if (err) {
            return res.json({success: false, message: err});
        } else {
            return res.json({success: true, message: msg.COMPLETE_SEND_MESSAGE});
        }
    });
});

app.post('/savechat', function(req, res, next) {
    var site = app.settings.input.site,
        params = req.body;

    site.SaveChat(params, function(err, result) {
        if (err) {
            return res.json({success: false, message: result});
        } else {
            return res.json({success: true});
        }
    });
});


io.on('connection', function(socket) {
    socket.on('send', function(data) {
        var site = require('./site');
        
        site.SaveChat(data, function(err, results) {
            if (err) {
                io.sockets.emit('message', {success: false, response: results});
            } else {
                io.sockets.emit('message', {success: true, response: data});                    
            }
        });
    });
    socket.on('operator-online', function(data) {
        io.sockets.emit('operator-online', {success: true});           
    });
    socket.on('operator-offline', function(data) {
        io.sockets.emit('operator-offline', {success: true});
    });   
    socket.on('operator-status', function(data) {
        io.sockets.emit('operator-status');
    });
    socket.on('client-offline', function(data) {
        io.sockets.emit('client-offline', data);
    });
});
