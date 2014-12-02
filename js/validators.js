'use strict';


define([
    'lodash'
], function (
    lodash
) {

    // TODO
    var t = function (msg) { return msg; };


    var required = function (msg) {
        if (_.isUndefined(msg)) {
            msg = t("Field is required");
        }

        var is_empty = function(value) {
            return _.isUndefined(value) || value === '' || value === null || value !== value;
        };

        return function (model, key, val, fail) {
            if (is_empty(val)) {
                fail(key, msg);
            }
        };
    };


    var number = function (options_, msg) {

        var options = _.extend({
            float: false,
            min: undefined,
            max: undefined
        }, options_);


    };


    return {
        required: required
    }
});
