/**
 *  TODO
 *  Это тоже старое!!
 *
 */
    
var Routes = {
	Init: function(req, res) {
		this.host = req.headers.host;
		this.root = 'storewizard:22435';
		//this.root = (this.host.indexOf('www') === 0) ? 'www.storewizard.ru' : 'storewizard.ru';
		this.mode = 'local';
		//this.mode = 'production';		
		this.url = req.url;
		this.req = req;
		this.res = res;	
		this.sitemap = [
			'/',
			'/solution/',
			'/support/',
			'/blog/'
		];
	},	
	IsApplication: function() {
		var host = this.host.split('.'),
			threshold = (this.mode == 'local') ? 1 : 2;

		if (host.length > threshold && this.url == '/') {
			return true;
		} else {
			return false;
		}
	},
	IsSite: function() {
		var that = this;
		
		var IsUrlInSiteMap = function(url) {
			for (var k in that.sitemap) {
				var item = that.sitemap[k];
				if (item == url) {
					return true;
				}
			}
			return false;
		}

		if (this.host == this.root && this.host.indexOf('www') === -1) {
			if (this.IsRequest()) {
				return true;
			} else if (IsUrlInSiteMap(this.url)) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	},
	IsRequest: function() {
		return this.url.indexOf('/?') === -1 ? false : true;
	},
	IsRoute: function(url) {
		var tmp = this.url.split('/'),
			last = tmp[tmp.length-1];

		if (last.indexOf('.') === -1) {
			return true;
		} else {
			return false;
		}
	},
	IsResource: function() {
		if (!this.IsSite() && !this.IsRoute() && !this.IsRequest()) {
			return true;
		} else {
			return false;
		}
	},
	IsUserAuth: function() {
		return (typeof this.req.session != 'undefined' && typeof this.req.session.user != 'undefined') 
			? true : false;
	},
	GetApplication: function() {
		var host = this.host.split('.'),			
			threshold = (this.mode == 'local') ? 1 : 2;

		this.dest = '/desktop';

		var params = {
			layout: false,
			pageTitle: 'Storewizard - homewallet',
			appType: 'homewallet',
			appVersion: '1.1 beta'
		}
		if (this.IsUserAuth()) {
			this.res.render('storewizard', params);			
		} else {
			this.res.render('welcome', params);
		}
	},
	GetSite: function() {
		var that = this;
		
		var template = that.url.split('/').join('');
		
		if (template == '') {
			template = 'index';
		}
		that.dest = '/site';

		switch (template) {
			default:
			case 'index':
			case 'solution':
				Api.GetProductList(function(err, products) {		
					if (err) {
						that.res.render('error', {
							message: err
						});
					} else {				
						that.res.render(template, {
							products: products
						});				
					}
				});				
				break;
				
			case 'support':
				Api.GetSupportList(function(err, response, faq, offer) {
					if (err) {
						that.res.render('error', {
							message: err
						});
					} else {				
						that.res.render(template, {
							response: response,
							faq: faq,
							offer: offer
						});				
					}
				});
				break;
				
			case 'blog':
				Api.GetBlogList(function(err, business, soft, other, news) {
					if (err) {
						that.res.render('error', {
							message: err
						});						
					} else {
						that.res.render(template, {
							business: business,
							soft: soft,
							other: other,
							news: news
						});
					}
				});
				break;
		}
	},
	GetResource: function() {	
		var that = this; 
		
		this.dest = '/site/';
		var CutSiteMapFromUrl = function(url) {
			for (var k in that.sitemap) {
				var item = that.sitemap[k];

				if (item != '/') {
					url = url.split(item).join('');
				}
			}
			return url;
		}

		this.res.sendfile('public'+this.dest+CutSiteMapFromUrl(this.url));
	},
	SendError: function(msg) {		
		this.res.render('error', {
			message: msg
		});
	}
}
var Api = {
	Init: function(req, res) {
		Routes.Init.call(this, req, res);
		this.task = this.GetTask();
		this.client = this.GetClient();
	},
	IsValidRequest: function() {
		// Проверяем запрос. Считаем CRC
		return true;
	},
	IsValidUser: function(callback) {
		require('./clients.js').Find(this.client, function(err, results) {
			if (err) {
				callback(false);
			}else {		
				callback(results);
			}
		});
	},
	IsValidDatabase: function(params) {
		var mysql = require('mysql');

		this.db = mysql.createConnection({
			user: params.login,
			password: params.password,
			database: params.database,
			insecureAuth: true 
		});
		if (this.db) {
			this.db.query('SET NAMES \'utf8\'');
			return true;
		} else {
			return false;
		}
	},
	IsSite: function() {
		return Routes.IsSite.call(this);
	},
	IsRequest: function() {
		return Routes.IsRequest.call(this);
	},
	IsApplication: function() {
		var host = this.host.split('.'),
			threshold = (this.mode == 'local') ? 1 : 2;

		if (host.length > threshold) {
			return true;
		}else {
			return false;
		}
	},	
	GetSite: function() {
		switch (this.task) {
			case 'GetProductList':
				return this.GetProductList();

			case 'GetProductPrice':
				return this.GetProductPrice();

			case 'GetResponseList':
				return this.GetResponseList();

			case 'GetSupportList':
				return this.GetSupportList();
			
			case 'GetFaqList':
				return this.GetFaqList();

			case 'GetOfferList':
				return this.GetOfferList();

			case 'GetBlogList':
				return this.GetBlogList();

			case 'Register':
				return this.Register();
				
			case 'SaveCallback':
				return this.SaveCallback();				
		}
	},
	GetApplication: function() {
		var that = this; 
		
		that.IsValidUser(function(result) {
			if (result === false) {
				that.SendError(msg.ERROR_USER_NOT_FOUND)
			} else if (!that.IsValidDatabase(result)) {				
				that.SendError(msg.ERROR_DB_READ)
			}
			switch (that.task) {
				case 'Echo':
					break; 

				case 'Enter':
					return that.Enter();

				case 'Logoff':
					return that.Logoff();

				case 'GetStoreList':
					return that.GetStoreList();		

				case 'GetFieldsList':
					return that.GetFieldsList();

				case 'SaveStore':
					return that.SaveStore();

				case 'GetData':
					return that.GetData();

				case 'Delete':
					return that.Delete();

				case 'Save':
					return that.Save();

				case 'SaveColumn':
					return that.SaveColumn();

				default:
					return that.SendError('command not found');
			}
		});
	},
	Enter: function() {
		var that = this,
			post = this.req.body;

		require('./welcome.js').enter(post, this.db, function(err, results) {
			if (err) {
				that.res.send({success:false, message:err});					
			} else {
				that.req.session.user = results;
				that.res.send({success:true});
			}
		});
	},
	Register: function(callback) {
		var that = this,
			post = this.req.body;

		require('./clients.js').Register(post, function(err, results) {
			if (err) {
				if (typeof callback == 'undefined') {
					that.res.send({success:false, message:err});					
				} else {
					callback(err);
				}
			} else {
				if (typeof callback == 'undefined') {
					that.res.send({success:true, message: msg.COMPLETE_REGISTER});
				} else {
					callback(null, results);
				}
			}
		});
	},	
	Logoff: function(callback) {
		this.req.session.destroy();
		//delete this.req.session.user;

		if (typeof callback == 'undefined') {
			this.res.send({success:true});
		} else {
			callback(null, true);
		}
	},
	GetStoreList: function() {
		var that = this;
		
		require('./storewizard.js').GetStoreList(this.db, function(err, results) {
			if (err) {
				that.res.send({success:false, message:err});					
			} else {
				that.res.send({success:true, data: results});
			}
		});		
	},
	GetProductList: function(callback) {
		var that = this;
		
		require('./clients.js').GetProductList(function(err, results) {
			if (err) {
				if (typeof callback == 'undefined') {
					that.res.send({success:false, message:err});					
				} else {
					callback(err);
				}
			} else {
				if (typeof callback == 'undefined') {
					that.res.send({success:true, data: results});
				} else {
					callback(null, results)
				}
			}
		});		
	},
	GetProductPrice: function(key, callback) {
		var that = this,
			post = this.req.body;

		require('./clients.js').GetProductPrice(post.product, function(err, results) {
			if (err) {
				if (typeof callback == 'undefined') {
					that.res.send({success:false, message:err});					
				} else {
					callback(err);
				}
			} else {
				if (post.period == 1) {
					results = {total: parseInt(results), permonth: results, discount: '0'}
				} else if (post.period == 3) {
					results = {total: parseInt(results*3*0.95), permonth: results, discount: '5%'}
				} else if (post.period == 6) {
					results = {total: parseInt(results*6*0.90), permonth: results, discount: '10%'}
				} else if (post.period == 12) {
					results = {total: parseInt(results*12*0.85), permonth: results, discount: '15%'}
				} else {
					results = {total: 0, permonth: 0, discount: '0'}
				}
				if (typeof callback == 'undefined') {
					that.res.send({success:true, data: results});
				} else {
					callback(null, results)
				}
			}
		});		
	},	
	GetResponseList: function(callback) {
		var that = this;
		
		require('./clients.js').GetResponseList(function(err, results) {
			if (err) {
				if (typeof callback == 'undefined') {
					that.res.send({success:false, message:err});					
				} else {
					callback(err);
				}
			} else {
				if (typeof callback == 'undefined') {
					that.res.send({success:true, data: results});
				} else {
					callback(null, results)
				}
			}			
		});
	},
	GetSupportList: function(callback) {
		var that = this;
		
		that.GetResponseList(function(err, response) {
			if (err) {
				if (typeof callback == 'undefined') {
					that.res.send({success:false, message:err});					
				} else {
					callback(err);
				}
			} else {
				that.GetFaqList(function(err, faq) {
					if (err) {
						if (typeof callback == 'undefined') {
							that.res.send({success:false, message:err});					
						} else {
							callback(err);
						}
					} else {
						that.GetOfferList(function(err, offer) {
							if (err) {
								if (typeof callback == 'undefined') {
									that.res.send({success:false, message:err});					
								} else {
									callback(err);
								}
							} else {
								if (typeof callback == 'undefined') {
									that.res.send({success:false, response: response, faq:faq, offer:offer});	
								} else {
									callback(null, response, faq, offer)
								}								
							}							
						});
					}
				});
			}			
		})
	},	
	GetFaqList: function(callback) {
		var that = this;
		
		require('./clients.js').GetFaqList(function(err, results) {
			if (err) {
				if (typeof callback == 'undefined') {
					that.res.send({success:false, message:err});					
				} else {
					callback(err);
				}
			} else {
				if (typeof callback == 'undefined') {
					that.res.send({success:true, data: results});
				} else {
					callback(null, results)
				}
			}			
		});	
	},
	GetOfferList: function(callback) {
		var that = this;
		
		require('./clients.js').GetOfferList(function(err, results) {
			if (err) {
				if (typeof callback == 'undefined') {
					that.res.send({success:false, message:err});					
				} else {
					callback(err);
				}
			} else {
				if (typeof callback == 'undefined') {
					that.res.send({success:true, data: results});
				} else {
					callback(null, results)
				}
			}			
		});	
	},	
	GetBlogList: function(callback) {
		var that = this;
		
		require('./clients.js').GetBlogList(function(err, results) {
			if (err) {
				if (typeof callback == 'undefined') {
					that.res.send({success:false, message:err});					
				} else {
					callback(err);
				}
			} else {
				if (typeof callback == 'undefined') {
					that.res.send({success:true, data: results});
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
					callback(null, business, soft, other, news);
				}
			}			
		});			
	},
	GetFieldsList: function() {
		var that = this;
		
		require('./storewizard.js').GetFieldsList(this.db, function(err, results) {
			if (err) {
				that.res.send({success:false, message:err});					
			} else {
				that.res.send({success:true, data: results});
			}
		});		
	},
	GetData: function() {
		var that = this,
			post = this.req.body,
			store = this.GetStore();

		require('./storewizard.js').GetData(this.db, store, post, function(err, results) {
			if (err) {
				that.res.send({success:false, message:err});
			} else {
				that.res.send(results);
			}						
		});
	},
	GetTask: function() {
		var tmp = this.url.split('/?')[1].replace(/task=/, '').replace(/\//, '');
		return tmp.split('&')[0];
	},
	GetClient: function() {
		return this.req.headers.host.split('.')[0];
	},	
	GetStore: function() {
		var tmp = this.req.url.match(/store=[^\d]*/)[0].replace(/store=/, '');

		if (tmp.indexOf('&')) {
			return tmp.split('&')[0];
		} else {
			return tmp;
		}		
	},
	Delete: function() {
		var that = this,
			appType = 'homewallet',
			post = this.req.body,
			store = this.GetStore();
				
		if (appType == 'homewallet' && store == 'operation') {
			var query = "\n SELECT `subcategory`, `type`, DATE_FORMAT(`date`, '%Y-%m-%d') AS `date` "+
						"\n FROM `store_operation`"+
						"\n WHERE `id` IN ("+post.id+")";
					
			this.db.query(query, function(err, buffer) {
				if (err) {
					that.res.send({success:false, message:err});
				} else {
					require('./storewizard.js').Delete(that.db, store, post, function(err) {
						if (err) {
							that.res.send({success:false, message:err});
						} else {
							require('./homewallet.js').Delete(that.db, buffer, function(err) {
								if (err) {
									that.res.send({success:false, message:err});
								} else {
									that.res.send({success:true});
								}
							});
						}						
					});	
				}
			})
		} else {
			require('./storewizard.js').Delete(that.db, store, post, function(err) {
				if (err) {
					that.res.send({success:false, message:err});
				} else {
					that.res.send({success:true});
				}						
			});				
		}
	},
	Save: function() {
		var that = this,
			post = this.req.body,
			appType = 'homewallet',
			store = this.GetStore();

		require('./storewizard.js').Save(this.db, store, post, function(err, results) {
			if (err) {
				that.res.send({success:false, message:err});
			} else {
				if (appType == 'homewallet' && store == 'operation') {
					require('./homewallet.js').Save(that.db, post, function(err, results) {
						if (err) {
							that.res.send({success:false, message:err});
						} else {
							that.res.send({success:true});	
						}
					});
				} else {
					that.res.send({success:true});
				}				
			}
		});			
	},
	SaveStore: function(callback) {
		var that = this,
			post = this.req.body;
		
		require('./storewizard.js').SaveStore(this.db, post, function(err, results) {
			if (err) {
				that.res.send({success:false, message: err});
			} else {
				that.res.send({success:true, data: results});
			}
		});		
	},	
	SaveColumn: function() {
		var that = this,
			post = this.req.body,
			store = this.GetStore();
					
		require('./storewizard.js').SaveColumn(this.db, store, post, function(err, results) {
			if (err) {
				that.res.send({success:false, message: err});
			} else {
				that.res.send({success:true, data: results});
			}
		});				
	},
	SaveCallback: function() {
		var that = this,
			post = this.req.body;
			
		require('./clients.js').SaveCallback(post, function(err, results) {
			if (err) {
				if (typeof callback == 'undefined') {
					that.res.send({success:false, message:err});					
				} else {
					callback(err);
				}
			} else {
				if (typeof callback == 'undefined') {
					that.res.send({success:true, message: results});
				} else {
					callback(null, results)
				}
			}			
		});
	},
	SendError: function(msg) {
		this.res.render('error', {
			message: msg
		});
	}	
}
module.exports = function(app) {
	app.get('/*', function(req, res, next) {
		Routes.Init(req, res);

		if (Routes.IsSite()) {	
			return Routes.GetSite();
		} else if (Routes.IsApplication()) {
			return Routes.GetApplication();
		} else if (Routes.IsResource()) {
			return Routes.GetResource();
		} else {
			return Routes.SendError(msg.ERROR_404);
		}		
	});
	app.post('/*', function(req, res) {
		Api.Init(req, res);
		
		if (Api.IsSite()) {
			return Api.GetSite();
		} else if (Api.IsApplication()) {
			return Api.GetApplication();
		} else {
			return Api.SendError(msg.ERROR_404);
		}
	});
}