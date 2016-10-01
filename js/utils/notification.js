'use strict';

const _ = require('lodash');
const $ = require('jquery');


/**
 * level: success, info, warning, danger/error
 */
var showNotification = function (title, text, level, timeout) {
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

    $.notify({
        title: '<h4>' + title + '</h4>',
        message: text
    }, {
        type: level,
        delay: timeout || timeouts[level],  // TODO
        allow_dismiss: true,
        z_index: 2000
    });
};


module.exports = {
    showNotification:  showNotification
};