

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

                event_handler = event_handler.bind(this);
                event_source.on(event, event_handler);
                event_spec.push(event_handler);
            }, this);
        },

        componentWillUnmount: function () {
            this.events.forEach(function (event_spec) {
                var event_source = event_spec[0],
                    event = event_spec[1],
                    event_handler_orig = event_spec[2],
                    event_handler = event_spec[3];

                event_source.off(event, event_handler);
                event_spec.pop();
            }, this);
        }
    };


    var add_subdomain = function(subdomain) {
        var hostname_split = document.location.hostname.split(".");
        if (hostname_split.length && hostname_split[0] == 'www') {    // TODO
            hostname_split.splice(0, 1); // [xxx, site, com] -> [site, com]
        }
        hostname_split.unshift(subdomain);
        var hostname = hostname_split.join('.');

        if (document.location.port) {
            hostname = hostname + ':' + document.location.port;
        }

        return hostname;
    };


    return {
        NotificationMixin: NotificationMixin,
        EventMixin:        EventMixin,
        add_subdomain:     add_subdomain
    };
});
