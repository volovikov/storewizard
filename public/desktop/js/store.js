/* 
 * @name: StoreWizard clients application part
 * @author: volovikov
 * @date: май, 2013
 * @version: 1.2 beta
 */

/*  TODO
 *  
 *  1.  baseParams убрать отовсюда. Не используется
 *  
 *  2.  В случае, если в поиски ввести чтото, что точно нельзя найти
 *      должно появляться сообщение, ичего не найдено
 *      А сейчас просто не обновляется таблица
 *      
 *  3.  Методы Filter.Set и Search.Set и Filter.Reset и Search.Reset 
 *      должны одинаково работать. Должны устанавливать значениеи 
 *      чистить поля, а не делать переходы
 *      Логика такая 
 *      OnClickReset вызывает Reset и делает Grid.Reload
 *      
 *  4.  В случае, если сделать Фильтр -> Искать. И потом, выбрать пункт на                  OK
 *      редактирование. Нажать сохранить. Далее система обновит список, но
 *      настройки фильтрации при обновлении не будут учтены, все сбросить. 
 *      Причем в фильтре будет в полях введены данных фильтрации
 *      
 *  5.  Когда я перехожу на вторую страницу и нажимаю редактировать, то после
 *      сохранения, перерисовывается страница и показывается первая,
 *      а пигинатор показывате цифру два. 
 *
 */
Store = {
	Init: function(callback) {
		var that = this;

        var GetSigFromCookie = function(callback) {
            var cookies = document.cookie.replace(' ', '').split(';');            
            
            for (var i in cookies) {
                var rec = cookies[i];

                if (typeof rec == 'string' && rec.indexOf('sig') != -1) { 
                    that.SetSig(unescape(rec.split('=')[1]));
                    return callback();
                }
            }
            Store.Window.Error('Ошибка! Сигнатура для подключение к API не найдена!');
        };
		var GetStoreList = function(callback) {
			Store.Util.Ajax({
                method: 'get',
				url: '/api/sig/' + that.GetSig() + '/storelist',
				success: function(r) {
					var response = Ext.util.JSON.decode(r.responseText);

					if (response.success) {
						that.store = response.data;
						callback();
					} else {
                        Store.Window.Error(response.message);
                    }
				}
			});
		}
		var GetFieldsList = function(callback) {
			Store.Util.Ajax({
                method: 'get',
                url: '/api/sig/' + that.GetSig() + '/fieldslist',
				success: function(r) {
					var response = Ext.util.JSON.decode(r.responseText);

					if (response.success) {
						that.fields = response.data;

						if (Ext.get('preloader')) {
							Ext.get('preloader').remove();
						}
						callback();
					} else {
                        Store.Window.Error(response.message);
                    }
				}
			});
		}
		var SetFieldsRenderer = function(callback) {
			var fields = that.fields;
			
			for (var key in fields) {
				Ext.each(fields[key], function(e, i) {
					if (typeof e.dataType != 'undefined') {
						switch (e.dataType) {
							case 'money':
								that.fields[key][i].renderer = Store.Renderer.Digit;
								break;

							case 'datetime':
								that.fields[key][i].xtype = "datecolumn";
								that.fields[key][i].format = "M d, Y";
								break;
						}
					}					
				})				
			}
			callback();
		}
		var SetTabsFromStore = function(callback) {
			that.tabs = [];
			
			Ext.each(that.store, function(e) {
				that.tabs.push({
					uId: e.id,
					id: e.key,
					title: e.name,
					layout: 'fit',
					listeners: {
						activate: function(p) {
							Store.SetStore(e.key);
							Store.Filter.Show();

							var isLoaded = p.items.length == 0 ? false : true;							
							
							if (isLoaded) {
								p.removeAll();
								p.add(Store.Grid.Show());
							} else {
                                p.add(Store.Grid.Show());
							}
							p.doLayout();
						}
					}
				});
			});
			callback();
		};     
        GetSigFromCookie(function() {
            GetStoreList(function() {
                GetFieldsList(function() {
                    SetFieldsRenderer(function() {
                        SetTabsFromStore(function() {
                            Ext.QuickTips.init();
                            Ext.form.Field.prototype.msgTarget = 'side';						
                            Store.Filter.filter = {};

                            for (var key in that) {
                                var obj = that[key];

                                if (typeof obj.Init != 'undefined') {
                                    obj.Init();
                                }
                            }
                            callback();
                        });
                    });				
                })
            });
        });
	},
	Run: function() {
		new Ext.Viewport({
			layout: 'border',
			items: [
				Store.Panel.Header(),
				Store.Panel.Filter(),
				Store.Panel.Content(),				
			]
		});
	},
	Done: function() {
		
	},
	GetFields: function(store) {
		if (typeof store == 'undefined') {
			return this.fields[this.GetStore()];
		}else {
			return this.fields[store];
		}
	},
	SetFields: function(fields) {
		this.fields = fields;
	},
	GetStore: function() {
		return this.store;
	},
	SetStore: function(store) {
		this.store = store;
	},
    GetSig: function() {
        return this.sig;
    },
    SetSig: function(sig) {
        this.sig = sig;
    },
    GetHash: function() {
        return window.location.hash.replace('#', '');
    },
    GetUrlFromParams: function(params) {
        var result = [];
        
        if (typeof params == 'undefined') {
            return '';
        } else if (typeof params.start != 'undefined' && params.limit != 'undefined') {
            result.push('/page/'+parseInt((params.start / params.limit)+1));
        }
        for (var key in params) {
            var value = params[key];
            result.push(key+'/'+value+'/');
        }
        return result.join('');        
    },
    GetParamsFromUrl: function(url) {
        var key = [], 
            value = [],
            result = {},
            url = url || Store.History.GetToken();

        if (url) {
            Ext.each(url.split('/'), function(e, i) {
                if (e != '') {
                    if ((i % 2) == 0) {
                        key.push(e);
                    }else {
                        value.push(e);
                    }
                }
            });
            Ext.each(key, function(e, i) {                    
                result[key[i]] = value[i];
            });
            return result;
        } else {
            return false;
        }        
    }
}
Store.History = {
	Init: function() {		
		Ext.History.init();
		Ext.History.on('change', function(token) {
			Store.History.OnChange(token);
		});
	},
	Add: function(token) {
		Ext.History.add(token);
	},
	OnChange : function(token) {
		/**
		 * TODO
		 * Вызываю Ext.History.add('some')
		 * вызывается этот метод
		 * соответественно и Reload уже вызывается отсюда
		 */
		var tp = Store.Panel.GetContent();

		var IssetSearchInParams = function(params) {
            return typeof params.search != 'undefined';
		}
        var IssetFilterInParams = function(params) {            
            var length = Object.keys(params).length;
            return length > 1 ? true : false;
        }
        var IssetStoreInParams = function(params) {
            return typeof params.store != 'undefined';
        }
        if (token) {
            var params = Store.GetParamsFromUrl(token);

            if (IssetSearchInParams(params)) {
                Store.Search.Set(params.search);
            } else if (IssetFilterInParams(params)) {         
                Store.Filter.Set(params);
            } else {
                Store.Filter.Reset();
                Store.Search.Reset();
            }
            if (IssetStoreInParams(params)) {
                Store.SetStore(params.store);
                tp.setActiveTab(params.store);
                tp.show();
                Store.Grid.Reload(params);
            }            
        }
	},
	GetToken: function() {
		return Ext.History.getToken()
	}
}
Store.Util = {
	Ajax: function(config) {
		if (typeof config.method == 'undefined') {
			config.method = 'post';
		}
		if (typeof config.failure == 'undefined') {
			config.failure = function() {
				Store.Window.Error('Ошибка! Не могу соединиться с сервером!');
			}
		}
		config.url = Ext.urlAppend(config.url, 'dc=' + this.GetDateTimeStamp());
		Ext.Ajax.request(config);
	},
    GetDateTimeStamp: function() {
        return (new Date().getTime());
    },
	ToArray: function(o, mode) {
		var tmp = [];

		for (var k in o) {
			if (!Ext.isFunction(o[k])) {
				if (typeof mode != 'undefined') {
					tmp.push([o[k], o[k]]);
				} else {
					tmp.push([k, o[k]]);
				}
			}
		}
		return tmp;
	}
}
Store.Panel = {
	Header: function() {
		if (typeof this.header != 'undefined') {
			return this.header;
		} else {
			this.header = new Ext.Panel({
				region: 'north',
				title: 'Storewizard',
				autoHeight: true,
				border: false,
				margins: '0 0 5 0',
				cls: 'my-panel',
				tbar: ['->',
				{
					iconCls: 'icon-wizard',
					text: 'Мастер',
					handler: function() {
						Wizard.Show();
					}
				},{
					iconCls: 'icon-privateroom',
					text: 'Личный кабинет'	
				},'-', {
					iconCls: 'icon-exit',
					text: 'Выход',
					handler: function() {
						Store.Util.Ajax({
							url: '/api/leave/',
                            params: {sig: Store.GetSig()},
							success: function(r) {
								var response = Ext.util.JSON.decode(r.responseText);
								
								if (response.success) {
									location.reload(true);
								} else {
									Store.Window.Error('Ошибка! Не могу соединиться с сервером!');
								}
							}
						});
					}
				}]
			});
			return this.header;
		}
	},
	Filter: function() {
		if (typeof this.filter != 'undefined') {
			return this.filter;
		} else {
			this.filter = new Ext.FormPanel({
				region: 'east',
				title: 'Фильтр',
				split: true,
				width: 235,
				autoScroll: true,
				labelAlign: 'top',
				collapseMode: 'mini',
				animCollapse: false,
				margins: '0 5 5 0',
				defaults: {width: 190},
				defaultType: 'textfield',
				bodyStyle:'padding:5px 5px 5px 10px;',
				tbar:[{
					text: 'Искать',
					iconCls: 'icon-find',
					handler: function() {
						Store.Filter.OnClickRun();
					}
				},{
					text: 'Сбросить',
					iconCls: 'icon-find-reset',
					handler: function() {
						Store.Filter.OnClickReset();
					}
				}]
			});	
			return this.filter;
		}
		return this.me;
	},
	Content: function() {
        if (typeof this.content != 'undefined') {
			return this.content;
		} else {
			this.content = new Ext.TabPanel({
				id: 'store',
				region: 'center',
				margins: '0 0 5 5',
				activeTab: 0,
				items: Store.tabs,
				listeners: {
					tabchange: function(p, tab) {
                        Store.Panel.OnTabChange(p, tab);
					}
				}
			});
			return this.content;
		}
	},
	GetHeader: function() {
		if (typeof this.header != 'undefined') {
			return this.header;
		}
	},
	GetFilter: function() {
		if (typeof this.filter != 'undefined') {
			return this.filter;
		}
	},
	GetContent: function() {
		if (typeof this.content != 'undefined') {
			return this.content;
		}
	},
    OnTabChange: function(p, tab) {
        /**
         * !!!
         * Это событие вызывается как в случае если человек
         * нажал сам на вкладку мышкой, так и если
         * мы искусственно переключаем вкладку командой. setActiveTab()
         * Возможно вызов этой функции произойдет в случае #/operations/some/id/12
         * из функции Store.History.OnChange
         * Важно чтобы их этой функции не было обратного вызова 
         * Store.History.Add
         */
        var params = Store.GetParamsFromUrl(),
            store = Store.GetStore();
            
        var IssetFilterInParams = function(params) {            
            var length = Object.keys(params).length;
            return length > 1 ? true : false;
        }
        if (params) {
            if (!IssetFilterInParams(params)) {
                Store.History.Add('store/'+store);
            }
            if (tab.id == params.store) {
                Store.Filter.Set(params);     
            } else {
                Store.History.Add('store/'+store);
            }
        } else {
            Store.History.Add('store/'+store);
        }
    }
}
Store.Grid = {
	OnClickDelete: function() {
		if (typeof this.me != 'undefined') {
			var s = Store.Grid.GetSelections();
			
			if (s.length) {
				Store.Window.Confirm('Вы уверены что хотите произвести удаление?', function(btn) {
					if (btn == 'ok') {
						var id = [];

						Ext.each(s, function(e) {
							id.push(e.id);
						});
						Store.Util.Ajax({
							url: '/api/sig/'+Store.GetSig()+'/store/'+Store.GetStore(),
							method: 'delete',
							success: function(r) { 
								var response = Ext.util.JSON.decode(r.responseText);
								
								if (response.success) {
									Store.Grid.Reload();
								} else {
									Store.Window.Error(response.message);
								}
							},
							params: {id:id.join(',')}
						});
					}
				});
			} else {
				Store.Window.Error('Ошибка! Вы не выборали ни одной записи');
			}
		}
	},
	OnClickEdit: function() {		
		if (typeof this.me != 'undefined') {
			var s = this.me.getSelectionModel().getSelected();
		}
		Store.Window.Edit(s.data);
	},
	OnClickAdd: function() {
		Store.Window.Edit();
	},
    OnClickBeforeChangePage: function(bbar, params) {
        var page = (params.start / 50) + 1,            
            search = Store.Search.Get(),
            store = Store.GetStore(),
            filter = Store.Filter.Get(store, true), // <-- вернуть в виде строки
            url = '';

        if (filter !== false) {
            url = filter+'/page/'+page;
        } else if (search !== false) {
            url = 'store/'+store+'/search/'+search+'/page/'+page;
        } else {
            url = 'store/'+store+'/page/'+page;
        }
        Store.Grid.page = page;
        bbar.store.proxy.setUrl('/api/sig/'+Store.GetSig()+'/'+url+'?dc='+Store.Util.GetDateTimeStamp());
    },
	Show: function() {
		var baseParams = {start:0, limit:50};
			store = '',
			fields = [],
			columns = [];

		var GetBaseParams = function() {
			return baseParams;
		}
		var GetFields = function() {
			if (fields.lengths > 1) {
				return fields;
			} else {
				var tmp = Store.GetFields();
				fields = tmp.slice();
				fields.splice(0, 0, new Ext.grid.RowNumberer());
				return fields;				
			}
		}
		var GetColumns = function() {
			if (columns.length > 1) {
				return columns;
			} else {
				Ext.each(GetFields(), function() {
					columns.push({
						name: this.dataIndex
					});
				});
				return columns;
			}
		}
		var GetStore = function() {
			if (store != '') {
				return store;
			} else {
				store = new Ext.data.Store({
					proxy: new Ext.data.HttpProxy({
						method: 'get',
						url: '/api/sig/'+Store.GetSig()+'/store/'+Store.GetStore()+'?dc='+Store.Util.GetDateTimeStamp()
					}),
					baseParams: GetBaseParams(),
					reader: new Ext.data.JsonReader({
						root: 'results',
						totalProperty: 'total',
						id: 'id'
					}, GetColumns())
				});
				return store;
			}
		}
		this.me = new Ext.grid.GridPanel({
			viewConfig: {
				forceFit: true
			},
			tbar: [{
				text: 'Добавить',
				iconCls: 'icon-add',
				handler: function() {
					Store.Grid.OnClickAdd();
				}
			},'-',{
				text: 'Удалить',
				iconCls: 'icon-delete',
				handler: function() {
					Store.Grid.OnClickDelete();
				}
			},'-',{
				text: 'Изменить',
				iconCls: 'icon-edit',
				handler: function() {
					Store.Grid.OnClickEdit();
				}
			},'->',
			new Ext.app.SearchField({
	            width:240,
				store: GetStore(),
				id: 'search-type',
				paramName: 'q'
	        })],
			stripeRows: true,
			border: false,
			store: GetStore(),
			columns: GetFields(),
			listeners: {
				rowdblclick: function(g, row, r) {
					Store.Grid.OnClickEdit();
				},
				beforerender: function(g) {
                    Store.Grid.HideUnvisibleColumn(g);
				}
			},
			bbar: new Ext.PagingToolbar({
				pageSize: 50,
				store: GetStore(),
				displayInfo: true,
				displayMsg: 'Показано {0} - {1} из {2}',
				emptyMsg: '',
                listeners: {
                    beforechange: Store.Grid.OnClickBeforeChangePage
                }
			})
		});	
		return this.me;
	},
	Reload: function(params) {
        var search = Store.Search.Get(),
            store = Store.GetStore(),
            filter = Store.Filter.Get(store, true), // <-- вернуть в виде строки
            proxy = this.me.getStore().proxy,
            page,
            url = '';

        if (typeof params == 'undefined') {
            page = Store.Grid.page || 1;
        } else if (typeof params.start == 'undefined') {
            page = Store.Grid.page || 1
        } else {
            page = (params.start / 50) + 1;
        }
        if (filter !== false) {
            url = filter+'/page/'+page;
        } else if (search !== false) {
            url = 'store/'+store+'/search/'+search+'/page/'+page;
        } else if (typeof params == 'undefined') {
            url = 'store/'+store+'/page/'+page;
        } else {
            for (var key in params) {
                var value = params[key];
                url += key+'/'+value+'/';
            }
        }
        proxy.setUrl('/api/sig/'+Store.GetSig()+'/'+url+'?dc='+Store.Util.GetDateTimeStamp());     
        this.me.getStore().reload();
	},
	GetSelections: function() {
		if (typeof this.me != 'undefined') {
			return this.me.getSelectionModel().getSelections();
		}
	},
	GetStore: function() {
		if (typeof this.me != 'undefined') {
			return this.me.getStore();
		}
	},
	Reset: function() {
		var store = this.GetStore();
		
		if (typeof store != 'undefined') {
			store.baseParams = {start:0, limit:50};
			store.load();
		}
	},
    HideUnvisibleColumn: function(g) {
        g.getColumnModel().getColumnsBy(function(c, i) {
            if (c.display == 'Нет') {
                g.getColumnModel().setHidden(i, true);
            }
        });
    }
}
Store.Search = {
	Init: function() {
		Ext.app.SearchField = Ext.extend(Ext.form.TwinTriggerField, {
			initComponent : function(){
				if (!this.store.baseParams){
					this.store.baseParams = {};
				}
				Ext.app.SearchField.superclass.initComponent.call(this);
				this.on('specialkey', function(f, e){
					if(e.getKey() == e.ENTER){
						this.onTrigger2Click();
					}
				}, this);
			},
			style: {
				padding: '0 0 2px 2px'
			},
			validationEvent:false,
			validateOnBlur:false,
			trigger1Class:'x-form-clear-trigger',
			trigger2Class:'x-form-search-trigger',
			hideTrigger1:true,
			width:180,
			hasSearch : false,
			paramName : 'query',
			onReset: function() {
				this.reset();
			},
			onTrigger1Click: function() {
				Store.Search.OnClickReset(this);
			},
			onTrigger2Click : function() {
				Store.Search.OnClickSearch(this);
			}
		});	
        this.search = {};
	},
	Reset: function() {
        var store = Store.GetStore(),  
            e = Ext.getCmp('search-type');		        
            
        e.hasSearch = false;
        e.setValue('');
        e.triggers[0].hide();
        e.hasSearch = false;
        
        if (typeof this.search != 'undefined' && typeof this.search[store] != 'undefined') {
            delete this.search[store];
        }
	},
	Set: function(search) {
        var store = Store.GetStore(),  
            e = Ext.getCmp('search-type');

        if (typeof search != 'undefined') {
            this.search[store] = search;
        }        
    	e.hasSearch = true;
        e.setValue(search);
		e.triggers[0].show();
		e.focus();        
	},
    Get: function() {
        var store = Store.GetStore();

        if (typeof this.search != 'undefined' && typeof this.search[store] != 'undefined') {
            return this.search[store];
        } else {
            return false;
        }
    },
	OnClickReset: function(e) {
        var store = Store.GetStore();
        
        this.Reset();
        Store.History.Add('store/'+store);
	},
	OnClickSearch: function(e) {
		var store = Store.GetStore(),
            search = e.getRawValue();

		if (search.length < 2) {
			return Store.Window.Error('Вы должны ввести минимум два символа для поиска');
		} else {
            this.Set(search);
            Store.History.Add('store/'+store+'/search/'+search);
		}		
	}
}
Store.Filter = {
	Init: function() {
		this.filter = {};
	},
	Reset: function() {
        var store = Store.GetStore(),  
            form = Store.Panel.GetFilter().getForm();
        
		form.items.each(function(field) {
			if (field.initialConfig.xtype == 'combobox') {
				field.clearValue();			
			} else {
				field.reset();
			}
		});
        delete this.filter[store];
	},
	OnClickRun: function() {		
		this.Run();
	},
	OnClickReset: function() {	
        var store = Store.GetStore();
		this.Reset();
		Store.History.Add('store/'+store+'/');
	},
	Run: function() {
        var form = Store.Panel.GetFilter().getForm();
        
		if (form.isValid()) {
			var url = [],
				store = Store.GetStore(),
				value = form.getValues();

			for (var key in value) {
				if (value[key] != '') {
					url.push(key+'/'+value[key]);
				}
			}
            Store.History.Add('store/'+store+'/'+url.join('/'));
		}
	},
	Show: function() {
		var fields = []
			filter = Store.Panel.GetFilter();

		var PushDefault = function(e) {
			fields.push({
				fieldLabel: e.header,
				name: e.dataIndex,
				anchor: '-18'
			});
		}
		var PushLink = function(e) {
			if (e.action == 'last') {
				var options = Store.Util.ToArray(e.options);

				fields.push({
					xtype: 'multiselect',
					fieldLabel: e.header,
					name: e.dataIndex,
					anchor: '-18',
					height: options.length > 5 ? 115 : 65,
					store: options,
					ddReorder: true,
					listeners: {
						resize: function() {
							var w = this.getWidth()
							this.fs.setWidth(w)
						}
					}
				});
			}			
		}
		var PushSelect = function(e) {
			var options = Store.Util.ToArray(e.options);

			fields.push(
				new Ext.form.ComboBox({
					name: e.dataIndex,
					fieldLabel: e.header,					
					store: new Ext.data.ArrayStore({
						fields:['number', 'name'],
						data: options
					}),
					displayField: 'name',
					valueField: 'number',
					typeAhead: true,
					mode: 'local',
					allowBlank: true,
					editable: false,
					triggerAction: 'all',
					selectOnFocus:true,
					xtype: 'combobox',
					anchor: '-18'
				})
			);			
		}
		var PushMultiSelect = function(e) {
			var options = Store.Util.ToArray(e.options, true);	

			fields.push({
				xtype: 'multiselect',
				fieldLabel: e.header,
				name: e.dataIndex,
				anchor: '-18',
				height: options.length > 5 ? 115 : 65,
				store: options,
				ddReorder: true,
				listeners: {
					resize: function() {
						var w = this.getWidth()
						this.fs.setWidth(w)
					}
				}
			});			
		}
		var PushDateTime = function(e) {
			fields.push({
				xtype: 'datefield',
				fieldLabel: e.header+' от',
				name: e.dataIndex+'_begin',
				format: 'Y-m-d',
				anchor: '-18'
			},{
				xtype: 'datefield',
				fieldLabel: e.header+' до',
				name: e.dataIndex+'_end',
				format: 'Y-m-d',
				anchor: '-18'
			});
		}		
		Ext.each(Store.GetFields(), function(e) {
			if (e.display == 'Да') {
				switch (e.dataType) {
					default:
						PushDefault(e);
						break;

					case 'link':
						PushLink(e);
						break;

					case 'select':
						PushSelect(e);
						break;

					case "multiselect":
						PushMultiSelect(e);
						break;

					case 'datetime':
						PushDateTime(e);
						break;
				}
			}
		});
		filter.removeAll(true);
		filter.add(fields);
		filter.doLayout();
	},
	Get: function(store, toString) {
		var store = store || Store.GetStore(),
            convertToString = function(object) {
                var tmp = [];
                
                for (var k in object) {
                    var v = object[k];
                    tmp.push(k+'/'+v);
                }
                return tmp.join('/');
            }

        if (typeof this.filter != 'undefined' && typeof this.filter[store] != 'undefined') {
            return toString ? convertToString(this.filter[store]) : this.filter[store];
        } else {
            return false;
        }
	},
	Set: function(filter) {
        var store = Store.GetStore(),
            form = Store.Panel.GetFilter().getForm();

        form.items.each(function(e) {
            if (typeof filter[e.name] != 'undefined') {
                e.setValue(filter[e.name]);
            }
        });
        this.filter[store] = filter;
	}
}
Store.Window = {
	Error: function(text, processResult) {
		Ext.Msg.show({
			title: "Ошибка",
			msg: text,
			buttons: Ext.Msg.OK,
			fn: processResult,
			icon: Ext.MessageBox.ERROR
		});					
	}, 
	Message: function(text, processResult) {
		Ext.Msg.show({
			title: "Сообщение",
			msg: text,
			buttons: Ext.Msg.OK,
			fn: processResult,
			icon: Ext.MessageBox.INFO
		});			
	},
	Confirm: function(text, processResult) {
		Ext.Msg.show({
			title:'Подтвердите',
			msg: text,
			buttons: Ext.Msg.OKCANCEL,
			fn: processResult,
			icon: Ext.MessageBox.QUESTION
		});					
	},
	OnClickSave: function(f, w) {
        var form = f.getForm(),
            values = form.getFieldValues(),
            method = typeof values.id == 'undefined' ? 'post' : 'put';
            
        if (form.isValid()) {
            Store.Util.Ajax({
                url: '/api/sig/'+Store.GetSig()+'/store/'+Store.GetStore(),
                form: form.id,
                method: method,
                success: function(r) {
                    var response = Ext.util.JSON.decode(r.responseText);

                    if (response.success) {
                        Store.Window.OnClickCancel(w);
                        Store.Grid.Reload();
                    } else {
                        Store.Window.Error(response.message);
                    }
                }
            });
        }	
	},
	OnClickCancel: function(w) {
		w.close();		
	},
	OnBodyResize: function(f, w, h) {
		f.setSize(w, h);
	},
	Edit: function(data) {
		var fields = [];
			data = data ? data : [];

		var PushChar = function(e) {
			fields.push({
				fieldLabel: e.header,
				value: data[e.dataIndex] ? data[e.dataIndex] : '',
				name: e.dataIndex,
				xtype: 'textfield',
				readOnly: e.attr == 'readonly' ? true : false,
				fieldClass: e.attr == 'readonly' ? 'readonly' : '',
				anchor: '-18'						
			});			
		}
		var PushDateTime = function(e) {
			fields.push({
				fieldLabel: e.header,
				value: data[e.dataIndex] ? data[e.dataIndex] : '',
				name: e.dataIndex,
				xtype: 'datefield',
				format: 'Y-m-d',
				anchor: '-18'
			});			
		}
		var PushSelect = function(e) {
			var options = Store.Util.ToArray(e.options, true);	

			fields.push(
				new Ext.form.ComboBox({
					fieldLabel: e.header,
					store: new Ext.data.ArrayStore({
						fields:['number', 'name'],
						data: options
					}),
					hiddenName: e.dataIndex,
					displayField: 'name',
					valueField: 'number',
					mode: 'local',							
					allowBlank: e.mandatory !== 'Да' ? true : false,
					triggerAction: 'all',
					editable: false,
					anchor: '-18',
					listeners: {
						beforerender: function() {
							var c = this;
							c.getStore().each(function(el, i) {
								if (this.data.name == data[e.dataIndex]) {														
									c.setValue(this.data.name);
								}
							});
						}
					}
				})
			);			
		}
		var PushMultiSelect = function(e) {
			var options = Store.Util.ToArray(e.options, true);

			fields.push({
				xtype: 'multiselect',
				fieldLabel: e.header,
				name: e.dataIndex,
				anchor: '-18',
				height: options.length > 5 ? 115 : 65,
				store: options,
				ddReorder: true,
				syle: 'background-color: white',
				listeners: {
					resize: function() {
						var w = this.getWidth()
						this.fs.setWidth(w)
					},
					render: function() {
						if (data != '') {
							var a = data[e.dataIndex].split(",");
							this.setValue(a);
						}
					}
				}
			});			
		}
		var PushLink = function(e) {
			if (e.action !== 'last') {
				return;
			}
			var options = Store.Util.ToArray(e.options);	

			fields.push(
				new Ext.form.ComboBox({
					fieldLabel: e.header,
					store: new Ext.data.ArrayStore({
						fields:['number', 'name'],
						data: options
					}),
					hiddenName: e.dataIndex,
					displayField: 'name',
					valueField: 'number',
					mode: 'local',	
					triggerAction: 'all',
					allowBlank: false,
					editable: false,
					anchor: '-18',
					listeners: {
						beforerender: function() {
							var c = this;
							c.getStore().each(function() {
								var original = data[e.dataIndex];
								
								if (typeof original != 'undefined') {
									var tmp = original.replace(/<a href='#[=:a-zA-Z0-9/]*'>/g, '').replace(/<\/a>/, '');

									if (tmp == this.data.name) {
										c.setValue(this.data.number);
									}
								}
							});
						}
					}
				})
			);		
		}
		var PushEmail = function(e) {
			fields.push({
				fieldLabel: e.header,
				value: data[e.dataIndex] ? data[e.dataIndex] : '',
				name: e.dataIndex,
				xtype: 'textfield',
				anchor: '-18'
			});				
		}
		var PushPhone = function(e) {
			fields.push({
				fieldLabel: e.header,
				value: data[e.dataIndex] ? data[e.dataIndex] : '',
				name: e.dataIndex,
				xtype: 'textfield',
				anchor: '-18'
			});					
		}
		var PushPassword = function(e) {
			fields.push({
				fieldLabel: e.header,
				value: '',
				name: e.dataIndex,
				inputType: 'password',
				xtype: 'textfield',
				anchor: '-18'
			});
		}
		var PushText = function(e) {
			fields.push({
				fieldLabel: e.header,
				value: data[e.dataIndex] ? data[e.dataIndex] : '',
				name: e.dataIndex,
				xtype: 'textarea',
				anchor: '-18'						
			});			
		}
		var PushInt = function(e) {
			if (e.dataIndex == 'id') {
				e.attr = 'readonly';
			}
			fields.push({
				fieldLabel: e.header,
				value: data[e.dataIndex] ? data[e.dataIndex] : '',
				xtype: 'numberfield',
				name: e.dataIndex,
				readOnly: e.attr == 'readonly' ? true : false,
				fieldClass: e.attr == 'readonly' ? 'readonly' : '',
				anchor: '-18'						
			});			
		}
		var PushHtmlEditor = function(e) {
			fields.push({
				fieldLabel: e.header,
				value: data[e.dataIndex] ? data[e.dataIndex] : '',
				name: e.dataIndex,
				xtype: 'htmleditor',
				anchor: '-18'						
			});				
		}
		
		Ext.each(Store.GetFields(), function(e) {
			if (typeof e.dataType != 'undefined') {
				var isIdField = (e.dataIndex == 'id' && typeof data[e.dataIndex] == 'undefined') ? true : false;

				if (!isIdField) {
					switch (e.dataType) {
						case 'char':					
							PushChar(e);
							break;

						case 'datetime':
							PushDateTime(e);
							break;

						case 'select':
							PushSelect(e);							
							break;

						case "multiselect":
							PushMultiSelect(e);
							break;

						case 'link':
							PushLink(e);
							break;

						case 'email':
							PushEmail(e);						
							break;

						case 'phone':
							PushPhone(e);
							break;

						case 'password':
							PushPassword(e);
							break;

						case 'text':
							PushText(e);
							break;

						case 'money':
						case 'int':
							PushInt(e);
							break;	

						case 'htmleditor':
							PushHtmlEditor(e);
							break;
					}
				}
			}
		});
		var form = new Ext.form.FormPanel({
			frame: true,
			labelWidth: 120,
			url: 'save-form.php',
			defaultType: 'textfield',
			bodyStyle:'padding:5px;',
			border: false,
			items: fields
		});
		var window = new Ext.Window({
			width: 400,
			modal: true,
			title: 'Изменить',
			iconCls: 'icon-edit-window',
			border: false,
			items: form,
			listeners: {
				bodyresize: function(p, w, h) {
					Store.Window.OnBodyResize(form, w, h);					
				}
			},
			buttons: [{
				text: 'Сохранить',
				handler: function() {
					Store.Window.OnClickSave(form, window)
				}
			},{
				text: 'Отменить',
				handler: function() {
					Store.Window.OnClickCancel(window);
				}
			}]
		}).show();
	}
};
Store.Renderer = {
	Digit: function(val) {
		if (typeof val == "undefined") {
			return;
		} else if (val > 0) {
			return "<span style='color:green;'>" + val + "</span>";
		} else if (val <= 0) {
			return "<span style='color:red;'>" + val + "</span>";
		}
	},
	Email: function(val) {
		return "<span  style='color:#385F95;'>" + val + "</span>";
	}
}
Ext.onReady(function() {
	Store.Init(function() {
		Store.Run();
	});
});