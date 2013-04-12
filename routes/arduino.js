var firmata = require('firmata'),
    _ = require('underscore');

var BUTTON_PIN = 13,
    DEBOUNCE_POINTS = 10,
    DEBOUNCE_TOLERANCE = 2;

var Arduino = function (config) {
    var device = config.device,
        name = config.name,
        self = this,
        a0 = name + '-1',
        a1 = name + '-2',
        a2 = name + '-3',
        a3 = name + '-4';

    this.button = name + '-b',

    this.values = {};
    this.values[a0] = [0];
    this.values[a1] = [0];
    this.values[a2] = [0];
    this.values[a3] = [0];

    this.socket = undefined;

    var board = new firmata.Board(device, function() {
        console.log('board connected at ' + device);

        board.pinMode(BUTTON_PIN, board.MODES.INPUT);
        board.digitalRead(BUTTON_PIN, self.handleButtonPress.call(self));

        board.analogRead(board.pins[14].analogChannel, self.sendDataToPin.call(self, a0));
        board.analogRead(board.pins[15].analogChannel, self.sendDataToPin.call(self, a1));
        board.analogRead(board.pins[16].analogChannel, self.sendDataToPin.call(self, a2));
        board.analogRead(board.pins[17].analogChannel, self.sendDataToPin.call(self, a3));
    });
};

Arduino.prototype.handleButtonPress = function() {
    var self = this;
    return function(value) {
        if (value === 1) {
            self.socket.emit(self.button, {
                'data': true
            });
        }
    };
};

Arduino.prototype.pinMean = function(pinName) {
    var recentVals = this.values[pinName].slice(-DEBOUNCE_POINTS);
        n = recentVals.length,
        sum = 0;

    for (var i = 0; i < n; i++) {
        sum += recentVals[i];
    }
    return sum / n;
};

Arduino.prototype.setPin = function(pinName, value) {
    this.values[pinName].push(value);
    if (this.values[pinName].length > DEBOUNCE_POINTS) {
        this.values[pinName] = this.values[pinName].slice(-DEBOUNCE_POINTS);
    }
}

Arduino.prototype.sendDataToPin = function(pinName) {
    var self = this;
    return function(value) {
        value = Math.floor(value / 10.24);
        var mean = self.pinMean(pinName);
        var shouldSend = Math.abs(mean - value) > DEBOUNCE_TOLERANCE;
        
        if (self.socket && shouldSend) {
            self.socket.emit(pinName, {
                'data': value
            });
            self.values[pinName].push(value);
            self.values[pinName]
        }
    };
};

Arduino.prototype.setSocket = function(socket) {
    this.socket = socket;
};

var _arduinos = [];

module.exports.init = function(configs) {

    configs.map(function(config) {
        console.log(config);
        _arduinos.push(new Arduino(config));
    });

};

module.exports.setSocket = function(socket) {
    var n = _arduinos.length;

    for (var i = 0; i < n; i++) {
        _arduinos[i].setSocket(socket);
    }
};
