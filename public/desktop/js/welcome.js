/* 
 * @name: StoreWizard welcome client application part
 * @author: volovikov
 * @date: 6-августа-2012
 * @version: 1.1 beta
 */

Welcome = {
	Init: function() {
		Ext.apply(Ext.form.VTypes, {
			validemail : function(val, field) {
				var reg = /^[a-zA-Z0-9_\.]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]{2,5}$/i;
				return (val.search(reg) != -1) ? true : false;
			}, validemailText : 'Ошибка! Вы не верно ввели Email. Формат ввода user@example.ru',

			validlogin : function(val, field) {
				var reg = /^[a-zA-Z0-9@._]{3,}$/i;
				return (val.search(reg) != -1) ? true : false;
			}, validloginText : 'Ошибка! Вы не верно ввели Login. Поле Login должно быть больше трех символов и не должено содержать специальных символов!',

			validpassword : function(val, field) {
				return (val.length > 3) ? true : false;
			}, validpasswordText : 'Ошибка! Вы не верно ввели Пароль. Пароль должен быть больше трех символов!'
		});		
		Ext.QuickTips.init();
		Ext.form.Field.prototype.msgTarget = 'side';
		Ext.History.init();
		return this;
	},
	Run: function() {
		Welcome.Window.Login.Show();
		return this;
	},
	Done: function() {
		
	}
}
Welcome.Util = {
	Ajax: function(config) {
		if (typeof config.method == 'undefined') {
			config.method = 'post';
		}		
		config.url = Ext.urlAppend(config.url, 'dc=' + (new Date().getTime()));
		Ext.Ajax.request(config);		
	}
};
Welcome.Window = {
	Error: function(text, callback) {
		Ext.Msg.show({
			title: "Ошибка",
			msg: text,
			buttons: Ext.Msg.OK,
			fn: callback,
			icon: Ext.MessageBox.ERROR
		});					
	}, 
	Message: function(text, callback) {
		Ext.Msg.show({
			title: "Сообщение",
			msg: text,
			buttons: Ext.Msg.OK,
			fn: callback,
			icon: Ext.MessageBox.INFO
		});			
	},
	Confirm: function(text, callback) {
		Ext.Msg.show({
			title:'Подтвердите',
			msg: text,
			buttons: Ext.Msg.OKCANCEL,
			fn: callback,
			icon: Ext.MessageBox.QUESTION
		});					
	}
};
Welcome.Window.Login = {
	Form: function() {
		this.form =  new Ext.FormPanel({
			labelWidth: 100,
			formId: "loginform",
			frame: true,
			bodyStyle:'padding: 5px',
			width: 450,
			defaults: {width: 245},
			defaultType: 'textfield',
			items: [{
				fieldLabel: 'Логин',
				name: 'login',
				allowBlank:false,
				vtype: "validlogin"
			},{
				fieldLabel: 'Пароль',
				name: 'password',
				inputType: 'password',
				allowBlank:false,
				vtype: "validpassword",
				id: 'password'
			}],
			keys: [
				{key: [Ext.EventObject.ENTER], handler: function() {
                    Welcome.Window.Login.OnEnter();
                }
            }]		
		});
		return this.form;
	},
	OnRemind: function() {
		this.Hide();
		Welcome.Window.Remind.Show();
	},
	OnEnter: function() {
        var SetCookie = function(object) {
            var array = [];
                expires = new Date();

            for (var key in object) {
                var val = object[key];
                array.push(key+'='+escape(val));            
            }
            document.cookie = array.join('&')+'; expires='+expires.getTime() + (1000 * 86400 * 365)+'; path=/';
        };        
		if (typeof this.me == "undefined") {
			return false;
		}
		if (form = this.form.getForm()) {
			if (form.isValid()) {
				Welcome.Util.Ajax({
					form: form.id,
					url: "/api/enter/",
					success: function(r) {
						var response = Ext.util.JSON.decode(r.responseText);
						
						if (response.success) {
                            SetCookie({sig: response.sig});
							location.reload(true);
						} else {
							Welcome.Window.Error(response.message, function() {
								form.reset();
							});
						}
					},
					failure: function(r) {
						Welcome.Window.Error('Ошибка! Не могу соединиться с сервером', function() {
							form.reset();
						});
					}
				});				
			}
		}
	},
	OnTip: function(position) {
		if (typeof this.tip != 'undefined') {
			this.tip.showBy(position);
		} else {
			this.tip = new Ext.Tip({
				title: 'Подсказка',
				html: 'Воспользуйтесь данной формой, чтобы войти в систему. Для этого нужно заполнить поля Логин и Пароль. В случае, если вы забыли свой Пароль, нажмите на кнопку Напомнить.',
				width: 250,
				autoHide: false,
				closable: true,
				draggable: true
			});
			return this.tip.showBy(position);
		}
	},
	Show: function() {
		if (typeof this.me != "undefined") {
			return this.me.show();
		} else {
			this.me = new Ext.Window({
				iconCls: 'icon-login',
				layout: 'fit',
				modal: false,
				title: "Авторизация",
				width: 405,
				height: 140,
				plain: false,
				border: false,
				resizable: false,
				closable: false,
				items : this.Form(),
				tools: [{
				id: "help",
					handler: function() {
						Welcome.Window.Login.OnTip(this.id);
					}
				}],
				buttons: [{
					text: 'Напомнить',
					handler: function() {
						Welcome.Window.Login.OnRemind();
					}								
				},{
					text: 'Войти',
					focus: true,
					handler: function() {
						Welcome.Window.Login.OnEnter();
					} 
				}]				
			});	
			return this.me.show();
		}
	},
	Hide: function() {
		if (typeof this.me != "undefined") {
			this.me.hide();
		}
	}
}
Welcome.Window.Remind = {
	OnRemind: function() {				
		if (form = this.form.getForm()) {
			if (form.isValid()) {
				Welcome.Ajax({
					url: '?task=Remind',
					form: form.id,
					success: function(r) {
						var response = Ext.util.JSON.decode(r.responseText);
						
						if (response.success) {
							Welcome.Window.Message(response.message, function() {
								Welcome.Window.Remind.OnClose();
							});							
						} else {
							Welcome.Window.Error(response.message, function() {
								Welcome.Window.Remind.OnClose();
							});
						}
					}, 
					falure: function(r) {
						Welcome.Window.Error('Ошибка! Не могу соединиться с сервером', function() {
							form.reset();
						});
					}
				});				
			}
		}
	},
	OnClose: function() {
		this.Hide();
		Welcome.Window.Login.Show();				
	},
	OnTip: function(position) {
		if (typeof this.tip != 'undefined') {
			this.tip.showBy(position);
		} else {
			this.tip = new Ext.Tip({
				title: "Подсказка",
				html: 'Воспользуйтесь данной формой, чтобы напомнить пароль для входа в систему. В поле Эл.адрес введите адрес своего электронного ящика. На этот адрес будет отправлено письмо с дальнейшими инструкциями.',
				width: 250,
				autoHide: false,
				closable: true,
				draggable: true
			})
			this.tip.showBy(position);				
		}
	},
	Form: function() {
		this.form = new Ext.FormPanel({
			labelWidth: 100,
			formId: "remindform",
			frame: true,
			bodyStyle:'padding: 5px',
			width: 450,
			defaults: {width: 240},
			defaultType: 'textfield',
			items: [{
				fieldLabel: 'Эл.адрес',
				name: 'email',
				allowBlank:false,
				vtype: "validemail"
			}]
		});
		return this.form;
	},
	Remind: function() {

	},
	Show: function() {
		if (typeof this.me != "undefined") {
			return this.me.show();
		} else {
			this.me = new Ext.Window({
				iconCls: 'icon-login',
				layout: 'fit',
				modal: false,
				title: "Напомнить пароль",
				width: 400,
				height: 110,
				plain: false,
				border: false,
				resizable: false,						
				items : this.Form(),
				tools: [{
					id: "help",
					handler: function() {
						Welcome.Window.Remind.OnTip(this.id);
					}
				},{
					id: "close",
					handler: function() {
						Welcome.Window.Remind.OnClose();
					}
				}],
				buttons: [{
					text: 'Назад',
					handler: function() {
						Welcome.Window.Remind.OnClose();
					}
				},{
					text: 'Напомнить',
					handler: function() {
						Welcome.Window.Remind.OnRemind();
					}								
				}]						
			});
			return this.me.show();
		}
	},
	Hide: function() {
		if (typeof this.me != "undefined") {
			this.me.hide();
		}				
	}
}
Ext.onReady(function() {
	Welcome.Init().Run().Done();
});