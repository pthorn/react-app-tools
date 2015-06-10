'use strict';

var _ = require('lodash');


/**
 * mixins: [EventMixin],
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

        this._events = [];

        this.events.forEach(function (event_spec) {
            if (event_spec.length != 3) {
                throw new Error('EventMixin: this.events elements should be arrays [object, "event", handler]');
            }

            var event_source = event_spec[0],
                event = event_spec[1],
                event_handler = event_spec[2];

            if (_.isFunction(event_source)) {
                event_source = event_source.call(this);
            }

            if (_.isString(event_handler)) {
                event_handler = this[event_handler];
            }
            event_handler = event_handler.bind(this);

            event_source.on(event, event_handler);

            this._events.push([event_source, event, event_handler]);
        }, this);
    },

    componentWillUnmount: function () {
        this._events.forEach(function (event_spec) {
            var event_source = event_spec[0],
                event = event_spec[1],
                event_handler = event_spec[2];

            event_source.off(event, event_handler);
        }, this);

        delete this._events;
    }
};


module.exports = {
    EventMixin:        EventMixin
};
