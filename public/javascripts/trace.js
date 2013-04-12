var trace = function () {

    var MIN_FREQ = Temper("G3").freq(),
        MAX_FREQ = Temper("C7").freq();

    // CHEESY HACK. Binding all visualization to the same canvas so that there
    // is only one PaperScope (to reduce overhead)
    var _$parent = $('.visual-canvas'),
        _$canvas = _$parent.find('canvas'),
        _scope,
        _traces = [],
        _timingOffset = null;

    if (_$canvas.length > 0) {
        var canvas = _$canvas.get(0);
        canvas.width = _$parent.width();
        canvas.height = _$parent.height();
        _scope = new paper.PaperScope();
        _scope.setup(canvas);

        var PATH_STYLE = {
            strokeColor: "#111",
            strokeWidth: 3
        };
    }

    var Visualization = function(selector) {
        this.items = [];

        this.$parent = $(selector + ' .visual-spacer');

        var n = _traces.length;

        this.originX = 0;

        for (var i = 0; i < n; i++) {
            this.originX += _traces[i].fullWidth();
        }

        this.originY = 0;
        this.margin = 5;

        this.group = new _scope.Group(
            new _scope.Path.Rectangle(
                this.originX,
                this.originY,
                this.$parent.width(),
                this.$parent.height()
            )
        );

        this.group.clipped = true;

        this.onFrame = function (event) {
            var i, item,
                n = this.items.length,
                expired = -1;

            for (i = 0; i < n; i++) {
                item = this.items[i];
                this.draw(event.time, item);
                if (item.removed) {
                    expired = i;
                }
            }

            this.items = this.items.slice(expired + 1);
        };

        _traces.push(this);
    };

    // Return absolute x-value for a x-value relative to this trace
    Visualization.prototype.X = function(x) {
        return x + this.originX + this.margin;
    };

    // Return absolute y-value for a y-value relative to this trace
    Visualization.prototype.Y = function(y) {
        return y + this.originY + this.margin;
    };


    Visualization.prototype.randomPoint = function () {
        var w = this.width(),
            h = this.height();
            x = Math.floor(Math.random() * w),
            y = Math.floor(Math.random() * h);
        return new _scope.Point(this.X(x), this.Y(y));
    };

    Visualization.prototype.queueItem = function (note, start, duration) {
        var d = duration * 1.1;
        this.items.push({
            frequency: note.frequency,
            start: start,
            end: start + d,
            duration: d,
            removed: false,
            lowFrequency: note.lowestFreq,
            highFrequency: note.highestFreq,
            phraseDuration: note.phraseDuration
        });
    };

    Visualization.prototype.schedule = function (note, start, duration) {
        var animationStart;
        // Convert from the time as measured by the sound clock
        // to the animation clock
        if (_timingOffset) {
            animationStart = start + _timingOffset;
        } else {
            animationStart = start;
        }

        this.queueItem(note, animationStart, duration);
    };

    Visualization.prototype.width = function() {
        return this.$parent.width() - 2 * this.margin;
    };

    Visualization.prototype.fullWidth = function() {
        return this.$parent.width();
    };

    Visualization.prototype.height = function() {
        return this.$parent.height() - 2 * this.margin;
    };

    Visualization.prototype.normalizedFrequency = function(frequency) {
        return (frequency - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);
    };

    Visualization.prototype.centeredFrequency = function(item) {
        var mid = 0.5 * (item.highFrequency + item.lowFrequency),
            range = 0.1 * (MAX_FREQ - MIN_FREQ);
        return (item.frequency - mid) / range + 0.5;
    };

    Visualization.prototype.draw = function (time, item) {

        if (time >= item.start) {
            if (time < item.end) {
                // render the item
                if (!item.path) {
                    item.path = this.createPath(item);
                    this.group.addChild(item.path);
                } else {
                    var age = (time - item.start) / item.duration;
                    this.updatePath(item, age);
                }
            } else {
                if (item.path) {
                    item.path.remove();
                    item.removed = true;
                }
            }
        }
    };

    var Circle = function(selector) {
        Visualization.call(this, selector);
    };

    Circle.prototype = Object.create(Visualization.prototype, {
        createPath: {
            value: function (item) {
                var w = this.width(),
                    h = this.height(),
                    x, y, radius, center, circle;

                radius = 0.5 * h * Math.sqrt(item.duration / item.phraseDuration);

                x = this.centeredFrequency(item) * w;
                y = (0.66) * h;
                center = new _scope.Point(this.X(x),  this.Y(y));

                circle = _scope.Path.Circle(center, radius);
                circle.style = PATH_STYLE;

                return circle;
            }
        },
        updatePath: {
            value: function(item, age) {
                item.path.fillColor = "#C54028";
                item.path.fillColor.alpha = 1 - age;

                item.path.strokeWidth *= 0.98;
                item.path.strokeColor.alpha = 1 -age;

                item.path.scale(0.98, 0.98);
                item.path.translate(new _scope.Point(0, -1));
            }
        }
    });

    var Sine = function (selector) {
        // frequency of time-varying oscillations
        Visualization.call(this, selector);
    };

    Sine.prototype = Object.create(Visualization.prototype, {
        waveFunction: {
            value: function(item, x, t) {
                var w = item.omega,
                    k = item.k,
                    phi = item.phase,
                    weights = [0.5, 0.3, 0.2],
                    overtones = weights.length,
                    amplitude = 0,
                    n;
                for (var i = 0; i < overtones; i++) {
                    n = i + 1;
                    amplitude += weights[i] * (
                        Math.sin(n * w * t - n * k * x + phi) + Math.sin(n * w * t + n * k * x + phi)
                    );
                }
                return amplitude;
            }
        },

        createPath: {
            value: function (item) {
                var w = this.width(),
                    h = this.height(),
                    f = this.normalizedFrequency(item.frequency),
                    x = 0,
                    y = h / 2,
                    samples = 400,
                    dx = w / samples,
                    wave = new _scope.Path();

                item.center = new _scope.Point(this.X(w/2), this.Y(h/2));
                item.omega = 1 /item.duration;
                item.k = 2 * Math.PI * Math.floor(f * w / (2 * Math.PI)) / w;
                item.phase =  2 * Math.PI * Math.random();

                wave.style = PATH_STYLE;

                wave.add(this.X(x), this.Y(y));
                for (var i = 0; i < samples - 1; i++) {
                    x += dx;
                    y = h * (0.5 + 0.25 * this.waveFunction(item, x, 0));
                    wave.add(this.X(x), this.Y(y));
                }

                wave.smooth();
                return wave;
            }
        },

        updatePath: {
            value: function(item, age) {
                var h = this.height(),
                    n = item.path.segments.length;

                for (var i = 0; i < n; i ++) {
                    var point = item.path.segments[i].point;
                    point.y = h * (0.5 + 0.25 * this.waveFunction(item, point.x, age));
                }

                item.path.strokeColor.alpha = 1 - age;
                item.path.strokeWidth *= 0.98;
                //item.path.scale(1, Math.sqrt(1 - age), item.center);
            }
        }
    });

    var Square = function (selector) {
        Visualization.call(this, selector);
    };

    Square.prototype = Object.create(Visualization.prototype, {
        createPath: {
            value: function(item) {
                var w = this.width(),
                    h = this.height(),
                    segments = 10,
                    x = 0,
                    dx = w / segments,
                    dx1 = 2 * dx / (3 + Math.sqrt(5)), // length of segments along the baseline
                    dx2 = dx - dx1, // length of the deviated segments
                    //y = h - this.centeredFrequency(item) * h,
                    y = h / 2,
                    square = new _scope.Path();

                item.center = new _scope.Point(this.X(w/2), this.Y(h/2));

                square.style = PATH_STYLE;
                while (x < w) {
                    // Baseline segment
                    square.add(this.X(x), this.Y(y));
                    x += dx1;
                    square.add(this.X(x), this.Y(y));

                    // Deviated segment
                    dy = 1.5 * this.centeredFrequency(item) * h * (Math.random() - 0.5);
                    square.add(this.X(x), this.Y(y + dy));
                    x += dx2;
                    square.add(this.X(x), this.Y(y + dy));
                    square.add(this.X(x), this.Y(y));
                }

                return square;
            }
        },

        updatePath: {
            value: function(item, age) {
                item.path.fillColor = "#92984e"; // "#bdc58c";
                item.path.fillColor.alpha = 1 - age;

                item.path.strokeWidth *= 0.98;
                item.path.strokeColor.alpha = 1 - age;

                // WOBBLE: item.path.rotate(2 * (Math.random() - 0.5)); 
                item.path.scale(1, Math.sqrt(1 - age), item.center);
            }
        }
    });

    var STYLES = {
        'sine': Sine,
        'circle': Circle,
        'square': Square
    };

    var createVisualization = function(style, selector) {
        if (style in STYLES) {
            return new STYLES[style](selector);
        }
    };

    // Don't install the animation onFrame handler until begin is called! 
    var begin = function(context) {
        _scope.view.onFrame = function(event) {
            var n = _traces.length;

            _timingOffset = event.time - context.currentTime;

            for (var i = 0; i < n; i++) {
                _traces[i].onFrame(event);
            }
        };
    };

    return {
        createVisualization: createVisualization,
        begin: begin
    };
}();
