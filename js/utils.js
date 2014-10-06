

define([], function () {


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
                title: title,
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
     *   [personStore, 'changed', function () {}],
     * ]
     *
     */
    var EventMixin = {

        componentWillMount: function () {
            this.events.forEach(function (event_spec) {
                var event_source = event_spec[0],
                    event = event_spec[1],
                    event_handler = event_spec[2];

                event_source.on(event, event_handler.bind(this));
            }, this);
        },

        componentWillUnmount: function () {
            this.events.forEach(function (event_spec) {
                var event_source = event_spec[0],
                    event = event_spec[1],
                    event_handler = event_spec[2];

                event_source.off(event, event_handler.bind(this));
            }, this);
        }
    };


    return {
        NotificationMixin: NotificationMixin,
        EventMixin:        EventMixin
    };
});
