// dial jQuery plugin
(function($) {
    var defaults = {
        'initalValue': 30,
        'maxValue': 100,
        'updateCallback': function() {}
    },
        markup =
        '<div class="dial">' +
            '<div class="circle display"></div>' +
            '<div class="circle fill"></div>' +
            '<div class="mask"></div>' +
            '<div class="value"></div>' +
        '</div>',

        init = function(options) {
            var _options = $.extend({}, defaults, options),
                $this = $(this),
                $window = $(window);

            $this.html(markup);

            var $dial = $this.find('.dial');
            $dial.data('callback', _options.updateCallback);
            $dial.data('value', _options.initalValue);

            update.call($dial, _options.initalValue);

            $dial.bind('mousewheel', function(event, delta) {
                var val = parseInt($(this).data('value'), 10);
                if (delta > 0) {
                    if (val < 100) {
                        update.call(this, ++val);
                    }
                } else {
                    if (val > 0) {
                        update.call(this, --val);
                    }
                }
                return false;
            })
                .bind('mousedown', function(e) {
                var mouseDownY = e.pageY,
                    self = this;
                $window.bind('mousemove', function(e) {
                    var val = parseInt($(self).data('value'), 10);
                    currentY = e.pageY,
                    distanceY = currentY - mouseDownY,
                    scaleFactor = Math.floor(Math.log(Math.abs(distanceY) + 1) / Math.LN10) + 3;

                    if (currentY > mouseDownY) {
                        if (val < 100 - scaleFactor) {
                            update.call(self, val + scaleFactor);
                        } else {
                            update.call(self, 100);
                        }
                    } else {
                        if (val > 0 + scaleFactor) {
                            update.call(self, val - scaleFactor);
                        } else {
                            update.call(self, 0);
                        }
                    }
                    mouseDownY = currentY;
                    $window.bind('mouseup', function() {
                        $window.unbind('mousemove');
                        $window.unbind('mouseup');
                    });
                });

            });
        },

        update = function(value) {
            var $this = $(this);

            if (value >= 50) {
                $this.addClass('over');
            } else {
                $this.removeClass('over');
            }
            var deg = Math.round(value * 0.01 * 360);
            $this.find('.display').css('webkitTransform', 'rotate(' + deg + 'deg)');
            $this.find('.value').html(value);
            $this.data('value', value);
            $this.data('callback')($this, value);
        };

        methods = {
            init: function(options) {
                return this.each(function() {
                    init.call(this, options);
                });
            },
            update: function(value) {
                return this.each(function() {
                    var $dial = $(this).find('.dial');
                    update.call($dial, value);
                });
            }
        };

    $.fn.dial = function(method) {

        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.dial');
        }

    };

})(jQuery);