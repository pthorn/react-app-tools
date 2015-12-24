'use strict';

var _ = require('lodash');


/**
 * file_obj
 *   upload_url:
 *   file:
 *   file_param:
 *   upload_params:
 *
 * params
 *   loadstart:    function (xhr, file_obj, e)
 *   progress:     function (xhr, file_obj, e, percentage)
 *   uploaded:     function(response, xhr, file_obj, e)
 *   upload_error: function (error_code, error_arg, response, xhr, file_obj, e)
 *
 * error_code:
 *   'http-status': http status is != 200
 *   'json-decode': error decoding json
 *   'status':     data.status != 'ok'
 *
 * see https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
 */
export const upload_file = function(file_obj, params) {
    var xhr = new XMLHttpRequest();

    // install event listeners

    xhr.upload.addEventListener("loadstart", function (e) {
        params.loadstart(xhr, file_obj, e);
    }, false);

    xhr.upload.addEventListener("progress", function (e) {
        var percentage;
        if (e.lengthComputable) {
            percentage = Math.round((e.loaded * 100) / e.total);
        }
        params.progress(xhr, file_obj, e, percentage);
    });

    xhr.addEventListener("loadend", function (e) {

        if(xhr.status != 200) {
            params.upload_error('http-status', xhr.status, xhr.responseText, xhr, file_obj, e);
            return;
        }

        // TODO check content-type
        try {
            var json_response = JSON.parse(xhr.responseText);
        } catch (err) {
            params.upload_error('json-decode', err, xhr.responseText, xhr, file_obj, e);
            return;
        }

        if (json_response.status === 'ok') {
            params.uploaded(json_response, xhr, file_obj, e);
            return;
        }

        params.upload_error('status', json_response.status, json_response, xhr, file_obj, e);
    }, false);

    // build request with form data

    var form_data = new FormData();

    form_data.append(file_obj.file_param, file_obj.file);

    var upload_params = typeof file_obj.upload_params === 'function' ?
        file_obj.upload_params.call($this) : file_obj.upload_params;  // TODO $this is not defined

    _.forOwn(upload_params, (v, k) => {
        if (!_.isUndefined(v)) {
            form_data.append(k, v);
        }
    });

    // send request

    xhr.open('POST', file_obj.upload_url);
    xhr.send(form_data);
};
