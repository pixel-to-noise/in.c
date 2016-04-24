var context;



var phrases = [
    ["R0q","R0q","R0q","R0q"],
    ["C4g", "E4c", "C4g", "E4c", "C4g", "E4c"],
    ["C4g", "E4q", "F4q", "E4c"],
    ["R0q", "E4q", "F4q", "E4q"],
    ["R0q", "E4q", "F4q", "G4q"],
    ["E4q", "F4q", "G4q", "R0q"],
    // Phrases 6 - 10
    ["C5b"],
    ["R0c", "R0c", "R0c", "R0q", "C4s", "C4s", "C4q", "R0q", "R0c", "R0c", "R0c", "R0c"],
    ["G4S.", "F4b"],
    ["B4s", "G4s", "R0q", "R0c", "R0c", "R0c"],
    ["B4s", "G4s"],
    // Phrases 11 - 15
    ["F4s", "G4s", "B4s", "G4s", "B4s", "G4s"],
    ["F4q", "G4q", "B4m", "C5q"],
    ["B4s", "G4q.", "G4s", "F4s", "G4q", "R0q.", "G4s-", "G4m."], // tie not implemented yet
    ["C5S", "B4S", "G4S", "F#4S"],
    ["G4s", "R0q.", "R0c", "R0c", "R0c"],
    // Phrases 16 - 20
    ["G4s", "B4s", "C5s", "B4s"],
    ["B4s", "C5s", "B4s", "C5s", "B4s", "R0s"],
    ["E4s", "F#4s", "E4s", "F#4s", "E4q.", "E4s"],
    ["R0c.", "G5c."],
    ["E4s", "F#4s", "E4s", "F#4s", "G3q.", "E4s", "F#4s", "E4s", "F#4s", "E4s"],
    // Phrases 21 - 25
    ["F#4m."],
    ["E4c.", "E4c.", "E4c.", "E4c.", "E4c.", "F4c.", "G4c.", "A4c.", "B4q"],
    ["E4q", "F#4c.", "F#4c.", "F#4c.", "F#4c.", "F#4c.", "G4c.", "A4c.", "B4c"],
    ["E4q", "F#4q", "G4c.", "G4c.", "G4c.", "G4c.", "G4c.", "A4c.", "B4q"],
    ["E4q", "F#4q", "G4q", "A4c.", "A4c.", "A4c.", "A4c.", "A4c.", "B4c."],
    // Phrases 26 - 30
    ["E4q", "F#4q", "G4q", "A4q", "B4c.", "B4c.", "B4c.", "B4c.", "B4c."],
    ["E4s", "F#4s", "E4s", "F#4s", "G4q", "E4s", "G4s", "F#4s", "E4s", "F#4s", "E4s"],
    ["E4s", "F#4s", "E4s", "F#4s", "E4q.", "E4s"],
    ["E4m.", "G4m.", "C5m."],
    ["C5S."],
    // Phrases 31 - 35
    ["G4s", "F4s", "G4s", "B4s", "G4s", "B4s"],
    ["F4s", "G4s", "F4s", "G4s", "B4s", "F4s", "F4m.", "G4c."],
    ["G4s", "F4s", "R0q"],
    ["G4s", "F4s"],
    ["F4s", "G4s", "B4s", "G4s", "B4s", "G4s", "B4s", "G4s", "B4s", "G4s", "R0q", "R0c", "R0c", "R0c", "Bb4c", "G5m.", "A5q", "G5c", "B5q", "A5c.", "G5q", "E5m.", "G5q", "F#5q", "F#5m.", "R0c", "R0c", "R0q", "E5q", "E5m", "F5S."],
    // Phrases 36 - 40
    ["F4s", "G4s", "B4s", "G4s", "B4s", "G4s"],
    ["F4s", "G4s"],
    ["F4s", "G4s", "B4s"],
    ["B4s", "G4s", "F4s", "G4s", "B4s", "C5s"],
    ["B4s", "F4s"],
    // Phrases 41 - 45
    ["B4s", "G4s"],
    ["C5S", "B4S", "A4S", "B4S"],
    ["F5s", "E5s", "F5s", "E5s", "E5q", "E5q", "E5q", "F5s", "E5s"],
    ["F5q", "E5c", "E5q", "C5c"],
    ["D5c", "D5c", "G4c"],
    // Phrases 46 - 50
    ["G4s", "D5s", "E5s", "D5s", "R0q", "G4q", "R0q", "G4q", "R0q", "G4q", "G4s", "D5s", "E5s", "D5s"],
    ["D5s", "E5s", "E5q"],
    ["G4S.", "G4S", "F4m."],
    ["F4s", "G4s", "Bb4s", "G4s", "Bb4s", "G4s"],
    ["F4s", "G4s"],
    // Phrases 51 - 52
    ["F4s", "G4s", "Bb4s"],
    ["G4s", "Bb4s"],
    ["Bb4s", "G4s"]
];

var instrumentSettings = {
    'square': {
        'volume': 80,
        'oscil1': {
            'waveform': 'square',
            'octave': 16,
            'detune': 0,
            'vibratoAmount': 10,
            'vibratoSpeed': 2.2,
            'gain': 90
        },
        'oscil2': {
            'waveform': 'square',
            'octave': 16,
            'detune': 10,
            'vibratoAmount': 15,
            'vibratoSpeed': 2.2,
            'gain': 30
        },
        'envelope': {
            'a': 2,
            'd': 10,
            's': 40,
            'r': 20,
            'gain': 50
        },
        'filterEnvelope': {
            'a': 2,
            'd': 10,
            's': 30,
            'r': 10,
            'gain': 80
        },
        'lowpass': {
            'cutoff': 50,
            'q': 1
        },
        'delay': {
            'speed': 90,
            'wet': 30
        },
        'panner': {
            'x': -2,
            'y': 0
        }
    },

    'sine': {
        'volume': 72,
        'oscil1': {
            'waveform': 'sine',
            'octave': 4,
            'detune': 0,
            'vibratoAmount': 10,
            'vibratoSpeed': 2.2,
            'gain': 90
        },
        'oscil2': {
            'waveform': 'sine',
            'octave': 8,
            'detune': 20,
            'vibratoAmount': 10,
            'vibratoSpeed': 2.2,
            'gain': 50
        },
        'envelope': {
            'a': 2,
            'd': 10,
            's': 50,
            'r': 50,
            'gain': 90
        },
        'filterEnvelope': {
            'a': 10,
            'd': 20,
            's': 30,
            'r': 10,
            'gain': 80
        },
        'lowpass': {
            'cutoff': 70,
            'q': 3
        },
        'delay': {
            'speed': 90,
            'wet': 50
        },
        'panner': {
            'x': 2,
            'y': 0
        }
    },

    'triangle': {
        'volume': 65,
        'oscil1': {
            'waveform': 'triangle',
            'octave': 2,
            'detune': 0,
            'vibratoAmount': 0,
            'vibratoSpeed': 2.2,
            'gain': 90
        },
        'oscil2': {
            'waveform': 'triangle',
            'octave': 4,
            'detune': 0,
            'vibratoAmount': 0,
            'vibratoSpeed': 2.2,
            'gain': 50
        },
        'envelope': {
            'a': 2,
            'd': 10,
            's': 50,
            'r': 20,
            'gain': 90
        },
        'filterEnvelope': {
            'a': 0,
            'd': 20,
            's': 80,
            'r': 10,
            'gain': 80
        },
        'lowpass': {
            'cutoff': 100,
            'q': 5
        },
        'delay': {
            'speed': 90,
            'wet': 30
        },
        'panner': {
            'x': 0,
            'y': -2
        }
    }
};

var $square,
    $sine,
    $triangle;

$(function() {
    $square = $('.square.col');
    $sine = $('.sine.col');
    $triangle = $('.triangle.col');

    ui.initializeUI();
});
