var express = require('express'),
    app = express.createServer(),
    path = require('path'),
    fs = require('fs'),
    socket = require('socket.io').listen(app);

app.listen(8080, '127.0.0.2');

app.configure(function() {
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser({
        keepExtensions: true,
        uploadDir: __dirname + '/tmp',
    }));
    app.use(express.methodOverride());
    app.use(app.router);
});
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/carpc-client.html');
});
app.post("/log/upload", function(req, res) {
    var MAX_SIZE = 2*1024*1024, // 2mb
        PAUSE_TIME = 1000;

    var fileName = 'current-carpc-log.txt',
        filePath = 'tmp/' + fileName,
        bytesUploaded = 0;
        file = fs.createWriteStream(filePath, {
            flags: 'w',
            encoding: 'binary',
            mode: 0644
        });

    req.on('data', function(chunk) {
        if (bytesUploaded + chunk.length > MAX_SIZE) {
            file.end();
            res.send(JSON.stringify({error: "Too big."}));
            return;
        }
        file.write(chunk);
        bytesUploaded += chunk.length;
        req.pause();
        setTimeout(function() {req.resume();}, PAUSE_TIME);
    }).on('end', function() {
        file.end();
        res.end('ok');
        emulator.run('tmp/' + fileName);
    });
});
app.post("/log/uploadBlock", function(req, res) {
    var logBlockText = req.body.logBlockText,
        asc2Text = carPc._h2a(logBlockText);

    var fileName = 'current-carpc-log-block.txt',
        filePath = 'tmp/' + fileName;

    fs.writeFile(filePath, asc2Text, 'binary', function(err) {
        if (!err) {
            emulator.run('tmp/' + fileName);
        }
    });
});
socket.configure(function() {
    socket.set('transports', ['xhr-polling']);
    socket.set('polling duration', 10);
    socket.set('log level', 1);
});
var emulator = {
    delay: 20,
    run: function(filePath) {
        var that = this;

        // BB
        // new load. release variation
        //
        carPc.init();

        fs.readFile(filePath, 'binary', function (err, data) {
            if (!err) {
                setTimeout(function go(i) {
                    if (i < data.length) {
                        io.sockets.emit('emulator-write-raw-data', data[i]);
                        carPc.readRawData(data[i]);
                        setTimeout(go, that.delay, i+1);
                    }
                }, 0, 0);
            }
        });
    }
};
var CarPc = function(options) {
    this.carType = 'euro';
    this.buffer = [];
    this.command = [];
    this.magnitolaRunMode = 'radio'; // radio || cd-load || cd-loaded
    this.radioProperty = {
        wave: 'FM1',
        chanel: 0, //<-- default
        text: '',
        stereo: false,
        freq: ''
    };
    this.knowCommand = {
        magnitolaWriteRadio:    'e8',
        magnitolaWrite:         'e1',
        canWriteTemperature:    'e2',
        canWriteFuelCons:       'e4',
        canWriteRangeAndDist:   'e5',
        canWriteAccelAndRpm:    'e6',
        canAudioButtonPress:    'e0'
    };
};
CarPc.prototype._h2a = function(hex) {
    var hex = hex.toString(),
        str = '';

    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
};
CarPc.prototype._a2h = function(str) {
    var arr = [];

    for (var i = 0, l = str.length; i < l; i ++) {
        var hex = Number(str.charCodeAt(i)).toString(16);
        arr.push(hex);
    }
    return arr.join('');
};
CarPc.prototype._h2d = function(hex) {
    return parseInt(hex, 16);
};
CarPc.prototype.init = function() {
    this.radioProperty = null;
    this.magnitolaRunMode = 'radio';
};
CarPc.prototype.getServerTime = function() {
        var d = new Date(),
            h = d.getHours(),
            m = d.getMinutes();

        if (h < 10) {
            h = '0' + h;
        }
        if (m < 10) {
            m = '0' + m;
        }
        return h + ':' + m;
};
CarPc.prototype.setCarType = function(type) {
    this.carType = type;
};
CarPc.prototype.readRawData = function(char) {
    var buffLength = this.buffer.length,
        charHex = this._a2h(char);

    if (charHex.length == 1) {
        charHex = '0' + charHex;
    }
    if (buffLength && this.buffer[buffLength-1] == '0d' && charHex == '0a') {
        this.buffer.push(charHex);
        var command = this.buffer.join('');
        io.sockets.emit('server-command-match', {
            command: command,
            knowCommand: this.knowCommand
        });
        this.command.push(command);
        this.runCommand(command);
        this.buffer = [];
    } else {
        this.buffer.push(charHex);
    }
};
CarPc.prototype.runCommand = function(command) {
    var command = command.substr(0, command.length-4); //<-- cut \0d\0a

    for (var commandName in this.knowCommand) {
        var commandCode = this.knowCommand[commandName];

        if (command.indexOf(commandCode) == 0) {
            switch (commandName) {
                case 'magnitolaWrite':
                    this.runCmdMagnitolaWrite(command.substr(2));
                    break;

                case 'magnitolaWriteRadio':
                    this.runCmdMagnitolaWriteRadio(command.substr(2));
                    break;

                case 'canWriteTemperature':
                    this.runCmdCanWriteTemperature(command.substr(2));
                    break;

                case 'canWriteFuelCons':
                    this.runCmdCanWriteFuelCons(command.substr(2));
                    break;

                case 'canWriteRangeAndDist':
                    this.runCmdCanWriteRangeAndDist(command.substr(2));
                    break;

                case 'canWriteAccelAndRpm':
                    this.runCmdCanWriteAccelAndRpm(command.substr(2));
                    break;

                case 'canAudioButtonPress':
                    this.runCmdCanAudioButtonPress();
            }
        }
    }
};
CarPc.prototype.runCmdCanAudioButtonPress = function() {
    io.sockets.emit('command-can-audio-button-press');
};
CarPc.prototype.runCmdCanWriteAccelAndRpm = function(text) {
    var rpmH = text.substr(0, 2),
        rpmL = text.substr(2, 2),
        engTmp = text.substr(4, 2),
        accel = text.substr(6, 2);

    var value = {
        rpm: this._h2d(rpmH + rpmL),
        engTmp: this._h2d(engTmp) == 254 ? '' : this._h2d(engTmp) - 40,
        accel: this._h2d(accel)
    };
    io.sockets.emit('command-can-write-accel-and-rpm', value);
};
CarPc.prototype.runCmdCanWriteRangeAndDist = function(text) {
    var mult = 10,
        s;

    var range = text.substr(0, 2),
        tripAh = text.substr(2, 2),
        tripAl = text.substr(4, 2),
        tripBh = text.substr(6, 2),
        tripBl = text.substr(8, 2),
        tripAllh = text.substr(10, 2),
        tripAllm = text.substr(12, 2),
        tripAlll = text.substr(14, 2);

    // BB
    // for Euro car may be lost last char
    //
    if (tripAllh && tripAllm && tripAlll) {
        s = (this._h2d(tripAllh) * 65536 + this._h2d(tripBh) * 256 + this._h2d(tripAlll)).toFixed(1);
    } else {
        s = 'NaN';
    }
    var value = {
        range: (this._h2d(range) * mult).toFixed(1), // <-- mil
        rangeTripA: (this._h2d(tripAh) * 256  + this._h2d(tripAl)).toFixed(1),
        rangeTripB: (this._h2d(tripBh) * 256  + this._h2d(tripBl)).toFixed(1),
        rangeTripSum: s
    };
    io.sockets.emit('command-can-write-range-and-dist', value);
};
CarPc.prototype.runCmdCanWriteFuelCons = function(text) {
    var mult = 0.2;

    var currentTrip = text.substr(0, 2),
        mpg = text.substr(2, 2),
        tripA = text.substr(4, 2),
        tripB = text.substr(6, 2);

    var value = {
        currentTrip: currentTrip == '45' ? 'A' : 'B',
        mpg: (this._h2d(mpg) * mult).toFixed(1),
        tripA: (this._h2d(tripA) * mult).toFixed(1),
        tripB: (this._h2d(tripB) * mult).toFixed(1)
    };
    io.sockets.emit('command-can-write-fuel-cons', value);
};
CarPc.prototype.runCmdCanWriteTemperature = function(text) {
    var mult = 0.5; // <-- for USA 0.9 mult

    var f2c = function(fv) {
    	fv = fv * 9 / 5 + 32;
    	fv = Math.round(fv);
        return fv;
    };
    var f = (this._h2d(text) == 254) ? '' : f2c(this._h2d(text) * 0.9 - 40);

    io.sockets.emit('command-can-write-temperature', this._h2d(text) * mult - 40);
};
CarPc.prototype.runCmdMagnitolaWriteRadio = function(text) {
    var that = this,
        cmd = text.substr(4, 2);

    var getRadioFreq = function(text) {
        var freq1 = text.substr(34, 2),
            freq2 = text.substr(36, 2),
            freq3 = text.substr(38, 2),
            c1;

        if (freq1 != 'bb') {
            c1 = String.fromCharCode(that._h2d(freq1.substr(1, 1)) + 48);
        } else {
            c1 = '';
        }
        var c2 = String.fromCharCode(that._h2d(freq2.substr(0, 1)) + 48),
            c3 = String.fromCharCode(that._h2d(freq2.substr(1, 1)) + 48),
            c4 = String.fromCharCode(that._h2d(freq3.substr(0, 1)) + 48),
            c5 = that._h2d(freq3.substr(1, 1)) + 48;

        if (c5 >= 48 && c5 <= 57) {
            return c1+c2+c3+'.'+c4+String.fromCharCode(c5);
        } else {
            // BB
            // for MW no C5
            //
            return c1+c2+c3+'.'+c4;
        }

    };
    var getRadioChannel = function(text) {
        var ch = that._h2d(text.substr(40, 2));

        if (ch > 6) {
            return null;
        } else {
            return ch;
        }
    };
    var getRadioBand = function(text) {
        var t = text.substr(26, 2);

        switch (t) {
            default:
                return null;

            case '01':
                return 'FM1';

            case '02':
                return 'FM2';

            case '03':
                return 'FM3';

            case '20':
                return 'MW';

            case '30':
                return 'LW';
        }
    };
    var getRadioStereoStatus = function(text) {
        var t = text.substr(24, 2);

        if (t == '00') {
            return false;
        } else {
            return true;
        }
    };
    var isTextIsNull = function(text) {
        return text == '0000000000000000';
    };
    var getPosTwoCommand = function(text) {
        return text.indexOf('e8010e17');
    };
    var getDiskPlace = function(text) {
        var tmp = that._h2d(text.substr(52)),
            bin = tmp.toString(2),
            arr = [];
console.log(text, tmp);
        if (isNaN(tmp)) {
            return null;
        }
        var s = "000000000" + bin;
        s = s.substr(s.length-8);

        for (var i=s.length; i>=0; i--) {
            var ch = s.charAt(i);

            if (ch == '1') {
                arr.push(8-i);
            }
        }
        return arr;
    };
    var p = getPosTwoCommand(text);

    if (p != -1) {
        var a = text.substr(0, p),
            b = text.substr(p+2);

        this.runCmdMagnitolaWriteRadio(b);
        text = a;
    }
    switch (cmd) {
        // radio channel property
        case '17':
            var wave = getRadioBand(text),
                stereo = getRadioStereoStatus(text),
                channel = getRadioChannel(text),
                freq = getRadioFreq(text),
                disk = getDiskPlace(text);

            var v = {
                wave: wave,
                stereo: stereo,
                freq: freq,
                channel: channel,
                text: freq,
                disk: disk,
                magnitolaMode: that.magnitolaRunMode
            };
            if (!that.radioProperty) {
                io.sockets.emit('command-magnitola-write', v);
            } else if (that.radioProperty.chanel != channel) {
                io.sockets.emit('command-magnitola-write', v);
            }
            that.radioProperty = v;
            break;

        // radio rds
        case '10':
            var channelNum = this._h2d(text.substr(16, 2)),
                text = text.substr(22, 16);

            if (that.magnitolaRunMode != 'cd-loaded') {
                that.magnitolaRunMode = 'radio';

                if (!isTextIsNull(text)) {
                    if (!that.radioProperty) {
                        return;
                    } else if (that.radioProperty.chanel == channelNum || channelNum == 0) {
                        var t = this._h2a(text);
                        that.radioProperty.text = t.replace(/(^\s+|\s+$)/g,'');
                        io.sockets.emit('command-magnitola-write', that.radioProperty);
                    }
                }
            }
            break;

        // button press
        case '06':
            var btn = text.substr(14, 6);

            switch (btn) {
                case '010101':
                    this.magnitolaRunMode = 'radio';
                    break;
            }
            break;
    }
};
CarPc.prototype.runCmdMagnitolaWrite = function(text) {
    var dest = text.substr(0, 2),
        value = text.substr(2);

    switch (dest) {
        case 'ff':
            io.sockets.emit('command-magnitola-write-volume', this._h2a(value)); // mute тоже тут
            break;

        case '41':
        case '42':
        case '43':
        case '44':
        case '45':
        case '46':
            if (text == '4143443120202020204c4f4144454420202001') {
                this.magnitolaRunMode = 'cd-loaded';
            } else {
                this.magnitolaRunMode = 'cd-load';
            }
console.log(this);
            io.sockets.emit('command-magnitola-write-cd', this._h2a(value));
            break;

        case '10':
            io.sockets.emit('command-magnitola-write-cd', this._h2a(value));
            break;

        case '20':
            io.sockets.emit('command-magnitola-off');
            break;
    }
}
var carPc = new CarPc({

});
var io = socket.on('connection', function(socket) {
    socket.on('client-time-request', function() {
        socket.emit('server-time-response', carPc.getServerTime());
    });
    socket.on('client-set-car-type', function(clientCarType) {
        carPc.setCarType(clientCarType);
    });
});
console.log('Web Server running at 127.0.0.2:8080');