/**
 *  TODO
 *  Старое !
 */
var Storewizard = function() {
	this.storelist = [];
	this.fieldlist = [];
	this.where = [];
}
Storewizard.prototype = {
	GetWhere: function(db, store, params) {
		var that = this;		
			where = [];
			date = {};

		for (var key in params) {
			var value = params[key];

			if (value) {
				if (key.indexOf('_begin') !== -1) {
					var field = key.substr(0, key.length-6);
					date.begin = value;
					params[field] = date;
				} else if (key.indexOf('_end') !== -1) {
					var field = key.substr(0, key.length-4);
					date.end = value;
					params[field] = date;
				} else if (key == 'q') {
					that.GetFields(db, store, function(err, fields) {
						for (var i in fields.results) {
							var field = fields.results[i];
							
							if (field.dataType != 'password') {
								where.push('`'+field.dataIndex+'` LIKE '+db.escape('%'+value+'%'));
							}
						}
						that.where = '\n WHERE '+where.join(' OR ');
					});
					if (that.where.length != 0) {
						return that.where;
					}
				}
			}
		}
		that.GetFields(db, store, function(err, fields) {
			for (var i in fields.results) {
				var field = fields.results[i];

				for (var key in params) {		
					var value = params[key];
		
					if (key == field.dataIndex) {
						switch (field.dataType) {
							default:
							case 'varchar':
							case 'text':
								where.push(' AND `'+key+'` = \''+value+'\'');
								break;
								
							case 'datetime':
								if (typeof value == 'object') {
									where.push(' AND DATE(`'+key+'`) BETWEEN \''+value.begin+'\' AND \''+value.end+'\'');
								} else {
									where.push(' AND DATE(`'+key+'`) = \''+$value+'\'');
								}
								break;
								
							case 'money':
							case 'int':
							case 'multiselect':
							case 'select':							
								var result = [];
								var set = value.split(',');
								
								if (set) {
									for (var j in set) {
										var s = set[j];
										
										result.push(db.escape(s));
									}
									where.push(' AND `'+key+'` IN ('+result.join(',')+')');
								} else {
									where.push(' AND `'+key+'` IN ('+db.escape(value)+')');
								}
								break;
								
							case 'link':
								var result = [];
								var set = value.split(',');
								
								if (set) {
									for (var j in set) {
										var s = set[j];
										
										result.push(db.escape(s));
									}
									where.push(' AND `'+key+'_id` IN ('+result.join(',')+')');
								} else {
									where.push(' AND `'+key+'_id` IN ('+db.escape(value)+')');
								}								
								break;
						}
					}
				}
			}
		});
		if (where.length != 0) {
			return that.where = "\n WHERE "+where.join('').substr(5);
		} else {
			return that.where = '';
		}		
	},
	GetStoreList: function(db, callback) {
		if (this.storelist.length != 0) {
			return callback(null, this.storelist);
		}
		var query = '\n SELECT * '+
					'\n FROM `store` '+
					'\n ORDER BY `order`';

		db.query(query, function(err, results) {
			if (err) {
				return callback(msg.ERROR_DB_READ);
			} else if (results.length == 0) {
				return callback(msg.ERROR_DB_READ);
			} else {
				return callback(null, this.storelist = results);
			}
		});		
	},
	GetFields: function(db, store, callback) {
		var that = this;
		
		if (typeof that.fieldlist != 'undefined' && typeof that.fieldlist[store] != 'undefined') {
			/**
			 * TODO:
			 * Если использовать такое кеширование, то 
			 * в случае, если в онлайн сейчас сразу два пользователя, данные закешированные для 
			 * первого, отдаются второму
			 */
			//return callback(null, that.fieldlist[store]);
		}		
		var query = '\n SELECT `a`.id AS `uId`, `a`.`name` AS `header`, `a`.`key` AS `dataIndex`, `b`.`key` AS `dataType`, \'true\' AS \'sortable\', `a`.`link`, `a`.`value`, `a`.`anchor`, `a`.`action`, `a`.`attr`, `a`.`mandatory`, `a`.`display`, `a`.`order`, \'\' AS `options` '+
					'\n FROM `store_'+store+'_fields` AS `a` '+
					'\n LEFT JOIN `store_fields` AS `b` ON `b`.`id` = `a`.`typeId` '+
					'\n ORDER BY `a`.`order`';		

		db.query(query, function(err, results) {
			if (err) {
				return callback(msg.ERROR_DB_READ);
			} else if (results.length == 0) {
				return callback(msg.ERROR_DB_READ);
			} else {
				for (var i in results) {
					var item = results[i];

					if (item.dataType == 'select' || item.dataType == 'multiselect') {
						results[i].options = item.value.replace(/'/g, "").split(',');
					} else if (item.dataType == 'link') {
						var subquery = '\n SELECT `id`, `'+item.value+'` AS `value` FROM `store_'+item.link+'` ';
						
						(function(query, index) {
							db.query(query, function(err, options) {
								var tmp = {};

								for (var j in options) {
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
						callback(null, that.fieldlist[store] = {store: store, results: results});
					});
				} else {
					callback(null, that.fieldlist[store] = {store: store, results: results});
				}				
			}
		});
	},
	GetFieldsOptions: function(db, value, link, callback) {
		var query = '\n SELECT `id`, `'+value+'` AS `value` '+
					'\n FROM `store_'+link+'` ';
		
		db.query(query, function(err, results) {
			if (err) {
				return callback(msg.ERROR_DB_READ);
			} else {
				return callback(null, results);
			}
		});
	},
	GetFieldsList: function(db, callback) {
		var that = this;
		
		that.GetStoreList(db, function(err, storelist) {
			var array = {
				total: function() {
					var total = -1;
					for (var i in this) {
						total++;
					}
					return total;
				}
			};			
			var error = null;
			var total = storelist.length;

			for (var index in storelist) {				
				var store = storelist[index];
				
				that.GetFields(db, store.key, function(err, fields) {
					if (err) {
						error = msg.ERROR_DB_READ;
					} else if (fields.length == 0) {
						error = msg.ERROR_DB_READ;
					} else {
						array[fields.store] = fields.results;
					}				
					if (total == array.total()) {
						return callback(error, array);
					} else if (total == parseInt(index)+1 && error) {
						return callback(error);
					}
				});
			}
		});			
	},
	GetData: function(db, store, params, callback) {
		var that = this;			

		if (typeof params.start == 'undefined') {
			params.start = 0;
		}
		if (typeof params.limit == 'undefined') {
			params.limit = 50;
		}
		var MakeQuery = function(fields) {
			var s = [];
			var where = that.GetWhere(db, store, params); 
			var query;

			for (var i in fields.results) {
				var field = fields.results[i];

				if (field.dataType == 'link') {
					switch (field.action) {
						case 'summ':
							s.push('\n (SELECT SUM(`'+field.value+'`) FROM `store_'+field.link+'` AS `d'+field.link.substr(0,1)+'` WHERE `d'+field.link.substr(0,1)+'`.`'+field.anchor+'` = `zz`.`id`) AS `'+field.dataIndex+'`, `zz`.`'+field.dataIndex+'` AS `'+field.dataIndex+'_id`,');
							break;

						case 'count':
							s.push('\n (SELECT COUNT(*) FROM `store_'+field.link+'` AS `d'+field.link.substr(0,1)+'` WHERE `d'+field.link.substr(0,1)+'`.`'+field.anchor+'` = `zz`.`id`) AS `'+field.dataIndex+'`, `zz`.`'+field.dataIndex+'` AS `'+field.dataIndex+'_id`,');
							break;

						default:
						case 'action':
							s.push('\n (SELECT `'+field.value+'` FROM `store_'+field.link+'` AS `d'+field.link.substr(0,1)+'` WHERE `d'+field.link.substr(0,1)+'`.`'+field.anchor+'` = `zz`.`'+field.dataIndex+'` ORDER BY `'+field.value+'` DESC LIMIT 1) AS `'+field.dataIndex+'`, `zz`.`'+field.dataIndex+'` AS `'+field.dataIndex+'_id`,');
							break;
					} 
				} else if (field.dataType == 'datetime') {
					s.push(' DATE_FORMAT(`zz`.`'+field.dataIndex+'`, \'%Y-%m-%d\') AS `'+field.dataIndex+'`,');
				} else if (field.dataType == 'password') {
			
				} else {
					s.push('`zz`.`'+field.dataIndex+'`,');
				}
			}
			var select = s.join('');
				select = '\n SELECT '+select.substr(0, select.length-1);

			var from  = '\n FROM `store_'+store+'` AS `zz` ';
			var limit = '\n LIMIT '+params.start+', '+params.limit+' ';
			var order = '\n ORDER BY `id` DESC '

			if (where != '') {
				query = '\n SELECT *'+
						'\n FROM ('+
							select+
							from+
						'\n ) AS `find`'+
						where+
						order+
						limit;
			} else {
				query = select+
						from+
						where+
						order+
						limit;						
			}
	//console.log(query);
			return query;					
		}
		that.GetDataTotal(db, store, params, function(err, total) {
			that.GetFields(db, store, function(err, fields) {
				var query = MakeQuery(fields);

				db.query(query, function(err, results) {
					if (err) {
						return callback(msg.ERROR_DB_READ);
					} else if (results.length == 0) {
						return callback(msg.ERROR_RECORDS_NOT_FOUND);
					} else {
						for (var i in results) {
							for (var j in results[i]) {
								for (var k in fields.results) {									
									var key = j;													
									var value = results[i][j];
									var field = fields.results[k];
									
									if (field.dataIndex == key && field.dataType == 'link') {
										if (field.action == 'last') {
											results[i][key] = '<a href=\'#'+field.link+':'+field.anchor+'='+results[i][key+'_id']+'\'>'+value+'</a>';
										} else {
											results[i][key] = '<a href=\'#'+field.link+':'+field.anchor+"="+results[i].id+'\'>'+value+'</a>';
										}
									}
								}
							}
						}
						return callback(null, {total: total, results: results});
					}
				});
			});
		});		
	},
	GetDataTotal: function(db, store, params, callback) {
		var where = this.GetWhere(db, store, params);
console.log(2, where);
		var MakeQuery = function(fields) {			
			var s = [];
			var query;
			
			for (var i in fields.results) {				
				var field = fields.results[i];
			
				if (field.dataType == 'link') {
					switch (field.action) {
						case 'summ':
							s.push('(SELECT SUM(`'+field.value+'`) FROM `store_'+field.link+'` AS `d'+field.link.substr(0,1)+'` WHERE `d'+field.link.substr(0,1)+'`.`'+field.anchor+'` = `zz`.`id`) AS `'+field.dataIndex+'`, `zz`.`'+field.dataIndex+'` AS `'+field.dataIndex+'_id`,');
							break;

						case 'count':
							s.push('(SELECT COUNT(*) FROM `store_'+field.link+'` AS `d'+field.link.substr(0,1)+'` WHERE `d'+field.link.substr(0,1)+'`.`'+field.anchor+'` = `zz`.`id`) AS `'+field.dataIndex+'`, `zz`.`'+field.dataIndex+'` AS `'+field.dataIndex+'_id`,');
							break;

						default:
						case 'action':
							s.push('(SELECT `'+field.value+'` FROM `store_'+field.link+'` AS `d'+field.link.substr(0,1)+'` WHERE `d'+field.link.substr(0,1)+'`.`'+field.anchor+'` = `zz`.`'+field.dataIndex+'` ORDER BY `'+field.value+'` DESC LIMIT 1) AS `'+field.dataIndex+'`, `zz`.`'+field.dataIndex+'` AS `'+field.dataIndex+'_id`,');
							break;
					} 
				} else {
					s.push('`zz`.`'+field.dataIndex+'`,');
				}
			}
			var select = s.join('');
			var from  = '\n FROM `store_'+store+'` AS `zz`';

			if (where != '') {
				query = '\n SELECT COUNT(*) AS `total` '+
						'\n FROM ('+
							"\n SELECT "+select.substr(0, select.length-1)+
							from+
						'\n ) AS `find`'+
						where;					
			} else {
				query = '\n SELECT COUNT(*) AS `total` '+
						from;
			}
			return query;						
		}
		this.GetFields(db, store, function(err, fields) {
			var query = MakeQuery(fields);			

			db.query(query, function(err, results) {		
				if (err) {
					return callback(msg.ERROR_DB_READ);
				} else if (results.length == 0) {
					return callback(msg.ERROR_DB_READ);
				} else {
					return callback(null, results[0].total);
				}
			});
		});
	},
	Save: function(db, store, params, callback) {
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
					set.push('`'+key+'` = AES_ENCRYPT(\''+value+'\', \'Rktc4i!\')');
				} else {
					set.push('`'+key+'` = '+db.escape(value));
				}
				var query = '\n UPDATE `store_'+store+'` SET '+set.join(',')+
							'\n WHERE `id` = \''+id+'\'';
			}
		} else {
			var fields = ['`id`'],
				values = [];

			for (var key in params) {
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
					values.push("AES_ENCRYPT('"+value+"', 'Rktc4i!')");
				} else {
					values.push(db.escape(value));
				}
				fields.push("`"+key+"`")
			}
			var query = "\n INSERT INTO `store_"+store+"` ("+fields.join(",")+")"+
						"\n VALUES (null, "+values.join(", ")+")";
		}
//console.log(query);
		db.query(query, function(err, results) {
			if (err) {
				return callback(msg.ERROR_DB_READ);
			} else {
				return callback(null);
			}
		});		
	},
	SaveStore: function(db, params, callback) {
		var isNew = typeof params.id == 'undefined' || params.id == '' ? true : false;

		if (!isNew) {
			var set = [];
			
			for (var key in params) {
				var value = params[key];
				set.push('`'+key+'` = '+db.escape(value));
			}
			var query = '\n UPDATE `store` SET '+set.join(',')+
						'\n WHERE `id` = \''+params.id+'\'';
		} else {
			var fields = ['`id`'],
				values = [];
				
			for (var key in params) {
				var value = params[key];
				
				if (value) {
					fields.push("`"+key+"`")
				}
				values.push(db.escape(value));
			}
			var query = "\n INSERT INTO `store` ("+fields.join(",")+")"+
						"\n VALUES (null, "+values.join(", ")+")";
		}
//console.log(query);
		db.query(query, function(err, results) {
			if (err) {
				return callback(msg.ERROR_DB_READ);
			} else {
				return callback(null);
			}
		});		
	},
	SaveColumns: function(db, store, params, callback) {
		var isNew = typeof params.id == 'undefined' || params.id == '' ? true : false;
		
		if (!isNew) {
			var set = [];
			
			for (var key in params) {
				var value = params[key];
				
				if (value == 'on') {
					value = '1';
				} else if (value == 'off') {
					value = '0';
				}
				set.push('`'+key+'` = '+db.escape(value));
			}
			var query = '\n UPDATE `store_'+store+'_fields` SET '+set.join(',')+
						'\n WHERE `id` = \''+params.id+'\'';
		} else {
			var fields = ['`id`'],
				values = [];
//console.log(params);
			for (var key in params) {
				var value = params[key];
				
				if (value) {
					if (value == 'on') {
						value = '1';
					} else if (value == 'off') {
						value = '0';
					}
					fields.push("`"+key+"`")
					values.push(db.escape(value));
				}				
			}
			var query = "\n INSERT INTO `store_"+store+"_fields` ("+fields.join(",")+")"+
						"\n VALUES (null, "+values.join(", ")+")";
		}
//console.log(query);
		db.query(query, function(err, results) {
			if (err) {
				return callback(msg.ERROR_DB_READ);
			} else {
				return callback(null);
			}
		});		
	},
	Delete: function(db, store, params, callback) {
		if (typeof params.id == 'undefined') {
			return false;
		}
		var query = '\n DELETE FROM `store_'+store+'` WHERE `id` IN ('+params.id+')';

		db.query(query, function(err, results) {
			if (err) {
				return callback(msg.ERROR_DB_READ);
			} else {
				return callback(null);
			}
		});		
	}	
}
module.exports = new Storewizard();