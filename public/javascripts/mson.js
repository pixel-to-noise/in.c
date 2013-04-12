var MSON = function() {
    var MSON_PATTERN = /([A-GR][b#]?\d+)([gbSmcqsd])([.-^]+)?/;
    var DURATIONS_4_4 = {
        'b': 8,
        'S': 4,
        'm': 2,
        'c': 1,
        'q': 0.5,
        's': 0.25,
        'd': 0.125,
        'h': 0.0625,
        'g': 0.125
    };

    var _getBeats = function(letter, modifier) {
        var beats = DURATIONS_4_4[letter];
        if(modifier && modifier.indexOf(".") >= 0) {
            return beats * 1.5;
        } else {
            return beats;
        }
    };

    var _hasTie = function(modifier) {
        return modifier && modifier.indexOf("-") >= 0;
    };

    var parseMsonNote = function(note) {
        var match = MSON_PATTERN.exec(note);
        if(match) {
            var parsed = {
                "frequency": Temper(match[1]).freq(),
                "duration": _getBeats(match[2], match[3]),
                "tied": _hasTie(match[3])
            };
            if(match[1].indexOf("R") === 0) {
                parsed.rest = true;
            }
            if(match[2] == "g") {
                parsed.graceNote = true;
            }
            return parsed;
        } else {
            console.log("No soup for you:" + note);
        }
    };

    var _parseMsonPhrase = function(phrase) {
        var _phrase = [],
            n = phrase.length,
            lastNote = null,
            note = null,
            phraseDuration = 0.0,
            highestFreq = Number.MIN_VALUE,
            lowestFreq = Number.MAX_VALUE;
        // Parse all the notes
        for(var i = 0; i < n; i++) {
            note = parseMsonNote(phrase[i]);
            if(lastNote && lastNote.graceNote) {
                note.duration -= lastNote.duration;
            }
            phraseDuration += note.duration;
            if (! note.rest) {
                lowestFreq = Math.min(lowestFreq, note.frequency);
                highestFreq = Math.max(highestFreq, note.frequency);
            }
            _phrase.push(note);
            lastNote = note;
        }

        // Loop over the notes and annotate them with the bounds of the phrase
        for (i = 0; i < n; i++) {
            _phrase[i].phraseDuration = phraseDuration;
            _phrase[i].lowestFreq = lowestFreq;
            _phrase[i].highestFreq = highestFreq;
        }

        return _phrase;
    };

    var parseMson = function(score) {
        var _score = [],
            n = score.length;
        for(var i = 0; i < n; i++) {
            _score.push(_parseMsonPhrase(score[i]));
        }
        return _score;
    };

    return {
        parse: parseMson,
        parseNote: parseMsonNote
    };

}();
