/**
 * Файл содержит методы для работы сайта storewizard.ru
 *
 * @project storewizard
 * @section site
 * @author volovikov
 * @date 2013 december
 */
var Site = function() {
	var mysql = require('mysql'),
		mailer = require('nodemailer');

	this.smtp = mailer.createTransport('SMTP', {
		name: 'storewizard',
		debug: true
	});
	if (typeof this.db == 'undefined') {
		this.db = mysql.createConnection({
			insecureAuth: true, // Это для старых MySQL которые не поддерживают pre-4.1
			user: 'root',
			password: 'kb,thbz38',
			//password: '',
			database: 'storewizard_clients',
			multipleStatements: true
		});
	}
	if (this.db) {
		this.db.query('SET NAMES \'utf8\'');
	}
}
Site.prototype = {
    /**
     * Метод возращает список продуктов
     *
     * @return callback.err флаг ошибки true | false
     * @return callback.data json данные, список
     */
	GetProductList: function(callback) {
		var query = "\n SELECT * " +
					"\n FROM `store_product`" +
					"\n WHERE `active` = 'Да'";

		this.db.query(query, function(err, results) {
			if (err) {
				callback(true, msg.ERROR_DB_READ);
			} else if(results.length == 0) {
				callback(false, []);
			} else {
				callback(false, results);
			}
		});
	},
    /**
     * Метод возращает стоимость продукта
     *
     * @param product ключевое имя продукта (homewallet, crm и т.д.)
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	GetProductPrice: function(productKey, callback) {
		if(typeof productKey == 'undefined' || typeof productKey == 'object') {
			return callback(true, msg.ERROR_GET_PARAM);
		}
		var query = "\n SELECT `price`" +
					"\n FROM `store_product`" +
					"\n WHERE `key` = '" + productKey + "'";

		this.db.query(query, function(err, results) {
			if (err) {
				callback(true, msg.ERROR_DB_READ);
			} else if(results.length == 0) {
				callback(false, []);
			} else {
				callback(false, results[0].price);
			}
		});
	},
    /**
     * Метод возращает список отзывов пользователей
     *
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	GetResponseList: function(callback) {
		var query = "\n SELECT `id`, DATE_FORMAT(`date`, '%e %M, %Y') AS `date`, `type`, `name`, `email`, `text`, `response`, `product`, `active` " +
					"\n FROM `store_callback`" +
					"\n WHERE `type` = 'Отзывы' AND `active` = 'Да'" +
					"\n ORDER BY `date`";

		this.db.query(query, function(err, results) {
			if (err) {
				callback(true, msg.ERROR_DB_READ);
			} else if(results.length == 0) {
				callback(false, []);
			} else {
				callback(false, results);
			}
		});
	},
    /**
     * Метод возращает список faq
     *
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	GetFaqList: function(callback) {
		var query = "\n SELECT `id`, DATE_FORMAT(`date`, '%e %M, %Y') AS `date`, `type`, `name`, `email`, `text`, `response`, `product`, `active` " +
					"\n FROM `store_callback`" +
					"\n WHERE `type` = 'Вопрос ответ' AND `active` = 'Да'" +
					"\n ORDER BY `date`";

		this.db.query(query, function(err, results) {
			if (err) {
				callback(true, msg.ERROR_DB_READ);
			} else if(results.length == 0) {
				callback(false, []);
			} else {
				callback(false, results);
			}
		});
	},
    /**
     * Метод возращает список предложений
     *
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	GetOfferList: function(callback) {
		var query = "\n SELECT `id`, DATE_FORMAT(`date`, '%e %M, %Y') AS `date`, `type`, `name`, `email`, `text`, `response`, `product`, `active` " +
					"\n FROM `store_callback`" +
					"\n WHERE `type` = 'Предложения' AND `active` = 'Да'";

		this.db.query(query, function(err, results) {
			if (err) {
				callback(true, msg.ERROR_DB_READ);
			} else if(results.length == 0) {
				callback(false, []);
			} else {
				callback(false, results);
			}
		});
	},
    /**
     * Метод возращает список блогов
     *
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	GetBlogList: function(callback) {
		var query = "\n (SELECT `id`, DATE_FORMAT(`date`, '%e %M, %Y') AS `date`, `title`, `group`, SUBSTRING(`intro`, 1, 150) AS `intro`, SUBSTRING(`content`, 1, 250) AS `content` FROM `store_blog` AS `s` WHERE `group` = 'Бизнесу' ORDER BY `s`.`date` DESC LIMIT 5)" +
					"\n UNION (SELECT `id`, DATE_FORMAT(`date`, '%e %M, %Y') AS `date`, `title`, `group`, SUBSTRING(`intro`, 1, 150) AS `intro`, SUBSTRING(`content`, 1, 250) AS `content` FROM `store_blog` AS `s` WHERE `group` = 'Как пользоваться' ORDER BY `s`.`date` DESC LIMIT 5)" +
					"\n UNION (SELECT `id`, DATE_FORMAT(`date`, '%e %M, %Y') AS `date`, `title`, `group`, SUBSTRING(`intro`, 1, 150) AS `intro`, SUBSTRING(`content`, 1, 250) AS `content` FROM `store_blog` AS `s` WHERE `group` = 'Разное' ORDER BY `s`.`date` DESC LIMIT 5)" +
					"\n UNION (SELECT `id`, DATE_FORMAT(`date`, '%e %M, %Y') AS `date`, `title`, `group`, SUBSTRING(`intro`, 1, 150) AS `intro`, SUBSTRING(`content`, 1, 250) AS `content` FROM `store_blog` AS `s` WHERE `group` = 'Новости' ORDER BY `s`.`date` DESC LIMIT 5)";

		this.db.query(query, function(err, results) {
			if (err) {
				callback(true, msg.ERROR_DB_READ);
			} else if(results.length == 0) {
				callback(false, []);
			} else {
				callback(false, results);
			}
		});
	},
    /**
     * Метод возращает полную информацию о блоге
     *
     * @param blogId идентификатор блога
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	GetBlogDetail: function(blofId, callback) {

	},
    /**
     * Метод сохраняет отзыв пользователя в базе
     *
     * @param post.name имя пользователя
     * @param post.type тим отзыва отзыв | вопрос ответ | предложение
     * @param post.email емейл пользователя
     * @param post.text текст сообщения
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	SaveCallback: function(post, callback) {
		var query = "\n INSERT INTO `store_callback` (`id`, `date`, `type`, `name`, `email`, `text`, `response`, `product`, `active`, `callTime`)" +
					"\n VALUES (null, NOW(), '" + post.type + "', '" + post.name + "', '" + post.email + "', '" + post.text + "', '', '5', 'Нет', '" + post.callTime + "')";

		this.db.query(query, function(err, results) {
			if (err) {
				callback(true, msg.ERROR_DB_READ);
			} else {
				callback(false, msg.COMPLETE_SEND_MESSAGE);
			}
		});
	},
    /**
     * Метод регистрирует нового пользователя
     * Делает копию базы данные для него. Назанчает эксклюзивные права на базу и
     * отправляет уведомление на емейл если все ок
     *
     * @param post.login логин пользователя
     * @param post.name имя пользователя
     * @param post.email email пользователя
     * @param post.phone телефон пользователя
     * @param post.company название компании пользователя
     * @param post.product ключ продукта
     * @param post.period период пользование продуктом     *
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	Register: function(post, callback) {
		var that = this;

		if (typeof post == 'undefined' && post != 'object') {
			return callback(true, msg.ERROR_GET_PARAM);
		}
		this.IsPressentLogin(post.login, function(err, results) {
			if (err) {
				callback(true, err);
			} else if (results) {
				return callback(true, msg.ERROR_DUBLICAT_LOGIN);
			} else {
				that.IsPressentUser(post, function(err, results) {
					if (err) {
						callback(true, err);
					} else if (results) {
						return callback(true, msg.ERROR_DUBLICAT_USER);
					} else {
						that.RegisterUser(post, function(err, clientId) {
							if (err) {
								callback(true, err);
							} else {
								that.RegisterDatabase(post, clientId, function(err, password) {
									if (err) {
										callback(true, err);
									} else {
										that.CreateDatabase(post, password, function(err) {
											if (err) {
												callback(true, err);
											} else {
												that.RegisterUserGrant(post, password, function(err) {
													if (err) {
														callback(true, err);
													} else {
														that.SendEmail(post, password, function(err) {
															if (err) {
																callback(true, err);
															} else {
																callback(false, true)
															}
														});
													}
												});
											}
										});
									}
								})
							}
						});
					}
				});
			}
		});
	},
    /**
     * Возращает true если такой пользователь есть в списке клиентов
     *
     * @param post.email емейл пользователя
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	IsPressentUser: function(post, callback) {
		var query = "\n SELECT * " +
					"\n FROM `store_clients`" +
					"\n WHERE `email` = '" + post.email + "'" +
                    "\n LIMIT 1";

		this.db.query(query, function(err, results) {
			if (err) {
				callback(true, msg.ERROR_DB_READ);
			} else if(results.length == 0) {
				callback(false, false);
			} else {
				callback(false, true);
			}
		});
	},
    /**
     * Возращает true если база данных с именем login есть в системе
     *
     * @param login логин пользователя
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	IsPressentLogin: function(login, callback) {
		var query = "\n SELECT * " +
					"\n FROM `store_database`" +
					"\n WHERE `login` = '" + login + "'" +
                    "\n LIMIT 1";

		this.db.query(query, function(err, results) {
			if (err) {
				callback(true, msg.ERROR_DB_READ);
			} else if(results.length == 0) {
				callback(false, false);
			} else {
				callback(false, true);
			}
		});
	},
    /**
     * Метод регистрирует нового пользователя в системе
     *
     * @param post.login логин пользователя
     * @param post.name имя пользователя
     * @param post.email email пользователя
     * @param post.phone телефон пользователя
     * @param post.company название компании пользователя
     * @param post.product ключ продукта
     * @param post.period период пользование продуктом     *
     * @return callback.err флаг ошибки true | false
     * @return callback.data идентификатор пользователя
     */
	RegisterUser: function(post, callback) {
		var query = "\n INSERT INTO `store_clients` (`id`, `name`, `face`, `phone`, `status`, `intensity`, `manager`, `more`, `email`, `remark`) " +
					"\n VALUES (null, '" + post.company + "', '" + post.name + "', '" + post.phone + "', 'Новый', 0, 51, '', '" + post.email + "', '')";

		this.db.query(query, function(err, results) {
			if (err) {
				callback(msg.ERROR_DB_READ);
			} else {
				callback(null, results.insertId);
			}
		});
	},
    /**
     * Метод регистрирует права пользователя в системе
     *
     * @param post.login логин пользователя
     * @param post.name имя пользователя
     * @param post.email email пользователя
     * @param post.phone телефон пользователя
     * @param post.company название компании пользователя
     * @param post.product ключ продукта
     * @param post.period период пользование продуктом     *
     * @param password новый пароль пользователя
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	RegisterUserGrant: function(post, password, callback) {
		var query = "\n CREATE USER '" + post.login + "'@'%' IDENTIFIED BY  '" + password + "';" +
					"\n GRANT USAGE ON * . * TO  '" + post.login + "'@'%' IDENTIFIED BY  '" + password + "' WITH MAX_QUERIES_PER_HOUR 0 MAX_CONNECTIONS_PER_HOUR 0 MAX_UPDATES_PER_HOUR 0 MAX_USER_CONNECTIONS 0 ;" +
					"\n GRANT ALL PRIVILEGES ON  `storewizard_" + post.login + "` . * TO  '" + post.login + "'@'%';";

		this.db.query(query, function(err, results) {
			if (err) {
				callback(true, msg.ERROR_DB_READ);
			} else {
				callback(false);
			}
		});
	},
    /**
     * Метод регистрирует новую базу данных в системе
     *
     * @param post.login логин пользователя
     * @param post.name имя пользователя
     * @param post.email email пользователя
     * @param post.phone телефон пользователя
     * @param post.company название компании пользователя
     * @param post.product ключ продукта
     * @param post.period период пользование продуктом
     * @param clientId идентификатор, который получен в результате работы метода RegisterUser
     * @return callback.err флаг ошибки true | false
     * @return callback.data идентификатор базы данных пользователя
     */
	RegisterDatabase: function(post, clientId, callback) {
		var that = this;

        /**
         * Возращает Id продукта по ключу key
         */
		var GetProductIdFromKey = function(key, callback) {
			var query = "\n SELECT `id`" +
						"\n FROM `store_product`" +
						"\n WHERE `key` = '" + key + "'";

			that.db.query(query, function(err, results) {
				if (err) {
					callback(true, msg.ERROR_DB_READ);
				} else {
					callback(false, results[0].id);
				}
			});
		}
		GetProductIdFromKey(post.product, function(err, productId) {
			if (err) {
				callback(true, msg.ERROR_DB_READ);
			} else {
				that.CreatePassword(10, function(password) {
					var query = "\n INSERT INTO `store_database` (`id`, `client`, `database`, `login`, `password`, `product` ) " +
								"\n VALUES (null, '" + clientId + "', '" + 'storewizard_' + post.login + "', '" + post.login + "', AES_ENCRYPT('" + password + "', 'Rktc4i!'), " + productId + ")";

					that.db.query(query, function(err, results) {
						if (err) {
							callback(true, msg.ERROR_DB_READ);
						} else {
							callback(false, password);
						}
					});
				});
			}
		});
	},
    /**
     * Метод генерирует пароль
     *
     * @param length длина пароля, по умолчанию 10
     * @return callback если есть этот параметр то передает в него полученный пароль
     * @return string
     */
	CreatePassword: function(length, callback) {
		var salts = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
			makepass = '',
			length = (typeof length == 'undefined') ? 10 : length;

		for(i = 0; i < length; i++) {
			makepass += salts.charAt(Math.floor(Math.random() * salts.length - 1));
		}
		if (typeof callback != 'undefined') {
			callback(makepass);
		} else {
			return makepass;
		}
	},
    /**
     * Метод загружает файл с запросами на создание базы данных и выполняет его
     *
     * @param post.login логин пользователя
     * @param post.name имя пользователя
     * @param post.email email пользователя
     * @param post.phone телефон пользователя
     * @param post.company название компании пользователя
     * @param post.product ключ продукта
     * @param post.period период пользование продуктом
     * @param password пароль
     * @return callback.err флаг ошибки true | false
     * @return callback.data пароль
     */
	CreateDatabase: function(post, password, callback) {
		var that = this,
			query = require('./sql-homewallet.js')(post, password);

		that.db.query(query, function(err, results) {
			if (err) {
				callback(true, msg.ERROR_DB_WRITE);
			} else {
				callback(false, password);
			}
		});
	},
    /**
     * Метод отправляет оповещение пользователю
     *
     * @param post.login логин пользователя
     * @param post.name имя пользователя
     * @param post.email email пользователя
     * @param post.phone телефон пользователя
     * @param post.company название компании пользователя
     * @param post.product ключ продукта
     * @param post.period период пользование продуктом
     * @param password пароль
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо данные в случае если err = true
     */
	SendEmail: function(post, password, callback) {
		this.smtp.sendMail({
			from: 'robot@storewizard.ru',
			to: post.email,
			subject: 'Регистрационные данные с сайта storewizard.ru',
			text: 'Уважаемый клиент,' +
				'\n' +
				'\n Вы произвели регистрацию на сайте storewizard.ru' +
				'\n Используйте введенный вами Login: ' + post.login + ' и пароль: ' + password + ' для входа в систему. ' +
				'\n Адрес для входа: ' + post.login + '.storewizard.ru' +
				'\n' +
				'\n Внимание! Отвечать на это письмо не нужно, сформировано автоматически.'
		}, function(err, responseStatus) {
			if (err) {
				callback(true, responseStatus);
			} else {
				callback(false);
			}
		});
	},
    /**
     * Метод сохраняет в базу сообще с чата с сайта
     *
     * @param {type} post
     * @param {type} callback
     * @returns {undefined}
     */
	SaveChat: function(post, callback) {
        var thread = typeof post.thread == 'undefined' ? this.CreatePassword() : post.thread,
            question = typeof post.question == 'undefined' ? '' : post.question,
            answer = typeof post.answer == 'undefined' ? '' : post.answer;

        var query = "\n INSERT INTO `store_chat` (`id`, `time`, `thread`, `question`, `answer`)" +
                    "\n VALUES (null, NOW(), '" + thread+ "', '" + question + "', '" + answer + "')";

		this.db.query(query, function(err, results) {
			if (err) {
				return callback(true, msg.ERROR_DB_READ);
			} else {
				return callback(false);
			}
		});
	},
}
module.exports = new Site();