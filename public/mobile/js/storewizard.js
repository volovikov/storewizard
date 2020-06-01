/**
 *	TODO
 * 
 *	1.	После того, как из детального режима просмотра возращаешься назад				OK
 *		список виден, но элементы не выбераются										
 *		
 *	2.	Не работает удалить																OK
 *	
 *	3.	Нужно структуру передлывать. Должно быть как в Desktop версии					OK
 *		Main.. Main.Window.. Main.List и т.д. 
 *		
 *	4.	Сделать Добавить
 *	
 *	5.	GetDetailCard в случае если есть id то берем Ajaxом данные,						OK
 *		иначе пустую форму возращаем
 *		
 *	6.	Оптимизировать. Методы написать. GetStore, GetStoreIndex, GetStoreKey			OK
 *	
 *	7.	Изучить requires, icon - что это? 
 *	
 *	8.	Форма. Надо fielset использовать чтобы она выгледела как надо					OK
 *	
 *	9.	Как будет программа выглятеть на планшете? Как будет выгледеть под Андроид? 
 *		Может стоит единый дизайн для всех сделать, скажем как в Н9 ?
 *		
 *	10. В случае если приходит новый товар (как в чате) нужно сделать чтобы 
 *		перегружался список
 *		
 *	11.	Начальная загрузка программы. Какой то прелоадер пока все данные грузятся
 *		как в десктоп версии
 *	
 */
Main = {
	glossOnIcon: false,
	icon: {
        57: 'resources/icons/icon.png',
        72: 'resources/icons/icon@72.png',
        114: 'resources/icons/icon@2x.png',
        144: 'resources/icons/icon@114.png'
    },
	requires: [
        'Ext.tab.Panel',
        'Ext.data.JsonP',
        'Ext.Ajax',
    ],
	listeners: {
		GetStoreList: function() {
			this.OnGetStoreList();
		},
		GetFieldsList: function() {
			this.OnGetFieldsList();
		}
	},	
    launch: function() {		
		this.fireEvent('GetStoreList', this);
    },	
	OnGetStoreList: function() {
		var that = this;
		that.store = [];

		Ext.Ajax.request({
			url: '/?task=GetStoreList',
			success: function(r) {
				var response = Ext.JSON.decode(r.responseText);

				if (response.success) {
					that.store = response.data;
					that.fireEvent('GetFieldsList');
				}
			},
			params: {none: null}
		});
	},
	OnGetFieldsList: function() {		
		var that = this;
		that.fields = [];

		Ext.Ajax.request({
			url: '/?task=GetFieldsList',
			success: function(r) {
				var response = Ext.JSON.decode(r.responseText);

				if (response.success) {
					that.fields = response.data;

					if (Ext.get('preloader')) {
						Ext.get('preloader').remove();
					}
					that.Show();
				}
			},
			params: {none: null}
		});
	},
	OnItemTap: function(me, list, index, target, rec, e) {
		var that = this,
			detailCard = that.GetNestedList().getDetailCard();
			isLeaf = rec.data.leaf;

		list.setMasked({
			xtype: 'loadmask',
			message: 'Loading'
        });			
		if (isLeaf) {
			var id = rec.data.id;
			var store = that.GetStore();

			that.GetDetailCard(id, store, function(el) {
				detailCard.add(el);
				list.unmask();
				that.SetToolbarStatus(false, true, true);				
			});
		} else {
			var store = rec.data.id;
	
			that.GetDetailList(store, function(el) {
				me.getStore().getAt(index).appendChild(el);				
				list.unmask();
				that.SetStore(store);
				that.SetToolbarStatus(true, false, false);
			});
		}		
	},
	OnBackTap: function(me, node, list, detailCardActive) {
		var that = this; 
		
		if (detailCardActive) {
			var store = that.GetStore(),
				detailCard = that.GetNestedList().getDetailCard(),
				isDelete = detailCard.isDelete,
				itemId = detailCard.itemId;
			
			detailCard.removeAll();
			
			list.setMasked({
				xtype: 'loadmask',
				message: 'Loading'
			});			
			that.GetDetailList(store, function(el) {
				Ext.each(el, function(e, i) {
					if (typeof list.getStore().getAt(i) != 'undefined') {
						var item = list.getStore().getAt(i).data;

						if (isDelete && item.id == itemId) {
							list.getStore().removeAt(i);
						} else {
							item.key = e.key;
						}						
					}				
				});
				list.unmask();
				list.refresh();
				that.SetToolbarStatus(true, false, false);
			});
		}
	},
	GetStore: function() {
		return this.storeSelect;
	},
	SetStore: function(store) {
		this.storeSelect = store;
	},
	GetNestedList: function() {
		return this.nestedList;
	},
	SetNestedList: function(list) {
		this.nestedList = list;
	},
	GetFields: function(store) {
		if (typeof this.fields != 'undefined') {
			if (typeof this.fields[store] != 'undefined') {
				return this.fields[store];
			} else {
				return false;
			}
		} else {
			return false;
		}
	},
	GetDetailList: function(store, callback) {
		var that = this;

		Ext.Ajax.request({
			url: '/?task=GetData&store='+store,
			success: function(r) {
				var response = Ext.JSON.decode(r.responseText);
				var fields = that.GetFields(store);
				var results = [];
				var inArray = function(key, array) {
					for (var i in array) {
						var el = array[i];
						if (el.dataIndex == key) {
							return el
						}
					}
					return false;
				}
				for (var i in response.results) {
					var item = response.results[i];
					var key = [];			
					var index = 0;

					for (var j in item) {
						var k = item[j];							
						var field = inArray(j, fields);

						if (typeof k == 'string') {
							k = k.replace(/<\/?[^>]+>/g, '');
						}
						if (field && j != 'id') { 
							if (index == 0) {
								key.push('<div>'+k+'</div>');
							} else if (typeof field.display == 'undefined') {
								key.push('<span>'+field.header+' : '+k+'</span>');
							} else if (typeof field.display != 'undefined' && field.display == 1) {
								key.push('<span>'+field.header+' : '+k+'</span>');
							}
							index++;
						}							
					}
					results.push({id: item.id, key:key.join(''), leaf: true});
				}
				callback(results);
			},
			failure: function() {

			},
			noCache: false,
			method: 'post',
			params: {start: 0, limit: 50}
		});
	},
	GetDetailCard: function(id, store, callback) {
		var that = this,
			fields = that.GetFields(store),
			form = [];
		
		Ext.Ajax.request({
			url: '/?task=GetData&store='+store,
			success: function(r) {
				var response = Ext.JSON.decode(r.responseText);				
				var data = response.results[0];
				
				for (var i in fields) {
					for (var key in data) {
						var field = fields[i];
						var value = data[key];

						/*
						 * TODO
						 * К именам полей ставлю префикс "-"
						 * В случае если имя поле имеет имя id то работать не будет. Нужно 
						 * на стороне сервера префикс удалять
						 */
						if (field.dataIndex == key) {
							switch (field.dataType) {
								case 'char':
									form.push({
										xtype: 'textfield',
										name: '-'+field.dataIndex,
										label: field.header,
										value: value										
									});
									break;

								case 'int':
								case 'money':								
									form.push({
										xtype: 'numberfield',
										name: '-'+field.dataIndex,
										label: field.header,
										value: value
									});
									break;


								case 'password':
									form.push({
										xtype: 'passwordfield',
										name: '-'+field.dataIndex,
										label: field.header,
										value: ''
									});									
									break;

								case 'email':
									form.push({
										xtype: 'emailfield',
										name: '-'+field.dataIndex,
										label: field.header,
										value: value
									});
									break;
									
								case 'datetime':
									form.push({
										xtype: 'datepickerfield',
										name: '-'+field.dataIndex,
										label: field.header,
										value: value
									});
									break;									

								case 'link':
								case 'select':
									var options = [];

									for (var k in field.options) {
										var v = field.options[k]
										options.push({key: k, value: v});
									}									
									form.push({
										xtype: 'selectfield',
										name: '-'+field.dataIndex,
										label: field.header,
										value: value,
										valueField: 'value',										
										displayField: 'value',
										store: {
											data: options
										}
									});
									break;

								case 'htmleditor':
								case 'text':		
									form.push({
										xtype: 'textareafield',
										name: '-'+field.dataIndex,
										label: field.header,
										value: value,
										maxRows: 10
									});									
									break;
							}
						}
					}
				}
				callback({xtype: 'fieldset', items: form});					
			},
			failure: function() {
				
			},
			noCache: false,
			method: 'post',
			params: {id: id, start: 0, limit: 1}
		});
	},
	GetDetailCardEmpty: function(store, callback) {
		var that = this,
			fields = that.GetFields(store),
			form = [];
			
			for (var i in fields) {
				var field = fields[i];
				
				if (field.dataIndex != 'id') {
					switch (field.dataType) {
						case 'char':
							form.push({
								xtype: 'textfield',
								name: '-'+field.dataIndex,
								label: field.header
							});
							break;

						case 'int':
						case 'money':								
							form.push({
								xtype: 'numberfield',
								name: '-'+field.dataIndex,
								label: field.header
							});
							break;


						case 'password':
							form.push({
								xtype: 'passwordfield',
								name: '-'+field.dataIndex,
								label: field.header
							});									
							break;

						case 'email':
							form.push({
								xtype: 'emailfield',
								name: '-'+field.dataIndex,
								label: field.header
							});
							break;

						case 'datetime':
							form.push({
								xtype: 'datepickerfield',
								name: '-'+field.dataIndex,
								label: field.header,
								value: new Date()
							});
							break;
							
						case 'link':
						case 'select':
							var options = [];

							for (var k in field.options) {
								var v = field.options[k]
								options.push({key: k, value: v});
							}									
							form.push({
								xtype: 'selectfield',
								name: '-'+field.dataIndex,
								label: field.header,
								valueField: 'value',										
								displayField: 'value',
								store: {
									data: options
								}
							});
							break;

						case 'htmleditor':
						case 'text':									
							form.push({
								xtype: 'textareafield',
								name: '-'+field.dataIndex,
								label: field.header
							});									
							break;
					}				
				}
			}			
		callback({xtype: 'fieldset', items: form});
	},
	GetToolbar: function() {
		var that = this;
		
		if (typeof that.bottomToolbar != 'undefined') {
			return that.bottomToolbar;
		} else {
			Ext.define('MyToolbar', {
				extend: 'Ext.Toolbar',
				config: {
					//docked: 'bottom',
					docked: 'top',
					ui: 'light',
					items: [{
						itemId: 'btnAdd',
						text: 'Добавить',
						disabled: true,
						handler: function() {
							var nestedList = that.GetNestedList(),
								detailCard = nestedList.getDetailCard(),
								store = that.GetStore();

							that.GetDetailCardEmpty(store, function(result) {
								detailCard.add(result); 
								that.SetStore(store);
								that.SetToolbarStatus(false, true, true);
							});
							nestedList.GoToEmptyLeaf();
						}
					},{
						itemId: 'btnDelete',
						text: 'Удалить',
						disabled: true,
						handler: function() {
							Ext.Msg.confirm('Вопрос', 'Вы уверены что хотите удалить запись?', function(btn) {								
								if (btn == 'yes') {
									var nestedList = that.GetNestedList(),
										detailCard = nestedList.getDetailCard(),										
										values = detailCard.getValues();
									
									Ext.Ajax.request({
										url: '/?task=Delete&store='+that.GetStore(),
										success: function(r) {
											detailCard.isDelete = true;
											detailCard.itemId = values['-id'];
											nestedList.onBackTap();
										},
										failure: function(r) { 
										},
										method: 'post',
										params: {id: values['-id']}
									});
								}
							});
						}
					},{
						xtype: 'spacer'
					},{
						itemId: 'btnSave',
						ui: 'confirm',
						text: 'Сохранить',
						disabled: true,
						handler: function() {
							var detailCard = that.GetNestedList().getDetailCard();

                            detailCard.setMasked({
                                xtype: 'loadmask',
                                message: 'Saving...'
                            });
							detailCard.submit({
								url: '/?task=Save&store='+that.GetStore(),
								method: 'post',
								success: function() {
									detailCard.unmask();
								},
								failure: function() {
									detailCard.unmask();
								}
							});
						}
					}]
				},				
				ButtonAddOn: function() {
					Ext.each(this.getInnerItems(), function(e) {
						if (e.getItemId() == 'btnAdd') {
							e.enable();
						}
					});
				},
				ButtonAddOff: function() {
					Ext.each(this.getInnerItems(), function(e) {
						if (e.getItemId() == 'btnAdd') {
							e.disable();
						}
					});
				},
				ButtonDeleteOn: function() {
					Ext.each(this.getInnerItems(), function(e) {
						if (e.getItemId() == 'btnDelete') {
							e.enable();
						}
					});
				},
				ButtonDeleteOff: function() {
					Ext.each(this.getInnerItems(), function(e) {
						if (e.getItemId() == 'btnDelete') {
							e.disable();
						}
					});
				},
				ButtonSaveOn: function() {
					Ext.each(this.getInnerItems(), function(e) {
						if (e.getItemId() == 'btnSave') {
							e.enable();
						}
					});
				},
				ButtonSaveOff: function() {
					Ext.each(this.getInnerItems(), function(e) {
						if (e.getItemId() == 'btnSave') {
							e.disable();
						}
					});
				}
			});
			return this.bottomToolbar = new MyToolbar();
		}
	},
	SetToolbarStatus: function(btnAdd, btnDelete, btnSave) {
		var bTbar = this.GetToolbar();

		btnAdd ? bTbar.ButtonAddOn() : bTbar.ButtonAddOff();
		btnDelete ? bTbar.ButtonDeleteOn() : bTbar.ButtonDeleteOff();
		btnSave ? bTbar.ButtonSaveOn() : bTbar.ButtonSaveOff();
	},
	Show: function() {
		var that = this;
		this.tabs = [];		

		Ext.each(that.store, function(e) {
			that.tabs.push({
				id: e.key,
				key: e.name
			});
		});
		var store = Ext.create('Ext.data.TreeStore', {
			fields: [{name: 'id'}, {name: 'key'}],
			root: {children: that.tabs},
			proxy: {
				type: 'memory'
			}
		});
		Ext.define('MyNestedList', {
			extend: 'Ext.NestedList',
			config: {
				autoLoad: true,
				fullscreen: true,
				title: 'storewizard',
				detailCard: {
					xtype: 'formpanel'				
				},
				displayField: 'key',
				store: store,
				listeners: {
					itemtap: function(me, list, index, target, rec, e, options) {
						that.OnItemTap(me, list, index, target, rec);					
					},
					back: function(me, node, list, detailCardActive, options) {
						that.OnBackTap(me, node, list, detailCardActive);					
					}
				}
			},
			GoToEmptyLeaf: function() {
				var me = this,
					card = me.getDetailCard(),
					container = me.getDetailContainer(),
					sharedContainer = container == this,
					layout = me.getLayout(),
					animation = (layout) ? layout.getAnimation() : false;

				if (card) {
					if (container.getItems().indexOf(card) === -1) {
						container.add(card);
					}
					if (sharedContainer) {
						if (me.getActiveItem() instanceof Ext.dataview.List) {
							me.setLastActiveList(me.getActiveItem());
						}
					}
					if (animation) {
						animation.setReverse(false);
					}
					container.setActiveItem(card);
					me.syncToolbar();
				}
			}
		});
		that.nestedList = new MyNestedList();
		that.nestedList.add(that.GetToolbar());		
	}
}
Ext.application(Main);