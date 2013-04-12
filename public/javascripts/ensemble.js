var ensemble = function() {
    //Constants
    var LOOK_AHEAD = 16.0, // ms
        SCHEDULE_AHEAD = 0.32, // s;
        TEMPO = 100,
        AUTO_ADVANCE_TIMEOUT = 30000, // ms
        TARGET_PHRASE_DURATION = 23, // s
        ADVANCE_PROBABILITY = [0.10, 0.10, 0.10, 0.15, 0.45, 0.75, 1];

    var score,
        players = [],
        pulse,
        mixer;

    var _getFurthestPhraseAhead = function() {
        var n = players.length,
            furthest = 0;
        for (var i = 0; i < n; i++) {
            furthest = Math.max(furthest, players[i].phrase);
        }
        return furthest;
    };
    var _getFurthestPhraseBehind= function() {
         var n = players.length,
            furthest = 53;
        for (var i = 0; i < n; i++) {
            furthest = Math.min(furthest, players[i].phrase);
        }
        return furthest;
    };

    //main processing loop
    var _scheduler = function() {
        var now = context.currentTime,
            n = players.length,
            continuePerforming = false;

        while (pulse && (pulse.scheduledUntil - now) < SCHEDULE_AHEAD) {
            pulse.play(now);
            ui.updateTimer(now);
        }

        for (var i = 0; i < n; i++) {
            var player = players[i];
            while ((player.scheduledUntil - now) < SCHEDULE_AHEAD && !player.stopped) {
                player.play(now);
            }
            continuePerforming = continuePerforming || !player.stopped;
        }

        if(continuePerforming){
            setTimeout(_scheduler, LOOK_AHEAD);
        } else {
            //end piece
            setTimeout(function() {
                window.location.href ='/';
            }, 15000);
        }
    };

    var Player = function(voice, voiceSettings, style, output, selector) {
        this.voice = timbre.createInstrument(voice, mixer.inputs[output]);
        this.display = trace.createVisualization(style, selector);
        this.output = output;
        this.scheduledUntil = 0;
        this.advanceable = false;
        this.voiceSettings = voiceSettings;
        this.phrase = 0;
        this.selector = selector;
        this.phrasePlayed = 0;
        this.noteQueue = [];
        this.lastInteraction = null;
        this.mode = "robot";
        this.stopped = false;
    };

    Player.prototype.nextNote = function() {
        // If the note queue is empty, fill it back up from the current phrase
        if (this.noteQueue.length === 0) {
            // Potentially auto-advance
            if (this.shouldAutoAdvance()) {
                this.advance(true);
            }

            this.noteQueue = score[this.phrase].slice(0);

            // Track how many times the player has played this phrase
            this.phrasePlayed++;

            // Allow the instrument to be advanced again once its current
            // phrase has been scheduled at least once
            this.advanceable = true;
            if(this.phrase !==53){
                ui.enableInput(this.selector);
            }
        }
        return this.noteQueue.shift();
    };

    Player.prototype.shouldAutoAdvance = function() {
        var probability,
            phraseDuration,
            lag,
            result = false;

        // Never auto-advance if there has been a recent user interaction on this player
        if ((new Date() - this.lastInteraction) < AUTO_ADVANCE_TIMEOUT) {
            if (this.mode === "robot" ) {
                this.changeMode("human");
            }
        } else {
            if (this.mode === "human") {
                this.changeMode("robot");
            }
            lag = _getFurthestPhraseAhead() - this.phrase;
            phraseDuration = score[this.phrase][0].phraseDuration * 60 / TEMPO;
            if (lag < ADVANCE_PROBABILITY.length) {
                probability = ADVANCE_PROBABILITY[lag];
            } else {
                probability = 1;
            }
            probability *= this.phrasePlayed * phraseDuration / TARGET_PHRASE_DURATION;

            result = Math.random() < probability;
        }
        return result;
    };

    Player.prototype.changeMode = function(mode) {
        this.mode = mode;
        ui.updatePlayerType(this);
    };

    Player.prototype.play = function(now) {
        var note = this.nextNote();
        if (note === undefined) {
            return;
        }
        var noteLength = note.duration * (60.0 / TEMPO);
        if (!note.rest) {
            this.voice.noteOn(this.scheduledUntil, note.frequency, this.voiceSettings);
            this.voice.noteOff(this.scheduledUntil + noteLength, note.frequency);
            if (this.display) {
                this.display.schedule(note, this.scheduledUntil, noteLength);
            }
        }
        this.scheduledUntil += noteLength;
    };

    Player.prototype.updateSettings = function(set, value) {
        this.voiceSettings[set[1]][set[2]] = value;
        this.lastInteraction = new Date();
    };

    Player.prototype.advance = function(auto) {
        var _auto = auto || false;

        if(this.phrase === 53){
            this.advanceable = false;
            if(_getFurthestPhraseBehind() === 53 && this.phrasePlayed > (Math.random() * 100)){
                ui.dropoutInstrument(this.selector);
                this.stopped = true;
            }
        } else if(this.advanceable){
                this.phrase++;
                this.advanceable = false;
                this.phrasePlayed = 0;
                ui.updatePosition(this.selector, this.phrase);
                ui.disableInput(this.selector);
        }

        if (!_auto) {
            // robot is in charge
            this.lastInteraction = new Date();
        }
    };

    Player.prototype.setVolume = function(volume) {
        mixer.setGain(this.output, volume);
        this.lastInteraction = new Date();
    };

    var Pulse = function(voice, output, selector, high, low) {
        this.high = high;
        this.low = low;
        this.display = null;
        Player.call(this, voice, null, null, output, selector);
    };

    Pulse.prototype = Object.create(Player.prototype, {
        play: {
            value: function(now) {
                var noteLength = this.high.duration * (60.0 / TEMPO);
                this.voice.noteOn(this.scheduledUntil, this.high.frequency);
                this.voice.noteOn(this.scheduledUntil, this.low.frequency);
                this.voice.noteOff(this.scheduledUntil + noteLength, this.high.frequency);
                this.voice.noteOff(this.scheduledUntil + noteLength, this.low.frequency);
                this.scheduledUntil += noteLength;
            },
            enumerable: true,
            configurable: true,
            writable: true
        }
    });

    var begin = function() {
        // Initialize Ensemble Audio Output
        context = new webkitAudioContext();

        mixer = new timbre.Mixer(4);
        mixer.setGain(0, 30);
        mixer.setGain(1, instrumentSettings.square.volume);
        mixer.setGain(2, instrumentSettings.sine.volume);
        mixer.setGain(3, instrumentSettings.triangle.volume);

        // for panning 
        context.listener.setPosition(0, 0, 0);
        var compressor = context.createDynamicsCompressor();
        mixer.output(compressor);
        compressor.connect(context.destination);

        // Initialize Pulse
        pulse = new Pulse(timbre.presets.pluck, 0, '.pulse', MSON.parseNote("C6q"), MSON.parseNote("C5q"));
        score = MSON.parse(phrases);
        players.push(new Player(timbre.presets.synth, instrumentSettings.square, 'square', 1, '.square'));
        players.push(new Player(timbre.presets.synth, instrumentSettings.triangle, 'circle', 2, '.triangle'));
        players.push(new Player(timbre.presets.synth, instrumentSettings.sine, 'sine', 3, '.sine'));
        trace.begin(context);
        _scheduler();
     };

    return {
        begin: begin,
        players: players
    };
}();
