'use strict';

define([
    'lodash',
    'eventemitter'
], function (
    _,
    EventEmitter
) {
    /**
     * config:
     *   url_prefix:  string, default '/rest/', could be '//rest.me.com/api/'
     *   csrf_token:  string or callable, default null
     *
     * events:
     *   'rest-error'
     *   'http-error-401'
     *   'http-error-403'
     *   'http-error'      http status is 4xx or 5xx but not 401 or 403
     *   'start-request'
     *   'end-request'
     */
    var Rest = function (config_) {
        var self = this;

        var config = $.extend({
            url_prefix:       '/rest/',
            csrf_token: null
        }, config_ || {});

        if (config.url_prefix.indexOf('/', this.length - 1) === -1) {
            config.url_prefix = config.url_prefix + '/';
        }

        var requests_in_progress = 0;

        /**
         * opts:
         *   url
         *   method
         *   data: query string if GET else JSON request body
         *   dataType: default is 'json'
         *   contentType: default is 'application/json'
         *
         *   @return promise:
         *     .then(arg): json response
         *     .catch(arg): {reason: 'string', json|xhr: ...}
         */
        this.request = function (opts) {

            var defaultOpts = {
                dataType: 'json',
                contentType: 'application/json'
            };

            if (opts.method != 'GET' && config.csrf_token !== null) {
                var csrf_token = config.csrf_token;
                if (_.isFunction(csrf_token)) {
                    csrf_token = csrf_token();
                }

                defaultOpts.headers = {
                    'X-CSRF-Token': csrf_token
                };
            }

            if (opts.data && opts.method != 'GET') {
                opts.data = JSON.stringify(opts.data);
            }


            return new Promise(function (resolve, reject) {
                if (requests_in_progress++ == 0) {
                    self.emit('start-request');
                }

                $.ajax($.extend({}, defaultOpts, opts, {
                    success: function (json) {
                        if (--requests_in_progress == 0) {
                            self.emit('end-request');
                        }

                        // TODO what if response is not JSON?

                        if (json.status === 'ok') {
                            resolve(json);
                        }

                        if (json.status !== 'ok') {
                            self.emit('rest-error', json);
                            reject({reason: 'rest-error', json: json});
                        }
                    },

                    error: function (jqXhr, textStatus, errorThrown) {
                        if (--requests_in_progress == 0) {
                            self.emit('end-request');
                        }

                        if (jqXhr.status == 401) {
                            self.emit('http-error-401', jqXhr);
                        } else if  (jqXhr.status == 403) {
                            self.emit('http-error-403', jqXhr);
                        } else {
                            self.emit('http-error', jqXhr);
                        }

                        reject({reason: 'http-error', xhr: jqXhr});
                    }
                }));
            });
        };

        // CRUD methods

        this.getList = function (entity, params) {
            var url = config.url_prefix + entity;

            var qs = {};


            if (_.isObject(params)) {
                if (params.start) {
                    qs.s = params.start;
                }

                if (params.limit) {
                    qs.l = params.limit;
                }

                if (_.isString(params.order)) {
                    qs.o = params.order;
                } else if (_.isObject(params.order) && params.order.col) {
                    qs.o = (params.order.dir == 'desc' ? '-' : '') + params.order.col;
                }

                if (params.search) {
                    qs.q = params.search;
                }

                if (params.filters) {
                    $.each(params.filters, function (key, val) {
                        if (!val && val !== 0) {
                            return;
                        }

                        var value = val,
                            op = 'e';
                        if (val instanceof Array) {
                            op = val[0];
                            value = val[1];
                        }

                        qs['f' + op + '_' + key] = value;
                    });
                }
            }

            return this.request({
                url: url,
                method: 'GET',
                data: qs
            });
        };

        this.getEntityById = function (entity, id) {
            var url = config.url_prefix + entity + '/' + id;
            return this.request({
                url: url,
                method: 'GET'
            });
        };

        this.createEntity = function (entity, data) {
            var url = config.url_prefix + entity;
            return this.request({
                url: url,
                method: 'POST',
                data: data
            });
        };

        this.updateEntityForId = function (entity, id, data) {
            var url = config.url_prefix + entity + '/' + id;
            return this.request({
                url: url,
                method: 'PUT',
                data: data
            });
        };

        this.deleteById = function (entity, id) {
            var url = config.url_prefix + entity + '/' + id;
            return this.request({
                url: url,
                method: 'DElETE'
            });
        };

        // low level methods

        this.get = function (url, data) {
            return this.request({
                url: url,
                method: 'GET',
                data: data
            });
        };

        this.post = function (url, data) {
            return this.request({
                url: url,
                method: 'POST',
                data: data
            });
        };

        this.put = function (url, data) {
            return this.request({
                url: url,
                method: 'PUT',
                data: data
            });
        };

        this.del = function (url, data) {
            return this.request({
                url: url,
                method: 'DELETE',
                data: data
            });
        };
    };

    _.extend(Rest.prototype, EventEmitter.prototype);


    return {
        Rest: Rest
    };
});
