/* 
 * @name: StoreWizard clients application part
 * @author: volovikov
 * @date: 2012
 * @version: 1.1 beta
 */
/**
 * TODO
 * 
 *	1.	Порядок следования должен быть spin fields
 *	
 *	2.	При изменении названии Колонки или названия Вкладки, и возраврата
 *		обратно, в Combobox должно измениться информация на новую
 *		
 *	3.	Сделать добавить новую колонки
 *	
 *	4.	Сделать удалить колонку и удалить вкладку
 *	
 *	5.	dataType 
 */
Wizard = {
	winHeight: 450,
	winWidth: 500,
	winFormHeight: 387,
	Show: function() {
		if (typeof this.window != 'undefined') {
			return this.window.show();
		} else {
			var width = this.winWidth,
				height = this.winHeight,
				form = Wizard.Form.Get();
					
			var win = new Ext.Window({
				width: width,
				height: height,
				resizable: false,
				bodyStyle: 'background-color: white',
				modal: true,
				title: 'Мастер',
				iconCls: 'icon-edit-window',
				border: false,
				items: form,
				buttons: [{
					id: 'back',
					text: 'Вернутся',
					disabled: true,
					handler: function() {
						Wizard.OnClickReturn(win);
					}
				},{
					id: 'next',
					text: 'Продолжить',
					handler: function() {
						Wizard.OnClickForward(win);
					}
				}]
			}).show();
		}
	},
	OnClickReturn: function(win) {
		var choose = Wizard.Choose.Get(),
			tbar = win.getFooterToolbar();

		if (typeof choose.prev != 'undefined') {
			win.get(0).destroy();
			win.add(Wizard.Form.Get(choose.prev));
			win.doLayout();

			if (choose.prev == 'tab') {
				tbar.findById('back').disable();
			}
		}		
	},
	OnClickForward: function(win) {
		var choose = Wizard.Choose.Get(),							
			f = win.get(0).getForm(),
            v = f.getValues(),
			tbar = win.getFooterToolbar();

		if (typeof choose.next != 'undefined') {
			if (typeof choose.submit != 'undefined') {
                if (choose.current == 'tab-new') {
                    Wizard.Choose.SetTab({key: v.key, value: v.name});
                }
                Store.Util.Ajax({
                    url: choose.submit,
                    form: f.id,
                    method: 'post',
                    success: function(r) {
                        var response = Ext.util.JSON.decode(r.responseText);

                        if (response.success) {
                            win.get(0).destroy();
                            win.add(Wizard.Form.Get(choose.next));
                            win.doLayout();
                        }
                    }						
                });               
			} else {
				win.get(0).destroy();
				win.add(Wizard.Form.Get(choose.next));
				win.doLayout();								
			}							
			if (choose.next != 'tab') {
				tbar.findById('back').enable();
			}
		}		
	}
};
Wizard.Choose = {
	Set: function(v) {
		this.choose = v;
	},
	Get: function() {
		return this.choose;
	},
	SetTab: function(v) {
		this.tab = v;
	},
	GetTab: function() {
		return this.tab;
	},
	SetColumn: function(v) {
		this.column = v;
	},
	GetColumn: function() {
		return this.column;
	}
}
Wizard.Form = {
	GetTab: function() {
        var SetChooseDefault = function() {
            Wizard.Choose.Set({
                next: 'tab-new',
                prev: 'tab'
            });
        }
        var SetChooseTabNew = function() {
            if (this.getValue()) {						
                Wizard.Choose.Set({
                    next: 'tab-new',
                    prev: 'tab'
                });
            }                       
        };
        var SetChooseTabEdit = function() {
            if (this.getValue()) {
                Wizard.Choose.Set({
                    next: 'tab-edit',
                    prev: 'tab'
                });
            }            
        }
        var SetChooseTabDelete = function() {
            if (this.getValue()) {
                Wizard.Choose.Set({
                    next: 'tab-delete',
                    prev: 'tab'
                });
            }                        
        }
		return new Ext.FormPanel({
			bodyStyle:'padding:10px;',
			border: false,
			height: Wizard.winFormHeight,			
			frame: true,
            listeners: {
                afterrender: SetChooseDefault
            },
			items:[{
				xtype: 'fieldset',
				labelWidth: 150,
				title: 'Управление вкладками',				
				defaultType: 'radio',
				items:[{
                    id: 'tab-new',
					fieldLabel: 'Выберите вариант',
					boxLabel: 'Добавить новую?',
					name: 'tab',
					checked: true,
					handler: SetChooseTabNew
				},{
					id: 'tab-edit',
					boxLabel: 'Изменить существующую?',
					name: 'tab',
					handler: SetChooseTabEdit
				},{
                    id: 'tab-delete',
                    boxLabel: 'Удалить?',
                    name: 'tab',
                    handler: SetChooseTabDelete
                }]
			}]
		});		
	},
	GetTabNew: function() {
		Wizard.Choose.Set({
			next: 'column-new',
			prev: 'tab',
            current: 'tab-new',
			submit: '/api/sig/'+Store.GetSig()+'/savestore'
		});
		return new Ext.FormPanel({					
			bodyStyle:'padding:10px;',
			border: false,
			height: Wizard.winFormHeight,
			frame: true,
			items:[{
				xtype: 'fieldset',
				defaultType: 'textfield',
				labelWidth: 150,						
				defaults: {width: 200},
				title: 'Добавить новую вкладку',
				items:[{							
					fieldLabel: 'Имя по русски',
					name: 'name',
					allowBlank: false
				},{
					fieldLabel: 'Имя по английски',
					name: 'key',
					allowBlank: false
				},{
					fieldLabel: 'Порядок следования',
					name: 'order',
					allowBlank: false
				}]
			}]					
		});		
	},
	GetTabEdit: function() {
		var store = [],
			tabs = [],
            currentIndex = 0,
            record;            

		Wizard.Choose.Set({
			next: 'column',
			prev: 'tab',
            current: 'tab-edit',
			submit: '/api/sig/'+Store.GetSig()+'/savestore'
		});
		Ext.each(Store.tabs, function(e, i) {
			tabs.push({
				id: e.uId,
				title: e.title,
				key: e.id,
				order: i
			});
			store.push([
				e.id,
				e.title
			]);
		});
		var comboStore = new Ext.data.ArrayStore({
			fields: ['key', 'value'],
			data: store
		});
		var form = new Ext.FormPanel({
			bodyStyle:'padding:10px;',
			border: false,
			height: Wizard.winFormHeight,
			frame: true,
			items: [{
				xtype: 'fieldset',
				defaultType: 'textfield',
				labelWidth: 150,	
				defaults: {width: 200},
				title: 'Изменить существующую вкладку',
				items: [
					new Ext.form.ComboBox({
						typeAhead: true,
						triggerAction: 'all',
						lazyRender: true,
						store: comboStore,
						fieldLabel: 'Колонка',						
						allowBlank: false,
						mode: 'local',
						valueField: 'key',
						displayField: 'value',
                        enableKeyEvents: true,
						name: 'name',
						listeners: {
							beforerender: function() {
								var rec = comboStore.getAt(0).data;
								this.setValue(rec.value);
								Wizard.Choose.SetTab(rec);
                                record = comboStore.getAt(0);                                
							},
							select: function(c, rec, index) {
								var f = form.getForm(),
									v = tabs[index];

								f.setValues([
									{id: 'order', value: v.order},
									{id: 'id', value: v.id}
								]);
                                currentIndex = index;
                                record = comboStore.getAt(currentIndex);
								Wizard.Choose.SetTab({key: v.key, value: v.title});
							},
                            keyup: function(t, e) {
                                var v = t.getRawValue();
                                if (typeof record != 'undefined') {
                                    record.data.value = v;
                                }
                                Store.tabs[currentIndex].title = v;
                            }
						}
					}),{
						id: 'order',
						name: 'order',
						fieldLabel: 'Порядок следования',
						value: tabs[0].order,
						allowBlank: false
					},{
						id: 'id',
						name: 'id',
						value: tabs[0].id,
						hidden: true
					}
				]
			}]
		});
		return form;		
	},	
    GetTabDelete: function() {
		var store = [],
			tabs = [],
            currentIndex = 0,
            record;            
        
		Wizard.Choose.Set({
			next: 'tab',
			prev: 'tab',
            current: 'tab-delete',
			submit: '/api/sig/'+Store.GetSig()+'/deletestore'
		});
		Ext.each(Store.tabs, function(e, i) {
			tabs.push({
				id: e.uId,
				title: e.title,
				key: e.id,
				order: i
			});
			store.push([
				e.id,
				e.title
			]);
		}); 
		var comboStore = new Ext.data.ArrayStore({
			fields: ['key', 'value'],
			data: store
		});        
		var form = new Ext.FormPanel({
			bodyStyle:'padding:10px;',
			border: false,
			height: Wizard.winFormHeight,
			frame: true,
			items: [{
				xtype: 'fieldset',
				defaultType: 'textfield',
				labelWidth: 150,	
				defaults: {width: 200},
				title: 'Удалить вкладку',
				items: [
					new Ext.form.ComboBox({
						typeAhead: true,
						triggerAction: 'all',
						lazyRender: true,
						store: comboStore,
                        editable: false,
						fieldLabel: 'Вкладка',
						allowBlank: false,
						mode: 'local',
						valueField: 'key',
						displayField: 'value',
						name: 'name',
						listeners: {
							beforerender: function() {
								var rec = comboStore.getAt(0).data;
								this.setValue(rec.value);
								Wizard.Choose.SetTab(rec);
                                record = comboStore.getAt(0);                                
							},
							select: function(c, rec, index) {
								var f = form.getForm(),
									v = tabs[index];

								f.setValues([
									{id: 'store', value: v.key}
								]);
                                currentIndex = index;
                                record = comboStore.getAt(currentIndex);
								Wizard.Choose.SetTab({key: v.key, value: v.title});
							}
						}
					}),{
						id: 'store',
						name: 'store',
						value: tabs[0].key,
						hidden: true
					}
				]
			}]
		});
		return form;
    },
	GetColumn: function() {
		var tab = Wizard.Choose.GetTab();

        var SetChooseDefault = function() {
            Wizard.Choose.Set({
                next: 'column-new',
                prev: 'tab-edit',
                current: 'column'
            });            
        };
		var SetChooseColumnNew = function() {
            if (this.getValue()) {		
                Wizard.Choose.Set({
                    next: 'column-new',
                    prev: 'tab-edit',
                    current: 'column'
                });			
            }
		};
		var SetChooseColumnEdit = function() {
            if (this.getValue()) {		
                Wizard.Choose.Set({
                    next: 'column-edit',				
                    prev: 'tab-edit',
                    current: 'column'
                });			
            }
		};
        var SetChooseColumnDelete = function() {
            if (this.getValue()) {		
                Wizard.Choose.Set({
                    next: 'column-delete',
                    prev: 'column',
                    current: 'column'
                });              
            }
        };
		return new Ext.FormPanel({
			bodyStyle:'padding:10px;',
			height: Wizard.winFormHeight,
			border: false,
			frame: true,
            listeners: {
                afterrender: SetChooseDefault
            },			
			items:[{
				xtype: 'fieldset',
				labelWidth: 150,
				title: 'Управление колонками вкладки '+tab.value,
				defaultType: 'radio',
				items:[{
					id: 'column-new',
					fieldLabel: ' Выберите вариант',
					boxLabel: 'Добавить новую?',
					name: 'column',
                    checked: true,
					handler: SetChooseColumnNew
				},{
					id: 'column-edit',
					boxLabel: 'Изменить существующую?',
					name: 'column',					
					handler: SetChooseColumnEdit
				},{
					id: 'column-delete',
					boxLabel: 'Удалить?',
					name: 'column',
					handler: SetChooseColumnDelete
                }]
			}]
		});		
	},
	GetColumnNew: function() {
		var store = [],
			columns = [],			
            tab = Wizard.Choose.GetTab(),
			fields = Store.GetFields(tab);
	
		Ext.each(fields, function(e, i) {
			columns.push([e.dataIndex, e.header]);
		});
		Ext.each(Store.tabs, function(e, i) {
			store.push(e.id);
		});
		Wizard.Choose.Set({
			next: 'column',
			prev: 'column',
            current: 'column-new',
            submit: '/api/sig/'+Store.GetSig()+'/store/'+tab.key+'/savefield'
		});	
		var form = new Ext.FormPanel({
			bodyStyle:'padding:10px;',
			height: Wizard.winFormHeight,
			border: false,
			frame: true,
			items: [{
				xtype: 'fieldset',
				defaultType: 'textfield',
				labelWidth: 150,	
				defaults: {width: 200},
				title: 'Добавить колонку',
				items:[{
					fieldLabel: 'Имя по русски',
					name: 'name'
				},{
					fieldLabel: 'Имя по английски',
					name: 'key'
				},{
					fieldLabel: 'Порядок следования',
					name: 'order'
				},
				new Ext.form.ComboBox({					
					id: 'typeId',
					hiddenName: 'typeId',
					typeAhead: true,
					triggerAction: 'all',
					forceSelection: true,
					editable: false,
					mode: 'local',					
					allowBlank: false,
					store: new Ext.data.ArrayStore({
						fields: ['key', 'value'],
						data: [[1, 'char'], [2, 'text'], [3, 'int'], [4, 'datetime'], [5, 'select'], [7, 'link'], [8, 'password'], [9, 'email'], [10, 'phone'], [11, 'autocomplete'], [16, 'money'], [17, 'htmleditor']]
					}),
					fieldLabel: 'Тип',					
					valueField: 'key',
					displayField: 'value',
					listeners: {
						select: function(c, rec, index) {
							var val = rec.data.value,
								f = form.getForm();								
						
							switch (val) {
								case 'select':
									f.findField('value').enable();
									break;
									
								case 'link':
									f.findField('value').enable();
									f.findField('link').enable();
									f.findField('anchor').enable();
									f.findField('action').enable();
									break;
								
								default:
									f.findField('value').disable();
									f.findField('link').disable();
									f.findField('anchor').disable();
									f.findField('action').disable();									
									break;
							}
						}						
					}
				}),{
					id: 'value',
					fieldLabel: 'Значение',
					name: 'value',
					id: 'value',
					allowBlank: false,
					disabled: true
				},
				new Ext.form.ComboBox({
					typeAhead: true,
					triggerAction: 'all',
					lazyRender: true,
					store: store,
					fieldLabel: 'Связать с',					
					allowBlank: false,
					mode: 'local',
					valueField: 'key',
					displayField: 'value',
                    id: 'link',
					name: 'link',					
					editable: false,
					forceSelection: true,
					disabled: true,
                    listeners: {
                        select: function(c, rec, index) {
                            var store = rec.data.field1,
                                fields = Store.GetFields(store),
                                array = [];
                        
                            Ext.each(fields, function(e, i) {
                                array.push([i, e.dataIndex]);
                            });
                            var math = form.find('id', 'anchor');
                            
                            if (math.length) {
                                var combo = math[0];
                                combo.store.loadData(array);
                            }
                        }                        
                    }
				}),
				new Ext.form.ComboBox({                    
					typeAhead: true,
					triggerAction: 'all',
					lazyRender: true,
					store: new Ext.data.ArrayStore({
                        fields: ['key', 'value'],
                        data: []
                    }),
					fieldLabel: 'и полем',
					allowBlank: false,
					mode: 'local',
					valueField: 'key',
					displayField: 'value',
                    id: 'anchor',
					name: 'anchor',					
					editable: false,
					forceSelection: true,
					disabled: true
				}),				
				new Ext.form.ComboBox({
					editable: false,					
					name: 'action',
					id: 'action',
					disabled: true,
					store: ['summ','last','count'],
					fieldLabel: 'Действия',
					triggerAction: 'all',
					editable: false,
					forceSelection: true,
					allowBlank: false
				}),{
					fieldLabel: 'Атрибут',
					name: 'attr'
				},
				new Ext.form.ComboBox({
					editable: false,
					forceSelection: true,					
					name: 'mandatory',
					id: 'mandatory',
					store: ['Да', 'Нет'],
					fieldLabel: 'Обязательно для заполнения?',
					triggerAction: 'all',
					allowBlank: false,
					value: 'Да'
				}),	new Ext.form.ComboBox({
					editable: false,
					forceSelection: true,					
					name: 'display',
					id: 'display',
					store: ['Да', 'Нет'],
					fieldLabel: 'Отображать в таблице?',
					triggerAction: 'all',
					allowBlank: false,
					value: 'Да'
				})]
			}]
		});
		return form;
	},
	GetColumnEdit: function() {
		var store = [],
			columns = [],	
            currentIndex = 0,
            record,
            tab = Wizard.Choose.GetTab(),
			fields = Store.GetFields(tab.key);

		Ext.each(fields, function(e, i) {
			columns.push([e.dataIndex, e.header]);
		});
		Ext.each(Store.tabs, function(e, i) {
			store.push(e.id);
		});
		Wizard.Choose.Set({
			next: 'column',
			prev: 'column',
            current: 'column-edit',
            submit: '/api/sig/'+Store.GetSig()+'/store/'+tab.key+'/savecolumn'
		});
        var comboStore = new Ext.data.ArrayStore({
            fields: ['key', 'value'],
            data: columns
        });
		var form = new Ext.FormPanel({
			bodyStyle:'padding:10px;',
			height: Wizard.winFormHeight,
			border: false,
			frame: true,
			items: [{
				xtype: 'fieldset',
				defaultType: 'textfield',
				labelWidth: 150,	
				defaults: {width: 200},
				title: 'Изменить колонку',
				items:[
				new Ext.form.ComboBox({
					triggerAction: 'all',
					mode: 'local',
					store: comboStore,
					fieldLabel: 'Колонка',					
					allowBlank: false,					
					valueField: 'key',
					displayField: 'value',
                    enableKeyEvents: true,
					name: 'name',
					listeners: {
						select: function(c, rec, index) {
							var f = form.getForm(),
								v = fields[index];                            
                            
							switch (v.dataType) {
								default:
									f.findField('value').disable();
									f.findField('link').disable();
                                    f.findField('anchor').disable();
									f.findField('action').disable();									
									break
									
								case 'select':
									f.findField('value').enable();
									f.findField('link').disable();
                                    f.findField('link').disable();
									f.findField('action').disable();
									break									
							}
							f.setValues([
								{id: 'header', value: v.header},
								{id: 'dataIndex', value: v.dataIndex},
								{id: 'order', value: v.order},
								{id: 'dataType', value: v.dataType},
								{id: 'value', value: v.value},
								{id: 'link', value: v.link},
                                {id: 'anchor', value: v.anchor},
								{id: 'action', value: v.action},
								{id: 'attr', value: v.attr},
								{id: 'mandatory', value: v.mandatory},
								{id: 'display', value: v.display},
								{id: 'id', value: v.uId}
							]);
                            currentIndex = index;
                            record = comboStore.getAt(currentIndex);
						},
						beforerender: function() {
							var rec = this.getStore().getAt(0).data;
							this.setValue(rec.value);
                            record = comboStore.getAt(0);
						},
                        keyup: function(t, e) {
                            var v = t.getRawValue();
                            if (typeof record != 'undefined') {
                                record.data.value = v;
                            }
                            Store.tabs[currentIndex].title = v;
                        }
					}
				}),{
					id: 'order',
					fieldLabel: 'Порядок следования',
					value: fields[0].order
				},
				new Ext.form.ComboBox({					
					id: 'dataType',
					hiddenName: 'dataType',
					typeAhead: true,
					triggerAction: 'all',
					disabled: true,
					editable: false,
					mode: 'local',					
					allowBlank: false,
					store: new Ext.data.ArrayStore({
						fields: ['key', 'value'],
						data: [[1, 'char'], [2, 'text'], [3, 'int'], [4, 'datetime'], [5, 'select'], [7, 'link'], [8, 'password'], [9, 'email'], [10, 'phone'], [11, 'autocomplete'], [16, 'money'], [17, 'htmleditor']]
					}),
					fieldLabel: 'Тип',					
					valueField: 'key',
					displayField: 'value',
					listeners: {
						select: function(c, rec, index) {
							var val = rec.data.value,
								f = form.getForm();								
						
							switch (val) {
								case 'select':
									f.findField('value').enable();
									break;
									
								case 'link':
									f.findField('value').enable();
									f.findField('link').enable();
									f.findField('action').enable();
									break;
								
								default:
									f.findField('value').disable();
									f.findField('link').disable();
									f.findField('action').disable();
									break;
							}
						},
						beforerender: function() {	
							var rec = fields[0].dataType,
								store = this.getStore(),
								key;
								
							store.each(function(e, i) {
								if (e.data['value'] == rec) {
									key = e.data['key'];
								}
							});	
							if (key) {
								this.setValue(key);	
							} else {
								this.setValue(1);	// char
							}							
						}						
					}
				}),{
					id: 'value',
					fieldLabel: 'Значение',
					value: fields[0].value,
					disabled: true
				},
				new Ext.form.ComboBox({
					typeAhead: true,
					triggerAction: 'all',
					lazyRender: true,
					store: store,
					fieldLabel: 'Связать с',					
					allowBlank: false,
					mode: 'local',
					valueField: 'key',
					displayField: 'value',
					name: 'link',					
					editable: false,
					disabled: true,
					listeners: {
						beforerender: function() {
							this.setValue(fields[0].link);
						}							
					}
				}),
				new Ext.form.ComboBox({
					typeAhead: true,
					triggerAction: 'all',
					lazyRender: true,
					store: store,
					fieldLabel: 'и полем',					
					allowBlank: false,
					mode: 'local',
					valueField: 'key',
					displayField: 'value',
					name: 'anchor',					
					editable: false,
					disabled: true,
					listeners: {
						beforerender: function() {
							this.setValue(fields[0].link);
						}							
					}
				}),                
				new Ext.form.ComboBox({
					editable: false,					
					name: 'action',
					id: 'action',
					disabled: true,
					store: ['summ','last','count'],
					fieldLabel: 'Действия',
					triggerAction: 'all',
					allowBlank: false,
					listeners: {
						beforerender: function() {
							this.setValue(fields[0].link);
						}
					}
				}),{
					id: 'attr',
					fieldLabel: 'Атрибут',
					value: fields[0].attr
				},
				new Ext.form.ComboBox({
					editable: false,					
					name: 'mandatory',
					id: 'mandatory',
					store: ['Да', 'Нет'],
					fieldLabel: 'Обязательно для заполнения?',
					triggerAction: 'all',
					allowBlank: false,
					listeners: {
						select: function(c, rec, index) {
							var val = rec.data;
                        },
						beforerender: function() {
							this.setValue(fields[0].mandatory);
						}
					}
				}),
                new Ext.form.ComboBox({
					editable: false,					
					name: 'display',
					id: 'display',
					store: ['Да', 'Нет'],
					fieldLabel: 'Отображать в таблице?',
					triggerAction: 'all',
					allowBlank: false,
					listeners: {
						select: function(c, rec, index) {
							var val = rec.data;
                        },
						beforerender: function() {
                            if (fields[0].display) {
                                this.setValue('Да');
                            } else {
                                this.setValue('Нет');
                            }
						}
					}
				}),{
					id: 'id',
					name: 'id',
					value: fields[0].uId,
					hidden: true
				}]
			}]
		});
		return form;
	},
    GetColumnDelete: function() {
		var store = [];

        var SetChooseDefault = function() {
            var rec = comboStore.getAt(0).data;
            this.setValue(rec.value); // this - здесь ComboBox
            Wizard.Choose.Set({
                next: 'column',
                prev: 'column',
                current: 'column-delete',
                submit: '/api/sig/'+Store.GetSig()+'/store/'+rec.key+'/deletecolumn'
            });            
        };
        var SetChooseSelect = function(c, rec, index) {
            var rec = comboStore.getAt(index).data;
            Wizard.Choose.Set({
                next: 'column',
                prev: 'column',
                current: 'column-delete',
                submit: '/api/sig/'+Store.GetSig()+'/store/'+rec.key+'/deletecolumn'
            });
        }
		Ext.each(Store.tabs, function(e, i) {
			store.push([
				e.id,
				e.title
			]);
		}); 
		var comboStore = new Ext.data.ArrayStore({
			fields: ['key', 'value'],
			data: store
		});        
		var form = new Ext.FormPanel({
			bodyStyle:'padding:10px;',
			border: false,
			height: Wizard.winFormHeight,
			frame: true,
			items: [{
				xtype: 'fieldset',
				defaultType: 'textfield',
				labelWidth: 150,	
				defaults: {width: 200},
				title: 'Удалить колонку',
				items: [
					new Ext.form.ComboBox({
						typeAhead: true,
						triggerAction: 'all',
						lazyRender: true,
						store: comboStore,
                        editable: false,
						fieldLabel: 'Колонка',
						allowBlank: false,
						mode: 'local',
						valueField: 'key',
						displayField: 'value',
						name: 'name',
						listeners: {
							beforerender: SetChooseDefault,
                            select: SetChooseSelect
						}
					})
				]
			}]
		});
		return form;
    },    
	Get: function(level) {
		switch (level) {
			default: 
			case 'tab':
				return this.GetTab();
								
			case 'tab-new':
				return this.GetTabNew();
								
			case 'tab-edit':
				return this.GetTabEdit();
				
            case 'tab-delete':
                return this.GetTabDelete();
                
			case 'column':
				return this.GetColumn();
				
			case 'column-new':
				return this.GetColumnNew();
				
			case 'column-edit':
				return this.GetColumnEdit();

			case 'column-delete':
				return this.GetColumnDelete();            
		}		
	}
}