var ui = function() {
    var initializeUI = function() {
        var _initDial = function($el, settings) {
            var set = settings.split('.');
            $el.dial({
                'updateCallback': function($self, val) {
                    var instIndex = $self.parents('.col').data('index'),
                        paramsPath = set;

                    if(ensemble.players.length > 0){
                        ensemble.players[instIndex].updateSettings(paramsPath, val/2);
                    }
                },
                initalValue: instrumentSettings[set[0]][set[1]][set[2]]
            });
        };

        // Knob Initialize
        _initDial($square.find('.q'), 'square.lowpass.q');
        _initDial($sine.find('.q'), 'sine.lowpass.q');
        _initDial($triangle.find('.q'), 'triangle.lowpass.q');

        _initDial($square.find('.cutoff'), 'square.lowpass.cutoff');
        _initDial($sine.find('.cutoff'), 'sine.lowpass.cutoff');
        _initDial($triangle.find('.cutoff'), 'triangle.lowpass.cutoff');

        _initDial($square.find('.vibrato'), 'square.oscil1.vibratoAmount');
        _initDial($sine.find('.vibrato'), 'sine.oscil1.vibratoAmount');
        _initDial($triangle.find('.vibrato'), 'triangle.oscil1.vibratoAmount');

        // Volume Setup
        $('.vol-click').mousedown(function(e) {
            var $self = $(this),
                mousedownX = e.offsetX;

            $self.bind('mousemove', function(e) {
                ui.updateVolume($self, e.offsetX, false);
            });

            $(window).bind('mouseup', function() {
                $self.unbind('mousemove');
                $(this).unbind('mouseup');
            });
            $self.mouseup(function(e) {
                if (mousedownX == e.offsetX) {
                    ui.updateVolume($self, e.offsetX, true);
                }
                $(this).unbind('mouseup');
            });
        });

        // Volume Initialize
        ui.updateVolume($square.find('.vol-click'), instrumentSettings.square.volume * 2, false);
        ui.updateVolume($sine.find('.vol-click'), instrumentSettings.sine.volume * 2, false);
        ui.updateVolume($triangle.find('.vol-click'), instrumentSettings.triangle.volume * 2, false);

        // Position Setup
        $('.position').click(function() {
            if(ensemble.players.length > 0){
                ensemble.players[$(this).parents('.col').data('index')].advance(false);
            }
        });

        $('.start-dialog').one('click', function(e) {
             $(this).fadeOut(500, function(){
                ensemble.begin();
            });
        });
    };

    var updateVolume = function($el, val, animate) {
        if($el instanceof jQuery !== true){
            $el = $($el).find('.vol-click');
        }

        var vol = val / 2,
            $vol = $el;

        if (animate) {
            $vol.siblings('.vol-slider').animate({
                'margin-left': val - 100,
                'width': 200 - val
            }, 'fast');
        } else {
            $vol.siblings('.vol-slider').css({
                'margin-left': val - 100,
                'width': 200 - val
            });
        }
        if(ensemble.players.length > 0){
            ensemble.players[$vol.parents('.col').data('index')].setVolume(vol);
        }
        $vol.siblings('.vol-value').html(Math.round(vol));
    };

    var updateTimer = function(now) {
        var minutes = Math.floor(now / 60),
            seconds = Math.floor(now - minutes * 60),
            // millis = Math.floor((now - seconds) * 100 - minutes * 6000),
            pad = function(num) {
                num = num.toString();
                if (num.length < 2) {
                    num = '0' + num;
                }
                return num;
            };
        $('.timer').html(pad(minutes) + ':' + pad(seconds)); //+ ':' + pad(millis)); 
    };

    var updatePosition = function(selector, value) {
        $(selector + ' .position div').html('')
            .css('margin-top', -100)
            .html(value)
            .animate({
            'margin-top': 0
        }, 200);
    };

    var updatePlayerType = function(player) {
        var $player = $('.info-cards ' + player.selector);
        $player.find('.player-type i').removeClass('selected');
        $player.find('.'+player.mode).addClass('selected');

        if(player.mode === 'human'){
            $player.find('.phrase').html('Cool it, Robot').animate({'opacity': 1}, 1000, function(){
                $(this).animate({'opacity': 0}, 8000);
            });
        }
    };

    var dropoutInstrument = function(selector) {
        updateVolume(selector, 0, true);
        updatePosition(selector, 'fin');
        $(selector).addClass('end');
    };

    var disableInput = function(selector){
        $('.info-cards ' +selector).animate({opacity: 0.5}, 500);
    };

    var enableInput = function(selector){
        $('.info-cards ' +selector).animate({opacity: 1}, 500);
    };

    return {
        initializeUI: initializeUI,
        updateVolume: updateVolume,
        updateTimer: updateTimer,
        updatePosition: updatePosition,
        updatePlayerType: updatePlayerType,
        dropoutInstrument: dropoutInstrument,
        disableInput: disableInput,
        enableInput: enableInput
    };

}();
