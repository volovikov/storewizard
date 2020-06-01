/**
 * Что такое SaveField и SaveColumn 
 * в чем разница?
 * 
 * @param {type} client
 * @returns {Api}
 */
var Api = function(client) {
    //mysql = require('mysql');	
    this.client = client;
    this.storelist = [];
    this.fieldlist = [];
    this.where = [];
}
Api.prototype = {
	IsValidSignature: function(sig) {
        return  this.client.GetSig() == sig ? true : false;
	},
	GetWhere: function(store, params, callback) {
		var that = this,
            where = [],
            date = {},
			db = this.client.GetDatabaseConnection(),
            field;

		var IsSearchMode = function() {
			for (var key in params) {
				if (key == 'search') {
					return true;
				} 
			}
			return false;
		}
        var GetSearchWord = function() {
			for (var key in params) {
				if (key == 'search') {
					return params[key];
				} 
			}            
            return false;
        }
		for (var key in params) {
			var value = params[key];

			if (value) {
				if (key.indexOf('_begin') !== -1) {
					var field = key.substr(0, key.length - 6);
					date.begin = value;
					params[field] = date;
				} else if (key.indexOf('_end') !== -1) {
					var field = key.substr(0, key.length - 4);
					date.end = value;
					params[field] = date;
				}
			}
		}
		if (IsSearchMode()) {
            that.GetFields(store, function(err, fields) {
                for (var i in fields.results) {
                    var field = fields.results[i];

                    if (field.dataType != 'password') {
                        where.push('`'+field.dataIndex+'` LIKE '+db.escape('%'+GetSearchWord()+'%'));
                    }
                }
                return callback(false, '\n WHERE '+where.join(' OR '));                
            });        
		} else {		
            that.GetFields(store, function(err, fields) {
                for(var i in fields.results) {
                    var field = fields.results[i];

                    for (var key in params) {
                        var value = params[key];

                         if (key == field.dataIndex) {
                            switch(field.dataType) {
                                default:
                                case 'varchar':
                                case 'text':
                                    where.push(' AND `' + key + '` = \'' + value + '\'');
                                    break;

                                case 'datetime':
                                    if (typeof value == 'object') {
                                        where.push(' AND DATE(`' + key + '`) BETWEEN \'' + value.begin + '\' AND \'' + value.end + '\'');
                                    } else	{ 
                                        where.push(' AND DATE(`' + key + '`) = \'' + $value + '\'');
                                    }
                                    break;

                                case 'money':
                                case 'int':
                                case 'multiselect':
                                case 'select':
                                    var result = [];
                                    var set = value.split(',');

                                    if (set) {
                                        for(var j in set) {
                                            var s = set[j];
                                            result.push(db.escape(s));
                                        }
                                        where.push(' AND `' + key + '` IN (' + result.join(',') + ')');
                                    } else {
                                        where.push(' AND `' + key + '` IN (' + db.escape(value) + ')');
                                    }
                                    break;

                                case 'link':
                                    var result = [];
                                    var set = value.split(',');

                                    if (set) {
                                        for(var j in set) {
                                            var s = set[j];
                                            result.push(db.escape(s));
                                        }
                                        where.push(' AND `' + key + '_id` IN (' + result.join(',') + ')');
                                    } else {
                                        where.push(' AND `' + key + '_id` IN (' + db.escape(value) + ')');
                                    }
                                    break;
                            }
                        }
                    }
                }
                if (where.length != 0) {
                   return callback(false, "\n WHERE " + where.join('').substr(5));
                } else {
                   return callback(false, '');
                }            
            });
		}
	},
	GetStoreList: function(callback) {
		var db = this.client.GetDatabaseConnection();

		if (this.storelist.length != 0) {
			return callback(false, this.storelist);
		}
		var query = '\n SELECT * ' +
					'\n FROM `store` ' +
					'\n ORDER BY `order`';

		db.query(query, function(err, results) {
			if (err) {
				return callback(true, msg.ERROR_DB_READ);
			} else if(results.length == 0) {
				return callback(true, msg.ERROR_DB_READ);
			} else {
				return callback(false, this.storelist = results);
			}
		});
	},
	GetFields: function(store, callback) {
		var db = this.client.GetDatabaseConnection(),
			that = this;

		if (typeof that.fieldlist != 'undefined' && typeof that.fieldlist[store] != 'undefined') {
			return callback(false, that.fieldlist[store]);
		}
		var query = '\n SELECT `a`.id AS `uId`, `a`.`name` AS `header`, `a`.`key` AS `dataIndex`, `b`.`key` AS `dataType`, \'true\' AS \'sortable\', `a`.`link`, `a`.`value`, `a`.`anchor`, `a`.`action`, `a`.`attr`, `a`.`mandatory`, `a`.`display`, `a`.`order`, \'\' AS `options` ' +
					'\n FROM `store_' + store + '_fields` AS `a` ' +
					'\n LEFT JOIN `store_fields` AS `b` ON `b`.`id` = `a`.`typeId` ' +
					'\n ORDER BY `a`.`order`';

		db.query(query, function(err, results) {
			if (err) {
				return callback(true, msg.ERROR_DB_READ);
			} else if (results.length == 0) {
				return callback(true, msg.ERROR_DB_READ);
			} else {
				for (var i in results) {
					var item = results[i];

					if (item.dataType == 'select' || item.dataType == 'multiselect') {
						results[i].options = item.value.replace(/'/g, "").split(',');
					} else if(item.dataType == 'link') {
						// TODO: 
						// тут нужно сделать один большой запрос, разделенный  ;  
						// его выполнить, а не ждать подзапроса
						var subquery = '\n SELECT `id`, `' + item.value + '` AS `value` FROM `store_' + item.link + '` ';

						(function(query, index) {
							db.query(query, function(err, options) {
								var tmp = {};

								for(var j in options) {
									var o = options[j];
									tmp[o.id] = o.value;
								}
								results[index].options = tmp;
							})
						})(subquery, i);
					}
				}
				if (typeof subquery != 'undefined') {
					db.query('end', function() {
						return callback(false, that.fieldlist[store] = {store: store, results: results});
					});
				} else {
					return callback(false, that.fieldlist[store] = {store: store, results: results});
				}
			}
		});
	},
	GetFieldsOptions: function(value, link, callback) {
        var db = this.client.GetDatabaseConnection(),
            query = '\n SELECT `id`, `' + value + '` AS `value` ' +
					'\n FROM `store_' + link + '` ';

		db.query(query, function(err, results) {
			if (err)	{ 
				return callback(true, msg.ERROR_DB_READ);
			} else {
				return callback(false, results);
			}
		});
	},
	GetFieldsList: function(callback) {
		var that = this;

		that.GetStoreList(function(err, storelist) {
			if (err) {
				return callback(true, msg.ERROR_DB_READ);
			} else {
				var array = {
					total: function() {
						var total = -1;
						for(var i in this) {
							total++;
						}
						return total;
					}
				};
				var error = null;
				var total = storelist.length;

				for (var index in storelist) {
					var store = storelist[index];

					that.GetFields(store.key, function(err, fields) {
						if (err) {
							error = msg.ERROR_DB_READ;
						} else if(fields.length == 0) {
							error = msg.ERROR_DB_READ;
						} else {
							array[fields.store] = fields.results;
						}
						if (total == array.total()) {
							return callback(false, array);
						} else if (total == parseInt(index) + 1 && error) {
							return callback(true, error);
						}
					});
				}				
			}			
		});
	},
	GetData: function(store, params, callback) {
		var that = this,
            db = this.client.GetDatabaseConnection();

		if (typeof params.start == 'undefined') {
			params.start = 0;
		}
		if (typeof params.limit == 'undefined') {
			params.limit = 50;
		}
		var MakeQuery = function(fields, callback) {
			var s = [],                
                query;

			for (var i in fields.results) {
				var field = fields.results[i];

				if (field.dataType == 'link') {
					switch (field.action) {
						case 'summ':
							s.push('\n (SELECT SUM(`' + field.value + '`) FROM `store_' + field.link + '` AS `d' + field.link.substr(0, 1) + '` WHERE `d' + field.link.substr(0, 1) + '`.`' + field.anchor + '` = `zz`.`id`) AS `' + field.dataIndex + '`, `zz`.`' + field.dataIndex + '` AS `' + field.dataIndex + '_id`,');
							break;

						case 'count':
							s.push('\n (SELECT COUNT(*) FROM `store_' + field.link + '` AS `d' + field.link.substr(0, 1) + '` WHERE `d' + field.link.substr(0, 1) + '`.`' + field.anchor + '` = `zz`.`id`) AS `' + field.dataIndex + '`, `zz`.`' + field.dataIndex + '` AS `' + field.dataIndex + '_id`,');
							break;

						default:
						case 'action':
							s.push('\n (SELECT `' + field.value + '` FROM `store_' + field.link + '` AS `d' + field.link.substr(0, 1) + '` WHERE `d' + field.link.substr(0, 1) + '`.`' + field.anchor + '` = `zz`.`' + field.dataIndex + '` ORDER BY `' + field.value + '` DESC LIMIT 1) AS `' + field.dataIndex + '`, `zz`.`' + field.dataIndex + '` AS `' + field.dataIndex + '_id`,');
							break;
					}
				} else if(field.dataType == 'datetime') {
					s.push(' DATE_FORMAT(`zz`.`' + field.dataIndex + '`, \'%Y-%m-%d\') AS `' + field.dataIndex + '`,');
				} else if(field.dataType == 'password')	{

				} else {
					s.push('`zz`.`' + field.dataIndex + '`,');
				}
			}
			var select = s.join('');
			select = '\n SELECT ' + select.substr(0, select.length - 1);

			var from = '\n FROM `store_' + store + '` AS `zz` ';
			var limit = '\n LIMIT ' + params.start + ', ' + params.limit + ' ';
			var order = '\n ORDER BY `id` DESC '

            that.GetWhere(store, params, function(err, where) {
                if (where != '') {
                    query = '\n SELECT *' +
                            '\n FROM (' +
                                select +
                                from +
                            '\n ) AS `find`' +
                            where +
                            order +
                            limit;
                } else {
                    query = select +
                            from +
                            where +
                            order +
                            limit;
                }
                return callback(false, query);
            });
		}
        var MakeReferense = function(data, fields) {
            for (var i in data) {
                for (var j in data[i]) {
                    for (var k in fields.results) {
                        var key = j,
                            value = data[i][j],
                            field = fields.results[k];

                        if (field.dataIndex == key && field.dataType == 'link') {
                            if (field.action == 'last') {
                                data[i][key] = '<a href=\'#store/' + field.link + '/' + field.anchor + '/' + data[i][key + '_id'] + '/\'>' + value + '</a>';
                            } else {
                                data[i][key] = '<a href=\'#store/' + field.link + '/' + field.anchor + "/" + data[i].id + '/\'>' + value + '</a>';
                            }
                        }
                    }
                }
            }
            return data;
        }
		that.GetDataTotal(store, params, function(err, total) {
			that.GetFields(store, function(err, fields) {
                MakeQuery(fields, function(err, query) {
                    db.query(query, function(err, results) {
                        if (err) {
                            return callback(true, msg.ERROR_DB_READ);
                        } else if (results.length == 0) {
                            return callback(true, msg.ERROR_RECORDS_NOT_FOUND);
                        } else {
                            return callback(false, {total: total, results: MakeReferense(results, fields)});
                        }
                    });                    
                })
			});
		});
	},
	GetDataTotal: function(store, params, callback) {
		var that = this,
            db = this.client.GetDatabaseConnection();

		var MakeQuery = function(fields, callback) {
			var s = [],
                query;

			for (var i in fields.results) {
				var field = fields.results[i];

				if (field.dataType == 'link') {
					switch(field.action) {
						case 'summ':
							s.push('(SELECT SUM(`' + field.value + '`) FROM `store_' + field.link + '` AS `d' + field.link.substr(0, 1) + '` WHERE `d' + field.link.substr(0, 1) + '`.`' + field.anchor + '` = `zz`.`id`) AS `' + field.dataIndex + '`, `zz`.`' + field.dataIndex + '` AS `' + field.dataIndex + '_id`,');
							break;

						case 'count':
							s.push('(SELECT COUNT(*) FROM `store_' + field.link + '` AS `d' + field.link.substr(0, 1) + '` WHERE `d' + field.link.substr(0, 1) + '`.`' + field.anchor + '` = `zz`.`id`) AS `' + field.dataIndex + '`, `zz`.`' + field.dataIndex + '` AS `' + field.dataIndex + '_id`,');
							break;

						default:
						case 'action':
							s.push('(SELECT `' + field.value + '` FROM `store_' + field.link + '` AS `d' + field.link.substr(0, 1) + '` WHERE `d' + field.link.substr(0, 1) + '`.`' + field.anchor + '` = `zz`.`' + field.dataIndex + '` ORDER BY `' + field.value + '` DESC LIMIT 1) AS `' + field.dataIndex + '`, `zz`.`' + field.dataIndex + '` AS `' + field.dataIndex + '_id`,');
							break;
					}
				} else {
					s.push('`zz`.`' + field.dataIndex + '`,');
				}
			}
			var select = s.join('');
			var from = '\n FROM `store_' + store + '` AS `zz`';

            that.GetWhere(store, params, function(err, where) {
                if (where != '') {
                    query = '\n SELECT COUNT(*) AS `total` ' +
                            '\n FROM (' +
                                "\n SELECT " + select.substr(0, select.length - 1) +
                                from +
                            '\n ) AS `find`' +
                            where;
                } else {
                    query = '\n SELECT COUNT(*) AS `total` ' +
                            from;
                }                
                return callback(false, query);
            });			
		}
		this.GetFields(store, function(err, fields) {
			MakeQuery(fields, function(err, query) {
                db.query(query, function(err, results) {
                    if (err) {
                        return callback(true, msg.ERROR_DB_READ);
                    } else if(results.length == 0) {
                        return callback(true, msg.ERROR_DB_READ);
                    } else {
                        return callback(false, results[0].total);
                    }
                });                
            });
		});
	},
	Save: function(store, params, callback) {
        var db = this.client.GetDatabaseConnection(),
            appType = this.client.GetAppType();

		if (typeof params['-id'] != 'undefined') {
			var isNew = typeof params['-id'] == 'undefined' || params['-id'] == '' ? true : false;
		} else {
			var isNew = typeof params.id == 'undefined' || params.id == '' ? true : false;
		}
		if (!isNew) {
			var set = [],
				id = typeof params['-id'] != 'undefined' ? params['-id'] : params.id;

			for (var key in params) {
				var value = params[key];

				if (key.indexOf('_id') != -1) {
					key = key.replace(/_id/g, '');
				}
				if (key.indexOf('-') != -1) {
					key = key.replace(/-/g, '');
				}
				if (key == 'password') {
					set.push('`' + key + '` = AES_ENCRYPT(\'' + value + '\', \'Rktc4i!\')');
				} else {
					set.push('`' + key + '` = ' + db.escape(value));
				}
				var query = '\n UPDATE `store_' + store + '` SET ' + set.join(',') +
							'\n WHERE `id` = \'' + id + '\'';
			}
		} else {
			var fields = ['`id`'],
				values = [];

			for(var key in params) {
				var value = params[key];

				if (key.indexOf('_id') != -1) {
					key = key.replace(/_id/g, '');
				}
				/**
				* Мобильная версия storewizard поля с прификсом '-'
				* отправляет. В senchatouch глюк
				*/
				if (key.indexOf('-') != -1) {
					key = key.replace(/-/g, '')
				}
				if (key == 'password' && value) {
					values.push("AES_ENCRYPT('" + value + "', 'Rktc4i!')");
				} else {
					values.push(db.escape(value));
				}
				fields.push("`" + key + "`")
			}
			var query = "\n INSERT INTO `store_" + store + "` (" + fields.join(",") + ")" +
						"\n VALUES (null, " + values.join(", ") + ")";
		}
		db.query(query, function(err, results) {
			if (err) {
				return callback(true, msg.ERROR_DB_READ);
			} else {
                if (appType == 'homewallet') {
                    require('./homewallet.js').Save(db, params, function(err) {
                        if (err) {
                            return callback(true, msg.ERROR_DB_READ);
                        } else {
                            callback(false);
                        }
                    });
                } else {
                    return callback(false);
                }				
			}
		});
	},
    AddStore: function(params, callback) {
        var db = this.client.GetDatabaseConnection();
        
        var CreateTableFields = function(store, callback) {
            var query = "\n CREATE TABLE IF NOT EXISTS `store_"+store+"_fields` ("+
                        "\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
                        "\n `key` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
                        "\n `typeId` tinyint(4) NOT NULL,"+
                        "\n `order` tinyint(4) NOT NULL,"+
                        "\n `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
                        "\n `link` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
                        "\n `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
                        "\n `anchor` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
                        "\n `action` enum('','summ','last','count') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
                        "\n `attr` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
                        "\n `mandatory` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
                        "\n `display` tinyint(4) NOT NULL DEFAULT '1',"+
                        "\n PRIMARY KEY (`id`),"+
                        "\n KEY `key` (`key`),"+
                        "\n KEY `type_id` (`typeId`)"+
                        "\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;";
                    
            db.query(query, function(err, results) {
                if (err) {
                    return callback(true, msg.ERROR_DB_READ);
                } else {
                    return callback(false);
                }
            });                    
        }        
    },
	SaveStore: function(params, callback) {
		var db = this.client.GetDatabaseConnection();
            query = '';
        
        var IsNewRecord = function() {
            return typeof params.id == 'undefined' || params.id == '' ? true : false;
        };
        var GetUpdateQuery = function() {
			var set = [];

			for(var key in params) {
				var value = params[key];
				set.push('`' + key + '` = ' + db.escape(value));
			}
			var query = '\n UPDATE `store` SET ' + set.join(',') +
                    	'\n WHERE `id` = \'' + params.id + '\'';
            
            return query;
        };
        var GetInsertQuery = function() {
			var fields = ['`id`'],
				values = [];

			for (var key in params) {
				var value = params[key];

				if (value) {
					fields.push("`" + key + "`")
				}
				values.push(db.escape(value));
			}
			var query = "\n INSERT INTO `store` (" + fields.join(",") + ")" +
                    	"\n VALUES (null, " + values.join(", ") + ")";
                
            return query;            
        };
		if (!IsNewRecord()) {
            query = GetUpdateQuery();
		} else {
            query = GetInsertQuery();
		}
		db.query(query, function(err, results) {
			if (err) {
				return callback(true, msg.ERROR_DB_READ);
			} else {
				return callback(false);
			}
		});
	},
    DeleteStore: function(params, callback) {
        var db = this.client.GetDatabaseConnection();

        var query = '\n DROP TABLE `store_'+params.store+'`;'+
                    '\n DROP TABLE `store_'+params.store+'_fields`;'+
                    '\n DELETE FROM `store` WHERE `key` = "'+params.store+'"';
            
		db.query(query, function(err, results) {
			if (err) {
				return callback(true, msg.ERROR_DB_READ);
			} else {
				return callback(false);
			}
		});
    },
	SaveColumn: function(store, params, callback) {
		var db = this.client.GetDatabaseConnection(),
			query = '';

        var IsNewRecord = function() {
            return typeof params.id == 'undefined' || params.id == '' ? true : false;
        };
        var GetUpdateQuery = function() {
			var set = [];

			for (var key in params) {
				var value = params[key];

				if (value == 'on') {
					value = '1';
				} else if(value == 'off') {
					value = '0';
				}
				set.push('`' + key + '` = ' + db.escape(value));
			}
			var query = '\n UPDATE `store_' + store + '_fields` SET ' + set.join(',') +
                    	'\n WHERE `id` = \'' + params.id + '\'';
                
            return query;
        };
        var GetInsertQuery = function() {
			var fields = ['`id`'],
				values = [];

			for (var key in params) {
				var value = params[key];

				if (value) {
					if (value == 'on') {
						value = '1';
					} else if(value == 'off') {
						value = '0';
					}
					fields.push("`" + key + "`");
					values.push(db.escape(value));
				}
			}
			var query = "\n INSERT INTO `store_" + store + "_fields` (" + fields.join(",") + ")" +
                    	"\n VALUES (null, " + values.join(", ") + ")";
            
            return query;
        };
		if (!IsNewRecord()) {
            query = GetUpdateQuery();
		} else {
            query = GetInsertQuery();
		}
		db.query(query, function(err, results) {
			if (err) {
				return callback(true, msg.ERROR_DB_READ);
			} else {
				return callback(false);
			}
		});
	},
    DeleteColumn: function(store, params, callback) {
        var db = this.client.GetDatabaseConnection();

        console.log(store, params);
    },
	SaveField: function(store, params, callback) {
		var db = this.client.GetDatabaseConnection();

		var SaveIntoFieldsTable = function(callback) {
			var fields = ['`id`'],
				values = [];

			for (var key in params) {
				var value = params[key];

				if (value) {
					fields.push("`" + key + "`");
					values.push(db.escape(value));
				}
			}			
			var query = "\n INSERT INTO `store_" + store + "_fields` (" + fields.join(",") + ")" +
						"\n VALUES (null, " + values.join(", ") + ")";

			db.query(query, function(err) {
				if (err) {
					return callback(true, msg.ERROR_DB_READ);
				} else {
					return callback(false);
				}
			});
		};
		var SaveIntoDataTable = function(callback) {
			db.query("SELECT `value` FROM `store_fields` WHERE `id` = '" + params.typeId + "'", function(err, result) {
				var fieldType = result[0].value;
				
				switch (fieldType) {
					case 'varchar':
						fieldType = 'VARCHAR(255)';
						break;
						
					case 'enum':
						fieldType = 'ENUM(' + params.value + ')';
						break;
                        
				};
				var query = "\n ALTER TABLE `store_" + store + "` ADD `" + params.key + "` "	+ fieldType + " NOT NULL";
                
				db.query(query, function(err) {
					if (err) {
						return callback(true, msg.ERROR_DB_READ);
					} else {
						return callback(false);
					}
				});
			});
			
		};
		SaveIntoFieldsTable(function(err, result) {
			if (!err) {
				SaveIntoDataTable(function(err, result) {
					if (!err) {
						callback(false);
					} else {
						callback(true, result)
					}
				});
			} else {
				callback(true, result);
			}
		});
	},   
	Delete: function(store, params, callback) {
        var db = this.client.GetDatabaseConnection(),
            appType = this.client.GetAppType(),
            query;

		if (typeof params.id == 'undefined') {
			return callback(true, msg.ERROR_GET_PARAM);
		}
        if (appType == 'homewallet') {
            /**
             * TODO
             *
             * В случае, если у нас локализация домашний кошелек,
             * я выбираю из базы все записи, которые хотим удалить,
             * потом их удаляю, и далее вызываю библиотеку homewallet
             * и пересчитываю среднее и все другие значения в таблице _losses
             * 
             */            
            query = "\n SELECT `subcategory`, `type`, DATE_FORMAT(`date`, '%Y-%m-%d') AS `date` "+
                    "\n FROM `store_operation`"+
					"\n WHERE `id` IN ("+params.id+")";

			db.query(query, function(err, tmp) {
                if (err) {
                    callback(true, msg.ERROR_DB_READ);
                } else {
                    var query = '\n DELETE FROM `store_' + store + '` WHERE `id` IN (' + params.id + ')';

                    db.query(query, function(err) {
                        if (err) {
                            return callback(true, msg.ERROR_DB_READ);
                        } else {
                            require('./homewallet.js').Delete(db, tmp, function(err) {
                                if (err) {
                                    return callback(true, msg.ERROR_DB_READ);
                                } else {
                                    return callback(false);
                                }
                            });
                        }
                    });                    
                    
                }
            });
        } else {
            query = '\n DELETE FROM `store_' + store + '` WHERE `id` IN (' + params.id + ')';

            db.query(query, function(err) {
                if (err) {
                    return callback(true, msg.ERROR_DB_READ);
                } else {
                    return callback(false);
                }
            });            
        }
	}
}
module.exports = function(client) { 
	return new Api(client);
}