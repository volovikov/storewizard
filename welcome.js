module.exports = {
	/**
	 * @param post данные от пользователя {login: some, password: some}	
	 * @param callback функция, которая вызывается в случае 
	 */
	Enter: function(post, client, callback) {
        if (typeof post == 'undefined') {
            return callback(true, msg.ERROR_GET_PARAM);
        } else if (typeof post.login == 'undefined') {
			return callback(true, msg.ERROR_GET_PARAM);
		} else if (typeof post.password == 'undefined') {
            return callback(true, msg.ERROR_GET_PARAM);
        }
        var mysql = require('mysql'),
			db = mysql.createConnection({
				insecureAuth: true,
				user: client.login,
				password: client.password,
				database: client.database,
				multipleStatements: true
			});

		db.query('SET NAMES \'utf8\'');			
            
		var query = '\n SELECT `id` '+
					'\n FROM `store_members` '+
					'\n WHERE `activity` = \'Да\' AND `login` = \''+post.login+'\' AND `password` = AES_ENCRYPT(\''+post.password+'\', \'Rktc4i!\')'+
					'\n LIMIT 1';
		db.query(query, function(err, results) {
				if (err) {
					return callback(true, msg.ERROR_DB_READ);
				} else if (results.length == 0) {
					return callback(true, msg.ERROR_USER_NOT_FOUND);
				} else {
					return callback(false, results);
				}
			}
		);
	},
    Leave: function(post, client, callback) {
        if (typeof post.sig == 'undefined') {
            return callback(true, msg.ERROR_GET_PARAM);
        } else if (client.GetSig() !== post.sig) {
            return callback(true, msg.ERROR_GET_PARAM);
        } else {
            return callback(false);
        }
    },
	Remind: function() {
		
	}	
}