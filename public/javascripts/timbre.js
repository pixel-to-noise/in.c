var timbre = function() {

    //private
    var _filterFrequencyFromCutoff = function(freq, cutoff) {

        var nyquist = 0.5 * context.sampleRate;
        var filteredFrequency = Math.pow(2, (9 * cutoff) - 1) * freq;
        if(filteredFrequency > nyquist) {
            filteredFrequency = nyquist;
        }
        return filteredFrequency;
    };

    var _ksBuffer = function(freq, amp) {
        var prevIndex = 0,
            buffer = [],
            arrayBuffer = new Float32Array(context.sampleRate),
            period = Math.floor(context.sampleRate / freq);

        var generateSample = function() {
            var index = buffer.shift();
            var sample = (index + prevIndex) / 2;
            prevIndex = sample;
            buffer.push(sample);
            return sample;
        };

        // generate noise
        for(var i = 0; i < period; i++) {
            var rand = Math.random();
            buffer[i] = ((rand > 0.5) ? 1 : -1) * rand;
        }

        for(var j = 0; j < context.sampleRate; j++) {
            arrayBuffer[j] = generateSample();
            var decay = amp - (j / context.sampleRate) * amp;
            arrayBuffer[j] = arrayBuffer[j] * decay;
        }
        return arrayBuffer;
    };

    // public
    var presets = {
        'pluck': function(output) {
            var pluck = new Pluck();
            pluck.output(output);

            this.noteOn = function(time, freq) {
                pluck.start(time, freq);
            };
            this.noteOff = function(time, freq) {
                pluck.stop(time + 0.5);
            };

        },

        'synth': function(output, settings) {
            var vco1 = new VCO(settings.oscil1.waveform, settings.oscil1.octave, settings.oscil1.detune, settings.oscil1.vibratoAmount, settings.oscil1.vibratoSpeed),
                vco2 = new VCO(settings.oscil2.waveform, settings.oscil2.octave, settings.oscil2.detune, settings.oscil2.vibratoAmount, settings.oscil2.vibratoSpeed),
                vcoMixer = new Mixer(2),
                adsr = new ADSR(settings.envelope.a, settings.envelope.d, settings.envelope.s, settings.envelope.r, settings.envelope.gain),
                filterAdsr = new ADSR(settings.filterEnvelope.a, settings.filterEnvelope.d, settings.filterEnvelope.s, settings.filterEnvelope.r, settings.filterEnvelope.gain),
                lowpass1 = new Lowpass(settings.lowpass.q, settings.lowpass.cutoff, filterAdsr),
                lowpass2 = new Lowpass(settings.lowpass.q, settings.lowpass.cutoff, filterAdsr),
                panner = new Panner(settings.panner.x, settings.panner.y);
                //delay = new Delay(settings.delay.wet, settings.delay.speed);

            vco1.output(vcoMixer.inputs[0]);
            vco2.output(vcoMixer.inputs[1]);
            vcoMixer.setGain(0, settings.oscil1.gain);
            vcoMixer.setGain(1, settings.oscil2.gain);
            vcoMixer.output(lowpass1.input);
            lowpass1.output(lowpass2.input);
            lowpass2.output(adsr.input);

            //delay.source(adsr);
            //delay.output(output);
            adsr.output(panner.input);
            panner.output(output);

            this.noteOn = function(time, freq) {
                vco1.start(time, freq);
                vco2.start(time, freq);
                lowpass1.start(time, freq);
                lowpass2.start(time, freq);
                adsr.start(time);
            };
            this.noteOff = function(time, freq) {
                adsr.stop(time);
                lowpass1.stop(time, freq);
                lowpass2.stop(time, freq);
                vco1.stop(time + 0.5);
                vco2.stop(time + 0.5);
            };
            this.setQ = function(q){
                lowpass1.setQ(q);
                lowpass2.setQ(q);

            };
        }
    };

    var createInstrument = function(instrument, output) {
        var polyphony = [];

        var noteOn = function(time, freq, settings) {
            polyphony[freq] = new instrument(output, settings);
            polyphony[freq].noteOn(time, freq);
        };

        var noteOff = function(time, freq) {
            polyphony[freq].noteOff(time, freq);
            polyphony[freq] = null;
        };

        return {
            noteOn: noteOn,
            noteOff: noteOff
        };
    };

    // Voltage Controller Oscillator
    var VCO = function(type, octave, detune, tremoloAmount, tremoloSpeed) {
        this.osc = context.createOscillator();
        this.osc.type = this.osc[type];
        this.osc.detune.value = detune || 0;
        this.octave = octave / 8;
        this.tremolo = new LFO(tremoloAmount, tremoloSpeed);

    };

    VCO.prototype.start = function(time, freq) {
        this.osc.frequency.value = freq / this.octave;
        this.tremolo.out.connect(this.osc.frequency);
        this.osc.start(time);
        this.tremolo.start(time);
    };

    VCO.prototype.stop = function(time) {
        this.osc.stop(time);
        this.tremolo.stop(time);
    };

    VCO.prototype.output = function(node) {
        this.osc.connect(node);
    };
    VCO.prototype.setDetune = function(detune){
        this.detune = detune;
    };

    // Mixer
    var Mixer = function(channels) {
        this.channels = channels;
        this.inputs = [];
        for(var i = 0; i < this.channels; i++) {
            this.inputs.push(context.createGain());
        }
    };

    Mixer.prototype.setGain = function(channel, gain) {
        this.inputs[channel].gain.value = (gain * 0.01) / this.channels;
    };

    Mixer.prototype.output = function(node) {
        this.out = context.createGain();
        this.out.gain.value = 1;
        for(var j = 0; j < this.channels; j++) {
            this.inputs[j].connect(this.out);
        }
        this.out.connect(node);
    };

    var Panner = function(x, y){
        this.panner = context.createPanner();
        this.panner.setPosition(x, y, 0);
        this.input = this.panner;

    };

    Panner.prototype.output = function(node){
        this.panner.connect(node);
    };

    // Low Frequency Oscillator
    var LFO = function(gain, speed) {
        this.lfo = context.createOscillator();
        this.lfo.type = this.lfo.SINE;
        this.lfo.frequency.value = speed;

        this.out = context.createGain();
        this.lfo.connect(this.out);
        this.out.gain.value = gain * 0.1;
    };

    LFO.prototype.start = function(time) {
        this.lfo.start(time);
    };

    LFO.prototype.stop = function(time) {
        this.lfo.stop(time);
    };

    //Pluck
    var Pluck = function() {
        this.pluck = context.createBufferSource();
    };

    Pluck.prototype.start = function(time, freq) {
        var amp = (Math.random() * 0.5) + 0.4,
            arrayBuffer  = _ksBuffer(freq, amp);

        audioBuffer = context.createBuffer(1, arrayBuffer.length, context.sampleRate);
        audioBuffer.getChannelData(0).set(arrayBuffer);

        this.pluck.buffer = audioBuffer;
        this.pluck.start(time);
    };

    Pluck.prototype.stop = function(time) {
        this.pluck.stop(time);
    };

    Pluck.prototype.output = function(node) {
        this.pluck.connect(node);
    };

    // envelopee
    var ADSR = function(attack, delay, sustain, release, gain) {
        this.envelope = context.createGain();
        this.gain = gain * 0.01;
        this.a = attack * 0.01;
        this.d = delay * 0.01;
        this.s = sustain * 0.01;
        this.r = release * 0.01;
        this.input = this.envelope;
    };

    ADSR.prototype.start = function(time) {
        var attackEnd = time + this.a;
        this.envelope.gain.setValueAtTime(0, time);
        this.envelope.gain.linearRampToValueAtTime(this.gain, attackEnd);
        this.envelope.gain.setTargetAtTime(this.s, attackEnd, this.d);
    };

    ADSR.prototype.stop = function(time) {
        this.envelope.gain.cancelScheduledValues(time);
        this.envelope.gain.setTargetAtTime(0, time, this.r);
    };

    ADSR.prototype.output = function(node) {
        this.envelope.connect(node);
    };

    // Lowpass Biquad Filter
    var Lowpass = function(Q, cutoff, envelope) {
        this.filter = context.createBiquadFilter();
        this.filter.type = this.filter.LOWPASS;
        this.filter.Q.value = Q * 0.1;
        this.cutoff = cutoff * 0.01;
        this.envelope = envelope;
        this.input = this.filter;
    };

    Lowpass.prototype.start = function(time, freq) {
        var init = _filterFrequencyFromCutoff(freq, this.cutoff),
            attack = _filterFrequencyFromCutoff(freq, this.cutoff + this.envelope.gain),
            sustain = _filterFrequencyFromCutoff(freq, this.cutoff + (this.envelope.gain * this.envelope.s) + 0.001);

        var attackEnd = time + this.envelope.a;

        this.filter.frequency.value = init;
        this.filter.frequency.linearRampToValueAtTime(attack, attack);
        this.filter.frequency.setValueAtTime(sustain, attackEnd, this.envelope.d);
    };

    Lowpass.prototype.stop = function(time, freq) {
        var initFilter = _filterFrequencyFromCutoff(freq, this.cutoff * (1.0 - this.envelope.gain));
        this.filter.frequency.cancelScheduledValues(time);
        this.filter.frequency.setValueAtTime(initFilter, time, this.envelope.r);
    };

    Lowpass.prototype.output = function(node) {
        this.filter.connect(node);
    };

    Lowpass.prototype.setQ = function(q){
        this.filter.q = q;
    };

    // Delay
    var Delay = function(gain, time) {
        this.delay1 = context.createDelayNode();
        this.delay2 = context.createDelayNode();
        this.delay1.delayTime.value = time * 0.005;
        this.delay2.delayTime.value = time * 0.01;
        this.mixer = new Mixer(2);
        this.mixer.setGain(0, gain * 0.5);
        this.mixer.setGain(1, gain * 0.25);

        this.delay1.connect(this.mixer.inputs[0]);
        this.delay2.connect(this.mixer.inputs[1]);
    };

    Delay.prototype.source = function(node){
        node.output(this.delay1);
        node.output(this.delay2);
    };

    Delay.prototype.output = function(node) {
        this.mixer.output(node);
    };

    return {
        createInstrument: createInstrument,
        presets: presets,
        Mixer: Mixer
    };
}();
