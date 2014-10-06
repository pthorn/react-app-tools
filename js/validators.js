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

        return function (model, key, val, fail) {
            if (_.isEmpty(val)) {
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
