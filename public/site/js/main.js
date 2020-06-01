/**
 * @project: storewizard
 * @date: 2012
 * @author: volovikov
 * @version 1.1
 */
Main = {
    OnReady: function() {
        if ($.browser.msie) {
            return Main.Message.Info('Ошибка! Данная версия броузера не поддерживается! Работать корректно не будет!');
        }
        for (var key in this) {
            var obj = this[key];

            if (typeof obj.OnReady != 'undefined') {
                obj.OnReady();
            }
        }
    },
    OnResize: function() {
        for (var key in this) {
            var obj = this[key];

            if (typeof obj.OnResize != 'undefined') {
                obj.OnResize();
            }
        }
    },
    OnLoad: function() {
        for (var key in this) {
            var obj = this[key];

            if (typeof obj.OnLoad != 'undefined') {
                obj.OnLoad();
            }
        }
    },
    OnClickFavorite: function(a) {
        var title = 'Программа для автоматизации работы',
                url = 'http://storewizard.ru';

        try {
            window.external.AddFavorite(url, title);
        }
        catch (e) {
            try {
                window.sidebar.addPanel(title, url);
            }
            catch (e) {
                if (typeof opera == 'object') {
                    a.rel = 'sidebar';
                    a.title = title;
                    a.url = url;
                    return true;
                } else {
                    Main.Message.Info('Нажмите Ctrl-D чтобы добавить страницу в закладки');
                }
            }
        }
        return false;
    }
}
Main.Counter = {
    OnReady: function() {
        this.AddGoogleAnalytic();
    },
    AddGoogleAnalytic: function() {
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', 'UA-34031443-1']);
        _gaq.push(['_trackPageview']);

        (function() {
            var ga = document.createElement('script');
            ga.type = 'text/javascript';
            ga.async = true;
            ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(ga, s);
        })();
    }
}
Main.Chat = {
    OnReady: function() {
        this.messages = [];
        this.socket = io.connect('http://localhost:8082/'); //<-- тут поменять
        this.socket.on('message', this.Recive);
        this.socket.emit('operator-status', function(response) {
            if (response.success && response.statis == 'online') {
                Main.Chat.SetChatEnable();
            }
        });
        this.socket.on('operator-online', this.SetChatEnable);
        this.socket.on('operator-offline', this.SetChatDisable);
    },
    OnClickSend: function(el) {
        this.Send();
    },
    OnClickClose: function(windowId) {
        this.socket.emit('client-offline', {success: true, thread: this.GetThread()});
        Main.Window.Close(windowId);
    },
    GetThread: function() {
        var MakeThread = function(length) {
            var salts = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                    thread = '',
                    length = (typeof length == 'undefined') ? 10 : length;

            for (var i = 0; i < length; i++) {
                thread += salts.charAt(Math.floor(Math.random() * salts.length - 1));
            }
            return thread;
        }
        if (typeof this.thread == 'undefined') {
            return this.thread = MakeThread();
        } else {
            return this.thread;
        }
    },
    SetChatEnable: function() {
        var chatButton = $('.OnlineChat'),
            chatWindow = $('#form-onlinechat');

        chatButton.removeClass('Offline');    
    },
    SetChatDisable: function() {
        var chatButton = $('.OnlineChat'),
            chatWindow = $('#form-onlinechat');
    
       chatButton.addClass('Ofline');
    },
    Send: function() {
        var question = $('#OnlineChatQuestion').val();

        if (question) {
            this.socket.emit('send', {thread: Main.Chat.GetThread(), question: question});
            this.AreaQuestionClear();
        }
    },
    Recive: function(data) {
        if (data.success) {
            if (data.response.thread == Main.Chat.GetThread()) {
                Main.Chat.AreaAnswerAppend(data.response);
            }
        } else {
            Main.Message.Error(data.response || 'Ошибка соединения');
        }
    },
    AreaQuestionClear: function() {
        var area = $('#OnlineChatQuestion');

        if (area.length) {
            area.val('');
        }
    },
    AreaAnswerAppend: function(message, callback) {
        var area = $('#OnlineChatAnswer');
        
        var AddHe = function(text) {
            area.append('<div class="He">' + text + '</div>').scrollTop(999999);
        };
        var AddMe = function(text) {
            area.append('<div class="Me">> ' + text + '</div>').scrollTop(999999);
        };
        if (!message.answer) {
            AddMe(message.question);
        } else {
            AddHe(message.answer);
        }
        if (typeof callback != 'undefined') {
            callback();
        }
    }
}
Main.Window = {
    OnReady: function() {
        this.MaskResize();
    },
    OnResize: function() {
        setTimeout(this.MaskResize, 300);
    },
    OnClickClose: function(el) {
        var id = $(el).parents('.Window').attr('id');

        if (typeof id != 'undefined') {
            this.Close(id);
        }
        if (typeof this.callback != 'undefined') {
            this.callback();
        }
    },
    MaskResize: function() {
        var w, h;

        if ($(document).width() > $(window).width()) {
            w = $(document).width();
        } else {
            w = $(window).width();
        }
        h = $(document).height();
        $(".Mask").height(h).width(w);
    },
    Close: function(id) {
        $('#' + id).removeClass('Active').prev().removeClass('Active');
    },
    CloseAll: function() {
        var that = this,
                w = $('.Window').toArray();

        $.each(w, function() {
            that.Close($(this).attr('id'));
        });
    },
    Open: function(id, closeAll, callback) {
        if (typeof closeAll != 'undefined') {
            this.CloseAll();
        }
        $('#' + id).addClass('Active').prev().addClass('Active');

        if (typeof callback != 'undefined') {
            this.callback = callback;
        }
    }
}
Main.Slider = {
    OnReady: function(root) {
        this.cursor = 1;
        this.position = 0;
        this.speed = 800;
        this.root = root ? root : '.Slider';
        this.slide = $(this.root + ' .Slide');
        this.tape = $(this.root + ' .Tape');
        this.total = this.slide.length;
        this.step = $(this.slide[0]).width() + 30;
        this.tape.css('width', parseInt(this.step * this.total + 10) + 'px');
    },
    OnClickBegin: function() {
        if (this.cursor > 0) {
            this.cursor = 0;
            this.position = this.cursor * this.step;

            this.tape.animate({
                left: '-' + this.position + 'px'
            }, this.speed);
        }
    },
    OnClickEnd: function() {
        if (this.cursor != this.total) {
            this.cursor = this.total;
            this.position = (this.cursor - 1) * this.step;

            this.tape.animate({
                left: '-' + this.position + 'px'
            }, this.speed);
        }
    },
    OnClickBack: function() {
        if (this.cursor > 1) {
            this.cursor--;
            this.position -= this.step;

            this.tape.animate({
                left: '-' + this.position + 'px'
            }, this.speed);
        }
    },
    OnClickForward: function() {
        if (this.cursor < this.total) {
            this.cursor++;
            this.position += this.step;

            this.tape.animate({
                left: '-' + this.position + 'px'
            }, this.speed);
        }
    }
}
Main.Video = {
    OnClickReload: function() {

    },
    OnClickBegin: function() {

    },
    OnClickPlay: function() {

    },
    OnClickEnd: function() {

    },
    OnClickSound: function() {

    }
}
Main.TabPanel = {
    OnReady: function() {
        this.panel = $('.TabPanel');
        this.header = this.panel.find('.Header .Item');
        this.body = this.panel.find('.Body .Item');
        this.switchInterval = 30000;
        this.cursor = 0;
        this.total = this.header.length - 1;

        // TODO: в продакшене включить!
        return;

        setInterval(function() {
            Main.TabPanel.Play()
        }, this.switchInterval);
    },
    OnClickTab: function(index) {
        if (this.SetActiveTab(index)) {
            this.cursor = index;
        }
    },
    SetActiveTab: function(index) {
        if (index >= 0 && index < this.body.length) {
            this.header.removeClass('Active');
            this.body.removeClass('Active');
            $(this.header[index]).addClass('Active');
            $(this.body[index]).addClass('Active');
            return true;
        } else {
            return false;
        }
    },
    Play: function() {
        if (this.cursor < this.total) {
            this.cursor++;
        } else if (this.cursor == this.total) {
            this.cursor = 0;
        }
        this.SetActiveTab(this.cursor);
    }
}
Main.Select = {
    OnClickItem: function(el) {
        var select = $(el).parents('.Select'),
                options = select.find('.Options'),
                visible = $(el).attr('display'),
                hidden = $(el).attr('value');

        this.Set(select, hidden, visible);
        this.Close(options);
    },
    OnClickTrigger: function(el) {
        var select = $(el).parents('.Select'),
                options = select.find('.Options');

        if (this.IsOpen(options)) {
            this.Close(options);
        } else {
            this.Open(options);
        }
    },
    Set: function(select, hidden, visible) {
        select.find('.Hidden').val(hidden);
        select.find('.Visible').val(visible);
    },
    IsOpen: function(el) {
        return $(el).hasClass('Active') ? true : false;
    },
    Open: function(el) {
        $(el).addClass('Active');
    },
    Close: function(el) {
        $(el).removeClass('Active');
    }
}
Main.Calculate = {
    OnReady: function() {
        this.delay = 300;
        this.bg = '#fefa76';
        var select = $($('.Calculate').find('.Select')[0]);
        var hidden = select.find('.Hidden').val();
        var visible = select.find('.Visible').val();

        if (select.length) {
            this.Set(select, hidden, visible);
        }
    },
    OnClickItem: function(el) {
        var all = $('.Item').toArray();

        for (var i in all) {
            var item = all[i];

            if ($(item).attr('display') === $(el).attr('display')) {
                Main.Select.OnClickItem(item);
            }
        }
        return Main.Select.OnClickItem.call(Main.Calculate, el);
    },
    OnClickTrigger: function(el) {
        return Main.Select.OnClickTrigger.call(Main.Calculate, el);
    },
    Set: function(select, hidden, visible) {
        var that = this,
                form = select.parents('.Form'),
                fields = form.find('.Input').toArray(),
                post = [];

        Main.Select.Set.call(Main.Calculate, select, hidden, visible);

        for (var i in fields) {
            var field = $(fields[i]);

            if (field.attr('name') == 'product' || field.attr('name') == 'period') {
                post.push(field.attr('name') + '/' + field.attr('value'));
            }
        }
        $.ajax({
            url: '/price/' + post.join('/'),
            type: 'get',
            success: function(r) {
                if (r.success) {
                    that.RefreshResult(form, r.data);
                    that.FocusResult(form);
                } else {
                    Main.Message.Error(r.message);
                }
            },
            failure: function() {
                Main.Message.Failure();
            }
        })
    },
    RefreshResult: function(form, data) {
        var summary = $('.Summary');

        summary.html(
                '<div class="Row" style="border-bottom: solid 1px white; line-height: 30px;">' +
                '<div class="Col" style="width:40%">Итого</div>' +
                '<div class="Col" style="width:40%">В месяц</div>' +
                '<div class="Col" style="width:18%">Скидка</div>' +
                '</div>' +
                '<div class="Row" style="line-height: 30px;">' +
                '<div class="Col" style="width:40%">' + data.total + ' руб.</div>' +
                '<div class="Col" style="width:40%">' + data.permonth + ' руб.</div>' +
                '<div class="Col" style="width:18%">' + data.discount + '</div>' +
                '</div>'
                );
    },
    FocusResult: function(form) {
        var summary = form.find('.Summary'),
                bg = summary.css('background-color');

        summary.css('background-color', this.bg);
        setTimeout(function() {
            summary.css('background-color', bg)
        }, this.delay);
    },
    IsOpen: function(el) {
        return Main.Select.IsOpen.call(Main.Calculate, el);
    },
    Open: function(el) {
        return Main.Select.Open.call(Main.Calculate, el);
    },
    Close: function(el) {
        return Main.Select.Close.call(Main.Calculate, el);
    }
}
Main.Form = {
    OnReady: function() {
        this.badvalue = 'Ошибка! Поле не заполнено';
        this.bademail = 'Ошибка! Поле e-mail заполнено не верно!';
        this.badphone = 'Ошибка! Поле Телефон заполнено не верно!'
    },
    OnClickSubmit: function(el) {
        var form = $(el).parents('.Control').prev();
        var valid = this.Validate(form);

        if (form.length > 0 && valid === true) {
            this.Submit(form);
        }
    },
    Submit: function(form) {
        var fields = form.find('.Input').toArray(),
                post = [];

        for (i in fields) {
            var field = $(fields[i]),
                    val = field.val();

            post.push(field.attr('name') + '=' + val);
        }
        $.ajax({
            url: form.attr('action'),
            data: post.join('&'),
            dataType: 'json',
            type: 'post',
            success: function(r) {
                if (r.success) {
                    Main.Message.Info(r.message, function() {
                        Main.Window.CloseAll();
                    });
                    form.parents('.Window')
                } else {
                    Main.Message.Error(r.message);
                }
            },
            failure: function() {
                Main.Message.Failure();
            }
        })
    },
    Validate: function(form) {
        var fields = form.find('.Input').toArray();

        for (var i in fields) {
            var field = $(fields[i]),
                    val = field.val();

            if (val == '') {
                this.SetError(field, this.badvalue)
            } else if (field.attr('name') == 'email' && !this.CheckEmail(field)) {
                this.SetError(field, this.bademail);
            } else if (field.attr('name') == 'phone' && !this.CheckPhone(field)) {
                this.SetError(field, this.badphone);
            } else {
                this.UnsetError(field);
            }
        }
        if (form.find('.Error').length > 0) {
            return false;
        } else {
            return true;
        }
    },
    CheckEmail: function(field) {
        return field.val().match(/^[a-zA-Z0-9_\.]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$/);
    },
    CheckPhone: function(field) {
        return field.val().match(/^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}/);
    },
    SetError: function(field, error) {
        field.parent().addClass('Error');
        field.attr('title', error);
        field.parents('.Field').find('.Tip').html(error);
    },
    UnsetError: function(field) {
        field.parent().removeClass('Error');
        field.attr('title', '');
        field.parents('.Field').find('.Tip').html('');
    }
}
Main.Message = {
    Error: function(txt, callback) {
        $('#message-error').find('.Text').html(txt);
        Main.Window.Open('message-error', callback);
    },
    Info: function(txt, callback) {
        $('#message-info').find('.Text').html(txt);
        Main.Window.Open('message-info', callback);
    },
    Warning: function(txt, callback) {
        $('#message-warning').find('.Text').html(txt);
        Main.Window.Open('message-warning', callback);
    },
    Failure: function() {
        Main.Message.Error('Ошибка! Не могу соединиться с сервером. Повторите попытку позже');
    }
}
$(document).ready(function() {
    Main.OnReady();
});
$(window).resize(function() {
    Main.OnResize();
});
