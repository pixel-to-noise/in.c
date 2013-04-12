(function() {
    // constants
    var SAMPLE_RATE = 44100;
    var LOG2 = Math.log(2);
    var STEP_RATIO = Math.log(Math.pow(2, 1 / 12));
    var NOTES_12 = {
        'C': 0,
        'B#': 0,

        'Db': 1,
        'C#': 1,
        
        'D': 2,

        'Eb': 3,
        'D#': 3,
        
        'E': 4,
        'Fb': 4,

        'F': 5,

        'F#': 6,
        'Gb': 6,

        'G': 7,

        'Ab': 8,
        'G#': 8,
        
        'A': 9,

        'Bb': 10,
        'A#': 10,
        
        'B': 11,
        'Cb': 11
    };

    var TEMPERAMENTS = {
        'pythagorian': [1, 256 / 243, 9 / 8, 32 / 27, 81 / 64, 4 / 3, 1024 / 729, 3 / 2, 128 / 81, 27 / 16, 16 / 9, 243 / 128, 2],
        'just': [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 7 / 5, 3 / 2, 8 / 5, 5 / 3, 7 / 4, 15 / 8, 2],
        'equal': [1, 1.05946, 1.12246, 1.18921, 1.25992, 1.33483, 1.41421, 1.49831, 1.58740, 1.68179, 1.78180, 1.88775, 2],
        'meantone': [1, 1.0700, 1.1180, 1.1963, 1.2500, 1.3375, 1.4311, 1.4953, 1.6000, 1.6719, 1.7889, 1.8692, 2]
    };

    var INTERVALS = ['U', 'm2', 'M2', 'm3', 'M3', 'P4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'O'];

    //private methods
    var mergeObjects = function(object1, object2) {
        for(var p in object2) {
            try {
                if(object2[p].constructor == Object) {
                    object1[p] = mergeObjects(object1[p], object2[p]);
                } else {
                    object1[p] = object2[p];
                }
            } catch(e) {
                object1[p] = overrides[p];
            }
        }
        return object1;
    };

    var _getCentOffset = function(freq1, freq2) {
        return Math.round(1200 * Math.log(freq1 / freq2) / LOG2);
    };

    var _getOctaveFromFrequency = function(freq) {
        return Math.floor(Math.log(freq / this.rootFrequency()) / LOG2);
    };

    var _getNoteLetterFromFrequency = function(freq) {
        var noteNumber = Math.round(Math.log(freq / this.referenceFrequency()) / STEP_RATIO);
        for(var key in NOTES_12) {
            if(NOTES_12[key] === noteNumber%12) {
                if(noteNumber === 12){
                    this.temper.octave+=1;
                }
                return key;
            }
        }
    };

    var _getFrequencyFromNoteLetter = function(letter) {
        var ratio;
        for(var key in NOTES_12) {
            if(key === letter) {
                ratio = TEMPERAMENTS[this.settings.temperament][NOTES_12[key]];
            }
        }
        // TODO: Don't use toFixed
        return(ratio * this.referenceFrequency()).toFixed(this.settings.precision);
    };

    var _temperFromFreq = function(freq) {
        this.temper.freq = freq.toFixed(this.settings.precision);
        this.temper.octave = _getOctaveFromFrequency.call(this, freq);
        this.temper.noteLetter = _getNoteLetterFromFrequency.call(this, freq);
    };

    var _temperFromNote = function(note) {
       var parsed = /([A-GR])([b#]?)(\d+)/.exec(note);

        var letter = parsed[1],
            accidental = parsed[2],
            octave = parseInt(parsed[3], 10);

        if(accidental !== "") {
            letter += accidental[0];
        }
        this.temper.noteLetter = letter;
        this.temper.octave = octave;
        this.temper.freq = _getFrequencyFromNoteLetter.call(this, letter);
    };

// public
    var Temper = function(val, overrides) {
        var defaultSettings = {
            tuningFrequency: 440,
            temperament: 'pythagorian',
            precision: 2
        },
            _overrides = overrides || {},
            settings = mergeObjects(_overrides, defaultSettings);

        if(this === window) {
            return new Temper(val, settings);
        }
        this.temper = {};
        this.settings = overrides;

        this.rootFrequency = function() {
            return this.settings.tuningFrequency / Math.pow(2, 4) / TEMPERAMENTS[this.settings.temperament][9];
        };

        this.referenceFrequency = function() {
            return this.rootFrequency() * Math.pow(2, this.temper.octave);
        };

        if(val) {
            if(typeof val === 'string') {

                _temperFromNote.call(this, val);
            }

            if(typeof val === 'number') {
                _temperFromFreq.call(this, val);
            }
        }
           
        return this;
    
    };

    Temper.prototype.freq = function(freq) {
        if(freq) {
            _temperFromFreq.call(this, freq);
            return this;
        } else {
            return this.temper.freq;
        }
    };

    Temper.prototype.noteName = function(note) {
        if(note) {
            _temperFromNote.call(this, note);
            return this;
        } else {
            return this.temper.noteLetter + this.temper.octave.toString();
        }
    };

    Temper.prototype.offset = function(freq) {
        var _freq = freq || this.settings.tuningFrequency;
        var offset = _getCentOffset.call(this, this.temper.freq, _freq);
        return offset;
    };

    Temper.prototype.temperament = function(temperament){
        if(temperament){
            this.settings.temperament = temperament;
            var note = this.temper.noteLetter + this.temper.octave.toString();
             _temperFromNote.call(this, note);
             return this;
        } else {
            return TEMPERAMENTS[this.settings.temperament];
        }

    };

    Temper.prototype.interval = function(interval) {

    };

    Temper.prototype.octave = function(octave) {
        if(octave) {
            this.temper.octave = octave;
             _temperFromNote.call(this, this.temper.noteLetter + octave.toString());
            return this;

        } else {
            return this.temper.octave;
        }
    };

    // //set up for global (node) or window (browser)
    var root = this;

    if(typeof exports !== 'undefined') {
        exports.Temper = Temper;
    } else {
        root['Temper'] = Temper;
    }
}).call(this);
