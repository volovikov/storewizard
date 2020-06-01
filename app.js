/**
 * Файл описывает маршруты для сайта, для api
 * А также, содержит правила работы сокетов
 *
 * @project storewizard
 * @section core
 * @author volovikov
 */
msg = require('./message');

var express = require('express'),
    mongo = require('connect-mongo')(express),
    app = express.createServer(),
    io = require('socket.io').listen(app);

app.listen(process.env.PORT || 8080);

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({secret: 'some', store: new mongo({db: 'some-db'})}));
    app.use(express.methodOverride());
    app.use(app.router);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade.txt');
    app.register('jade.txt', require('jade'));
});
app.configure('development', function() {
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});
app.configure('production', function() {
    var oneYear = 31557600000;
    app.use(express.static(__dirname + '/public', {maxAge: oneYear}));
    app.use(express.errorHandler());
});
/**
 * Возращает true, если запрашивают сайт
 * example: http://storewizard.ru
 * 
 * @param {object} req объект запрос
 * @return bool
 */
app.is('site', function(req) {
    var host = req.headers.host.split('.'),
        url = req.url.split('.'),
        threshold = (app.settings.env == 'development') ? 2 : 3;

    var IsSubdomain = function() {
        return host.length == threshold;
    }
    var IsResource = function() {
        return url.length > 1 ? true : false;
    }
    var IsApi = function() {
        return req.url.indexOf('/api/') === -1 ? false : true;
    }
    if (!IsSubdomain() && !IsResource() && !IsApi()) {
        return true;
    } else {
        return false;
    }
});
/**
 * Возращает true, если запрашивают приложение
 * example: http://homewallet.storewizard.ru
 * 
 * @param {object} req объект запрос
 * @return bool
 */
app.is('application', function(req) {
    var host = req.headers.host.split('.'),
        url = req.url.split('.'),
        threshold = (app.settings.env == 'development') ? 2 : 3;

    var IsSubdomain = function() {
        return host.length == threshold;
    }
    var IsResource = function() {
        return (url.length) > 1 ? true : false;
    }
    var IsApi = function() {
        return req.url.indexOf('/api/') === -1 ? false : true;
    }
    if (IsSubdomain() && !IsResource() && !IsApi()) {
        return true;
    } else {
        return false;
    }
});
/**
 * Возращает true, если запрашивают api
 * example: http://storewizard.ru/api/<другие параметры>
 *
 * @param {object} req объект запрос
 * @return bool
 */
app.is('api', function(req) {
    var host = req.headers.host.split('.');
        url = req.url.split('.'),
        threshold = (app.settings.env == 'development') ? 2 : 3;

    var IsSubdomain = function() {
        return host.length == threshold;
    }
    var IsResource = function() {
        return url.length > 1 ? true : false;
    }
    var IsApi = function() {
        return req.url.indexOf('/api/') === -1 ? false : true;
    }
    if (IsSubdomain() && !IsResource() && IsApi()) {
        return true;
    } else {
        return false;
    }
});
/**
 * Эта функция вызывается для всех запросов
 * Она классифицирует запрос, определяет является ли он сайтом, апи или приложением
 * и в зависимости от этого, добавляет к переменной app.settings.input
 * необходимые данные и билиотеки
 *
 * @param {type} req запрос
 * @param {type} res ответ
 * @return next - дальше по цепочке запросов идем
 */
app.all('/*', function(req, res, next) {
    var GetClientLogin = function() {
        return req.headers.host.split('.')[0];
    }
    if (req.is('site')) {
        app.set('input', {
            type: 'site',
            offset: '/site/',
            site: require('./site')
        });
        next();
    } else if (req.is('application')) {
        var client = GetClientLogin();

        require('./clients')(client, function(err, detail) {
            if (!err) {
                app.set('input', {
                    type: 'application',
                    offset: '/desktop/',
                    api: require('./api')(detail)
                });
                next();
            }
        });
    } else if (req.is('api')) {
        var client = GetClientLogin();

        require('./clients')(client, function(err, detail) {
            if (!err) {
                app.set('input', {
                    type: 'api',
                    offset: '/desktop/',
                    api: require('./api')(detail)
                });
                next();
            }
        });
    } else {
        app.set('input', {
            type: 'resource',
            offset: '/desktop/'
        });
        next();
    }
});
/**
 * На этот путь приходят как запросы с сайта, так и запросы с
 * приложений. В случае, если сайт, делаем редирект на домашнюю
 * страницу. В случае, если приложение, в зависимости от того,
 * авторизован человек или нет, грузим либо страницу авторизации, либо
 * сам продукт
 * example: http://storewizard/, http://clients.storewizard.ru/
 *
 *
 * @param {type} param1
 * @param {type} param2
 */
app.get('/', function(req, res, next) {
    var type = app.settings.input.type,
        offset = app.settings.input.offset;

    var IsUserAuth = function() {
        return (typeof req.session != 'undefined' && typeof req.session.sig != 'undefined')
                ? true : false;
    };
    if (typeof app.settings.input.api != 'undefined') {
        var params = {
            layout: false,
            pageTitle: 'Storewizard - ' + app.settings.input.api.client.GetAppType(),
            appType: app.settings.input.api.client.GetAppType(),
            appVersion: app.settings.input.api.client.GetAppVersion()
        }
    }
    switch (type) {
        case 'site':
            return res.redirect('/home/');

        case 'application':
            if (IsUserAuth()) {
                return res.render('storewizard', params);
            } else {
                return res.render('welcome', params);
            }
    }
});
/**
 * Домашняя страница сайта, титульная
 * storewizard/home/
 */
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
/**
 * Страница решения
 * storewizard/solution/
 */
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
/**
 * Страница поддержки
 * storewizard/support/
 */
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
/**
 * Страница Блог
 * storewizrd/blog/
 */
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
/**
 * Этот маршрут вызывается для запроса цены и скидки на продукцию
 * storewizard/product/<имя продукта>/period/<период>
 */
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
/**
 * Этот метод сохраняет данные с формы обратной связи на сайте
 * 
 */
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
/**
 * Этот маршрут сохраняет данные с формы регистрации
 *
 */
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
/**
 *  GET (SELECT)
 *	/api/sig/120301939/storelist
 *	/api/sig/12312309/fieldslist*
 *
 *	/api/sig/123123123/list/store   //<-- может так?
 *	/api/sig/123123132/list/fields
 *
 *	/api/sig/10293039/store/operation
 *	/api/sig/12319238/store/operation/account/2
 *	/api/sig/12309123/store/operation/page/2
 *	/api/sig/10928391283/store/operation/account/2/subcategory/5
 *
 *	POST (INSERT)
 *	/api/sig/12391029/store/operation
 *	{id: some,
 *	account: some,
 *	subcategory: some}
 *	
 *	/api/enter/
 *	{login: some,
 *	password: some}
 *	
 *	/api/leave/
 *	
 *	/api/sig/123123123/savestore
 *
 *	/api/sig/123123123/save/store    //<-- может так?
 *	/api/sig/123123131/save/column
 *
 *	{store: 'some',
 *	order: 3}
 *	
 *	/api/sig/123123123/store/base/savecolumn
 *	{}
 *	
 *	PUT (UPDATE)
 *	/api/sig/1203909/store/operation
 *	{id: some,
 *	account: some,
 *	subcategory: some}
 *	
 *	DELETE (DELETE)
 *	/api/sig/123123/store/operation/id/123123
 */
app.post('/api/enter/', function(req, res) {
    var post = req.body,
        welcome = require('./welcome.js'),
        client = app.settings.input.api.client;

    welcome.Enter(post, client, function(err, result) {
        if (err) {
            return res.json({success: false, message: result});
        } else {
            req.session.sig = client.GetSig();
            return res.json({success: true, sig: client.GetSig()});
        }
    });
});
app.post('/api/leave/', function(req, res) {
    var post = req.body,
        welcome = require('./welcome.js'),
        client = app.settings.input.api.client;

    welcome.Leave(post, client, function(err, result) {
        if (err) {
            return res.json({success: false, message: result});
        } else {
            delete req.session.sig;
            return res.send({success: true});
        }
    });
});
app.del('/api/sig/:sig/store/:store', function(req, res, next) {
    var sig = req.params.sig,
        store = req.params.store,
        params = req.body,
        api = app.settings.input.api;

    if (!api.IsValidSignature(sig)) {
        return res.json({success: false, message: msg.ERROR_USER_NOT_VALID});
    } else {
        api.Delete(store, params, function(err, result) {
            if (err) {
                return res.json({success: false, message: result});
            } else {
                return res.json({success: true});
            }
        });
    }
});
app.put('/api/sig/:sig/store/:store', function(req, res, next) {
    var sig = req.params.sig,
            store = req.params.store,
            params = req.body,
            api = app.settings.input.api;

    if (!api.IsValidSignature(sig)) {
        return res.json({success: false, message: msg.ERROR_USER_NOT_VALID});
    } else {
        api.Save(store, params, function(err, result) {
            if (err) {
                return res.json({success: false, message: result});
            } else {
                return res.json({success: true});
            }
        });
    }
});
app.post('/api/sig/:sig/store/:store', function(req, res, next) {
    var sig = req.params.sig,
        store = req.params.store,
        params = req.body,
        api = app.settings.input.api;

    if (!api.IsValidSignature(sig)) {
        return res.json({success: false, message: msg.ERROR_USER_NOT_VALID});
    } else {
        api.Save(store, params, function(err, result) {
            if (err) {
                return res.json({success: false, message: result});
            } else {
                return res.json({success: true});
            }
        });
    }
});
app.post('/api/sig/:sig/savestore', function(req, res, next) {
    var sig = req.params.sig,
        params = req.body,
        api = app.settings.input.api;

    if (!api.IsValidSignature(sig)) {
        return res.json({success: false, message: msg.ERROR_USER_NOT_VALID});
    } else {
        api.SaveStore(params, function(err, result) {
            if (err) {
                return res.json({success: false, message: result});
            } else {
                return res.json({success: true});
            }
        });
    }
});
app.post('/api/sig/:sig/deletestore', function(req, res, next) {
    var sig = req.params.sig,
        params = req.body,
        api = app.settings.input.api;

    if (!api.IsValidSignature(sig)) {
        return res.json({success: false, message: msg.ERROR_USER_NOT_VALID});
    } else {
        api.DeleteStore(params, function(err, result) {
            if (err) {
                return res.json({success: false, message: result});
            } else {
                return res.json({success: true});
            }
        });
    }
});
app.post('/api/sig/:sig/store/:store/savecolumn', function(req, res, next) {
    var sig = req.params.sig,
        store = req.params.store,
        params = req.body,
        api = app.settings.input.api;

    if (!api.IsValidSignature(sig)) {
        return res.json({success: false, message: msg.ERROR_USER_NOT_VALID});
    } else {
        api.SaveColumn(store, params, function(err, result) {
            if (err) {
                return res.json({success: false, message: result});
            } else {
                return res.json({success: true});
            }
        });
    }
});
app.post('/api/sig/:sig/store/:store/deletecolumn', function(req, res, next) {
    var sig = req.params.sig,
        store = req.params.store,
        params = req.body,
        api = app.settings.input.api;

    if (!api.IsValidSignature(sig)) {
        return res.json({success: false, message: msg.ERROR_USER_NOT_VALID});
    } else {
        api.DeleteColumn(store, params, function(err, result) {
            if (err) {
                return res.json({success: false, message: result});
            } else {
                return res.json({success: true});
            }
        });
    }
});
app.post('/api/sig/:sig/store/:store/savefield', function(req, res, next) {
    var sig = req.params.sig,
        store = req.params.store,
        params = req.body,
        api = app.settings.input.api;

    if (!api.IsValidSignature(sig)) {
        return res.json({success: false, message: msg.ERROR_USER_NOT_VALID});
    } else {
        api.SaveField(store, params, function(err, result) {
            if (err) {
                return res.json({success: false, message: result});
            } else {
                return res.json({success: true});
            }
        });
    }
});
app.get('*', function(req, res, next) {
    var type = app.settings.input.type,
        url = req.url;

    var GetParamsFromUrl = function() {
        var key = [],
            value = [],
            params = {};

        url = url.replace('/api/', '').split('?');
        url = url[0].split('/');

        for (var i in url) {
            if (i % 2 == 0) {
                key.push(decodeURIComponent(url[i]));
            } else {
                value.push(decodeURIComponent(url[i]));
            }
        }
        for (var j in key) {
            if (typeof value[j] == 'undefined') {
                params[key[j]] = '';
            } else {
                params[key[j]] = value[j];
            }
        }
        return params;
    };
    var IsDataRequest = function() {
        return typeof params.storelist == 'undefined' && typeof params.fieldslist == 'undefined' ? true : false;
    };
    var GetData = function(params, callback) {
        var store = params.store,
            sig = params.sig,
            api = app.settings.input.api;

        if (typeof params.page == 'undefined') {
            params.page = 1;
        }
        if (typeof params.limit == 'undefined') {
            params.limit = 50;
        }
        params.start = (params.page - 1) * params.limit;

        if (!api.IsValidSignature(sig)) {
            callback(true, msg.ERROR_USER_NOT_VALID);
        } else {
            api.GetData(store, params, callback);
        }
    };
    if (type == 'api') {
        var params = GetParamsFromUrl();

        if (IsDataRequest()) {
            GetData(params, function(err, results) {
                if (err) {
                    return res.json({success: false, message: results});
                } else {
                    return res.json(results)
                }
            });
        } else {
            next();
        }
    } else {
        next();
    }
});
app.get('/api/sig/:sig/storelist', function(req, res, next) {
    var sig = req.params.sig,
        api = app.settings.input.api;

    if (!api.IsValidSignature(sig)) {
        return res.json({success: false, message: msg.ERROR_USER_NOT_VALID});
    } else {
        api.GetStoreList(function(err, results) {
            if (err) {
                return res.json({success: false, message: msg.ERROR_DB_READ});
            } else {
                return res.json({success: true, data: results});
            }
        });
    }
});
app.get('/api/sig/:sig/fieldslist', function(req, res, next) {
    var sig = req.params.sig,
        api = app.settings.input.api;

    if (!api.IsValidSignature(sig)) {
        return res.json({success: false, message: msg.ERROR_USER_NOT_VALID});
    } else {
        api.GetFieldsList(function(err, results) {
            if (err) {
                return res.json({success: false, message: msg.ERROR_DB_READ});
            } else {
                return res.json({success: true, data: results});
            }
        });
    }
});
/**
 * Модуль socket.io, модуль ввода-вывода
 * в реальном времени
 *
 * @param {type} param
 */
io.configure(function() {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});
io.sockets.on('connection', function(socket) {
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