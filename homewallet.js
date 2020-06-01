var Homewallet = function() {
}
Homewallet.prototype = {
	Save: function(db, post, callback) {
		return this.Update(db, post, callback);
	},
	Delete: function(db, array, callback) {             
		for (var i in array) {
			this.Update(db, array[i], callback);
		}
	},
	Update: function(db, params, callback) {
		var year = params.date.split('-')[0],
			month = params.date.split('-')[1],
			monthWords = this.MothToWords(month),
			subcategory = params.subcategory,
			that = this;
			
		var query = "\n SELECT SUM(`sum`) AS `sum`, `category`"+
					"\n FROM `store_operation` AS `o`"+
					"\n LEFT JOIN `store_subcategory` AS `s` ON `s`.`id` = `o`.`subcategory`"+
					"\n WHERE `o`.`subcategory` = "+subcategory+" AND MONTH(`o`.`date`) = '"+month+"' AND YEAR(`o`.`date`) = '"+year+"'";
                
		db.query(query, function(err, results) {
			if (err) {
				callback(true);
			} else {
				var result = results[0];	
				var options = {
					table: params.type == 'Расход' ? 'store_losses' : 'store_profit',
					year: year,
					subcategory: subcategory,
					category: result.category,
					monthWords: monthWords,
					sum: result.sum,					
					january: (monthWords == 'january') ? result.sum : 0,
					february: (monthWords == 'february') ? result.sum : 0,
					march: (monthWords == 'march') ? result.sum : 0,
					april: (monthWords == 'april') ? result.sum : 0,
					may: (monthWords == 'may') ? result.sum : 0,
					june: (monthWords == 'june') ? result.sum : 0,
					july: (monthWords == 'july') ? result.sum : 0,
					august: (monthWords == 'august') ? result.sum : 0,
					september: (monthWords == 'september') ? result.sum : 0,
					october: (monthWords == 'october') ? result.sum : 0,
					november: (monthWords == 'november') ? result.sum : 0,
					december: (monthWords == 'december') ? result.sum : 0
				}
				that.IsPresentRecord(db, options, function(err, presents) {
					if (err) {
						callback(err);
					} else {				
						if (presents) {
							var query = "\n UPDATE `"+options.table+"` SET `"+monthWords+"` = '"+options.sum+"'"+
										"\n WHERE `year` = '"+options.year+"' AND `subcategory` = '"+options.subcategory+"'";
						} else {
							var query = "\n INSERT INTO `"+options.table+"` (`id`, `category`, `subcategory`, `year`, `january`, `february`, `march`, `april`, `may`, `june`, `july`, `august`, `september`, `october`, `november`, `december`, `average`)"+
										"\n VALUES (null, '"+options.category+"', '"+options.subcategory+"', '"+options.year+"', '"+options.january+"', '"+options.february+"', '"+options.march+"', '"+options.april+"', '"+options.may+"',  '"+options.june+"', '"+options.july+"', '"+options.august+"', '"+options.september+"', '"+options.october+"', '"+options.november+"', '"+params.december+"',  '0')";						
						}
						db.query(query, function(err) {		
							if (err) {
								callback(err);
							} else {
								that.CalcAverage(db, options, function(err, average) {					
									var query = "\n UPDATE `"+options.table+"` SET `average` = '"+average+"'"+
												"\n WHERE `subcategory` = "+options.subcategory+" AND `year` = '"+options.year+"'";

									db.query(query, function(err) {	
										if (err) {
											callback(err)
										} else {
											callback(null, true);
										}
									});
								});
							}
						});
					}
				});				
			}
		});			
	},
	IsPresentRecord: function(db, params, callback) {
		var query = "\n SELECT COUNT(*) AS `count` "+
					"\n FROM `"+params.table+"`"+
					"\n WHERE `subcategory` = '"+params.subcategory+"' AND `year` = '"+params.year+"'"
					"\n LIMIT 1";
					
		db.query(query, function(err, results) {
			if (err) {
				callback(msg.ERROR_DB_READ);
			} else if (results[0].count == 0) {
				callback(null, false);
			} else {
				callback(null, true);
			}
		})
	},
	CalcAverage: function(db, params, callback) {
		var query = "\n SELECT  `january`, `february`, `march`, `april`, `may`, `june`, `july`, `august`, `september`, `october`, `november`, `december` "+
					"\n FROM `"+params.table+"`"+
					"\n WHERE `subcategory` = '"+params.subcategory+"' AND `year` = '"+params.year+"'"
					"\n LIMIT 1";

		db.query(query, function(err, results) {
			if (err) {
				callback(err);
			} else {
				var sum = 0;

				for (var key in results[0]) {
					var item = parseInt(results[0][key]);

					if (item != 0 && !isNaN(item)) {
						sum = sum + item;
					}
				}				
				callback(null, Number(sum/12)); //<-- внмиание! на 12 месяцев делим
			}
		});
	},
	MothToWords: function(month) {
		if (month == '01') {
			return 'january';
		} else if (month == '02') {
			return 'february';
		} else if (month == '03') {
			return 'march';
		} else if (month == '04') {
			return 'april';			
		} else if (month == '05') {
			return 'may';
		} else if (month == '06') {
			return 'june';
		} else if (month == '07') {
			return 'july';			
		} else if (month == '08') {
			return 'august';			
		} else if (month == '09') {
			return 'september';
		} else if (month == '10') {
			return 'october';
		} else if (month == '11') {
			return 'november';
		} else if (month == '12') {
			return 'december';
		} else {
			return '0';
		}
	},
	WordsToMonth: function(words) {
		if (words == 'january') {
			return '01';
		} else if (words == 'february') {
			return '02';
		} else if (words == 'march') {
			return '03';
		} else if (words == 'april') {
			return '04';			
		} else if (words == 'may') {
			return '05';
		} else if (words == 'june') {
			return '06';
		} else if (words == 'july') {
			return '07';			
		} else if (words == 'august') {
			return '08';			
		} else if (words == 'september') {
			return '09';
		} else if (words == 'october') {
			return '10';
		} else if (words == 'november') {
			return '11';
		} else if (words == 'december') {
			return '12';
		} else {
			return '0';
		}
	}
}
module.exports = new Homewallet();