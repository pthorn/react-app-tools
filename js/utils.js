

define([
    'lodash'
], function (
    _
) {


    var NotificationMixin = {

        /**
         * level: success, info, warning, danger/error
         */
        showNotification: function (title, text, level, timeout) {
            var timeouts = {
                info: 2000,
                success: 2000,
                warning: 10000,
                danger: 0
            };

            if (level == 'error') {
                level = 'danger';
            }

            if (level === undefined) {
                level = 'info';
            }

            $.growl({
                title: '<h4>' + title + '</h4>',
                message: text
            }, {
                type: level,
                delay: timeouts[level],  // TODO
                allow_dismiss: true,
                z_index: 2000
            });
        }
    };


    /**
     * events: [
     *   [personStore, 'changed', function () {...}],
     *   [fooStore,    'bar',     'onBar']  // this.onBar
     * ]
     *
     */
    var EventMixin = {

        componentWillMount: function () {
            if (!_.isArray(this.events)) {
                throw new Error('EventMixin: this.events should be an array');
            }

            this.events.forEach(function (event_spec) {
                if (event_spec.length != 3) {
                    throw new Error('EventMixin: this.events elements should be arrays [object, "event", handler]');
                }

                var event_source = event_spec[0],
                    event = event_spec[1],
                    event_handler = event_spec[2];

                if (_.isString(event_handler)) {
                    event_handler = this[event_handler];
                }

                event_source.on(event, event_handler.bind(this));
            }, this);
        },

        componentWillUnmount: function () {
            this.events.forEach(function (event_spec) {
                var event_source = event_spec[0],
                    event = event_spec[1],
                    event_handler = event_spec[2];

                if (_.isString(event_handler)) {
                    event_handler = this[event_handler];
                }

                event_source.off(event, event_handler.bind(this));
            }, this);
        }
    };


    return {
        NotificationMixin: NotificationMixin,
        EventMixin:        EventMixin
    };
});
