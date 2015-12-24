'use strict';

import _ from 'lodash';


export const human_readable_file_size = function(size) {
    if(size > 1024*1024) {
        return (size / (1024*1024)).toFixed(2) + 'M';
    }
    if(size > 1024) {
        return (size / 1024).toFixed(2) + 'K';
    }
    return "" + size;
};


export const upload_error_message = function (error_code, error_arg, response, xhr, file_obj, e) {
    console.log('upload_error', error_code, error_arg, response);

    var message = 'Ошибка загрузки: ' + error_code + ' ' + error_arg;

    if (error_code == 'status' && response.code === 'not-an-image') {
        message = 'Файл не является изображением';
    } else if (error_code == 'status') {
        message = response.code || response.message;
    } else if (error_code == 'http-status' && error_arg == 413) {
        message = 'Файл слишком большой';
    } else if (error_code == 'http-status') {
        message = 'Ошибка ' + error_arg;
    }

    return message;
};


export const get_url = function (prefix, type, id, variant) {
    var url = prefix + '/' + type;

    if (_.isUndefined(id)) {
        return url;
    }

    url = url + '/' + id;

    if (_.isUndefined(variant) || variant === '') {
        return url;
    }

    return url + '/' + variant;
};
