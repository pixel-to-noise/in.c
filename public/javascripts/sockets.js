var sockets = function(){
    var socket = io.connect('http://localhost'),
        debouceRate = 15;

    var initializeSocket = function(){
        var _initSockets = function(name, $el){
            var button = name + '-b',
                a1 = name + '-1',
                a2 = name + '-2',
                a3 = name + '-3',
                a4 = name + '-4';

            socket.on(button, function(data) {
                if(ensemble.players.length > 0){
                    ensemble.players[$el.data('index')].advance(false);
                } else {
                    $('.start-dialog').trigger('click');
                }
            });

            socket.on(a1, _.debounce(function(data) {
                ui.updateVolume($el.find('.vol-click'), data.data * 2, false);
            }, debouceRate));

            socket.on(a2, _.debounce(function(data) {
                $el.find('.cutoff').dial('update', data.data);
            }, debouceRate));

            socket.on(a3, _.debounce(function(data) {
                $el.find('.q').dial('update', data.data);
            }, debouceRate));

            socket.on(a4, _.debounce(function(data) {
                $el.find('.vibrato').dial('update', data.data);
            }, debouceRate));
        };

        _initSockets('ard1', $('.square'));
        _initSockets('ard2', $('.triangle'));
        _initSockets('ard3', $('.sine'));
    };

    return {
        initializeSocket: initializeSocket
    };

}();