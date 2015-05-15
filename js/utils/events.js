'use strict';

var _ = require('lodash');


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


module.exports = {
    EventMixin:        EventMixin
};