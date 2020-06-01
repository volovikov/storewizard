/**
 * Модуль работы с клиентами
 * 
 * @project storewizard
 * @section client
 * @author volovikov
 * @date 2013 december
 * 
 */
/**
 * Простой класс Клиент
 * @param property массив свойств клиента. После инициализации все 
 * свойства доступны как свойства класса Clent.name, Client.password и т.д.
 */
var Client = function(property) {
	for (var key in property) {
		this[key] = property[key];
	}
}
Client.prototype = {
    /**
     * Метод возращает Hash клиента. Если hash нет у клиента, генерирует его
     * и устанавливает его как свойство
     * 
     * @return string
     */
	GetSig: function() {
        if (typeof this.sig != 'undefined') {
            return this.sig;
        } else {
    		var crypto = require('crypto');
        	this.sig = crypto.createHash('md5').update(this.login + this.password).digest("hex");
            return this.sig;
        }
	},
    /**
     * Метод возращает базу данных клиента. Если соединение с ней ранее не было
     * установлено, производит установку и возращает соединение
     * 
     * @return database
     */
	GetDatabaseConnection: function() {
		if (typeof this.db != 'undefined') {
			return this.db;
		} else {
			var mysql = require('mysql');
			this.db = mysql.createConnection({
				insecureAuth: true,
				user: this.login,
				password: this.password,
				database: 'storewizard_'+this.login,
				multipleStatements: true
			});
			this.db.query('SET NAMES \'utf8\'');
			return this.db;
		}
	},
    /**
     * Метод возращает название базы данных клиента
     * 
     * @return string
     */
    GetDatabaseName: function() {
        return this.database;
    },
    /**
     *  Метод возращает тип приложения клиента
     *  @return homewallet | site | trade
     * 
     */
    GetAppType: function() {
        return this.appType;
    },
    /**
     * Возращем login клиента. 
     * Это то что в адреса сайта идет первым 
     * my.storewizard.ru --> вернет my
     * 
     * @return string
     *
     */
    GetLogin: function() {
        return this.login;
    },
    /**
     * Возращаем пароль пользователя
     * от базы
     *
     * @return string
     */
    GetPassword: function() {
        return this.password;
    },
    /**
     * Метод возращает версию продукта  
     * @returns {unresolved}
     */
    GetAppVersion: function() {
        return this.appVersion;
    }
}
var Clients = {
    /**
     * var buffer коллекция классов Client
     */
	buffer: {},	
    /**
     * Метод совершает поиск клиента с логин client у себя в буффере, если клиент не был найден, 
     * ищет его в общей таблице клиентов. Если в таблице клиент найден, создает простой класс Client 
     * с нужными свойствами, регистриурет у себя в буфере и возращает его в качестве параметра
     * 
     * @param client логин клиента
     * @return callback.err флаг ошибки true | false
     * @return callback.data либо сообщение об ошибки, либо класс Client
     */
	GetInstance: function(client, callback) {
		if (this.IsPressent(client)) {
			callback(false, this.buffer[client]);
		} else {
			var that = this,
				mysql = require('mysql');
				
			var query = "\n SELECT `sd`.`id`, `sd`.`database`, `sd`.`login`, CONVERT(AES_DECRYPT(`sd`.`password`, 'Rktc4i!') USING utf8) AS `password`, `sp`.`key` AS `appType`, `sp`.`version` AS `appVersion`"+
						"\n FROM `store_database` AS `sd`"+
                        "\n LEFT JOIN `store_product` AS `sp` ON `sp`.`id` = `sd`.`product`"+
						"\n WHERE `sd`.`login` = '" + client + "'"+
						"\n LIMIT 1";
                    
			this.db = mysql.createConnection({
				insecureAuth: true, // Это для старых MySQL которые не поддерживают pre-4.1
				user: 'root',
				password: 'kb,thbz38',
				//password: '',
				database: 'storewizard_clients',
				multipleStatements: true
			});
			this.db.query('SET NAMES \'utf8\'');

			this.db.query(query, function(err, results) {
				if (err) {
					callback(true);
				} else if (results.length == 0) {
					callback(true);
				} else {					
					callback(false, that.buffer[client] = new Client(results[0]));
				}
			});			
		}
	},
    /**
     * Метод возращает true если client уже есть в буфере класса
     * @param client логин клиента
     * @return bool
     */
	IsPressent: function(client) {
		if (typeof this.buffer[client] != 'undefined') {
			return true;
		} else {
			return false;
		}
	}
}
module.exports = function(client, callback) {
    return Clients.GetInstance(client, function(err, clientObject) {
        if (!err) {
            callback(false, clientObject);
        } else {
            callback(true, clientObject);
        }
    });
}