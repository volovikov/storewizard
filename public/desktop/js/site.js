/**
 * Модуль chat для storewizard
 * 
 * @type type
 */
Store.Chat = {    
    Init: function() {
        this.socket = io.connect('http://clients.storewizard.ru'); //<-- тут поменять
        this.socket.on('message', Store.Chat.Recive);
        this.socket.on('operator-status', function() {
            Store.Chat.socket.emit('operator-online', {success: true});
        });
        this.socket.emit('operator-online', {success: true});
        this.socket.on('client-offline', function(data) {
            Store.Chat.Show(data.thread, function() {
                Store.Chat.AreaQuestionAppend({thread: data.thread, question:'Пользователь закрыл окно чата'});
            });
        });
        this.thread = {};
    },
    Show: function(thread, callback) {
        var that = this,
            tmp = {};
    
        if (typeof that.thread[thread] == 'undefined') {
            tmp.question = new Ext.form.TextArea({
                fieldLabel: 'Вопрос',
                name: 'question',
                autoScroll: true,
                readOnly: true,
                height: 120,
                anchor: '-18'
            });
            tmp.answer = new Ext.form.TextArea({
                fieldLabel: 'Ответ',    				
                name: 'answer',
                anchor: '-18'
            });
            tmp.form = new Ext.form.FormPanel({
                frame: true,
                labelWidth: 80,
                defaultType: 'textfield',
                bodyStyle:'padding:5px;',
                border: false,
                items: [tmp.question, tmp.answer]
            });            
            tmp.window = new Ext.Window({
                title: 'Online консультант',
                cls: 'my-panel',
                iconCls: 'icon-edit-window',
                border: false,                
                modal: true,
                width: 500,
                closeAction: 'hide',
                items: tmp.form,
                buttons: [{
                    text: 'Отправить',
                    handler: function() {
                        that.OnClickSend(tmp.answer, thread);
                    }
                },{
                    text: 'Закрыть',
                    handler: function() {
                        that.window.hide();
                    }
                }]
            }) ;           
            that.thread[thread] = tmp;
        }
        that.thread[thread].window.show();

        if (typeof callback != 'undefined') {
            callback();
        }
    },
    Send: function(answerArea, thread) {
        var answer = answerArea.getValue();

        if (answer) {
            this.socket.emit('send', {thread: thread, answer: answer});
            this.AreaAnswerClear(answerArea);
        }
    },
    Recive: function(data) {
        var that = Store.Chat;

        if (data.success) {
            that.Show(data.response.thread, function() {
                that.AreaQuestionAppend(data.response);
            });
        } else {
            Store.Message.Error(data.response);
        }
    },
    AreaQuestionAppend: function(message, type, callback) {
        var thread = message.thread,
            text = this.thread[thread].question.getValue(),
            id = this.thread[thread].question.el.id,
            area = Ext.getCmp(id);
    
        if (!message.answer) {
            text = text + '> ' + message.question + '\n';
        } else {
            text = text + message.answer + '\n';
        }
        this.thread[thread].question.setValue(text);        

        if (typeof area != 'undefined') {    
            area.el.dom.scrollTop = 99999; // scroll down textarea
        }        
        if (typeof callback != 'undefined') {
            callback();
        }
    },
    AreaAnswerClear: function(answerArea) {
        answerArea.setValue('');
    },            
    OnClickSend: function(answerArea, thread) {
        Store.Chat.Send(answerArea, thread);
    }
}