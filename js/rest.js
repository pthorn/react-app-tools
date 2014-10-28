'use strict';

define([
    'lodash',
    'rsvp',
    'eventemitter',
], function (
    _,
    RSVP,
    EventEmitter
) {

    /**
     * config:
     *   url_prefix:  default '/rest/', could be '//rest.me.com/api/'
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
            url_prefix:       '/rest/'
        }, config_ || {});

        if (config.url_prefix.indexOf('/', this.length - 1) === -1) {
            config.url_prefix = config.url_prefix + '/';
        }

        this.request = function (opts) {

            var defaultOpts = {
                dataType: 'json',
                contentType: "application/json"
            };

            if (opts.data && opts.method != 'GET') {
                opts.data = JSON.stringify(opts.data);
            }

            return new RSVP.Promise(function (resolve, reject) {
                $.ajax($.extend({}, defaultOpts, opts, {
                    success: function (json) {
                        if (json.status == 'ok') {
                            resolve(json);
                        } else {
                            if (json.status == 'invalid') {
                                self.emit('invalid', json);
                            } else {
                                self.emit('rest-error', json);
                            }

                            // TODO arguments
                            reject(json);
                        }
                    },

                    error: function (jqXhr, textStatus, errorThrown) {
                        if (jqXhr.status == 401) {
                            self.emit('http-error-401', jqXhr);
                        } else if  (jqXhr.status == 403) {
                            self.emit('http-error-403', jqXhr);
                        } else {
                            self.emit('http-error', jqXhr);
                        }

                        reject({
                            jqXhr: jqXhr,
                            textStatus: textStatus,
                            errorThrown: errorThrown
                        });
                    }
                }));
            });
        };

        this.getList = function (entity, params) {
            var url = config.url_prefix + entity;

            var qs = {};

            if (params.start) {
                qs.s = params.start;
            }

            if (params.limit) {
                qs.l = params.limit;
            }

            if (params.order) {
                var col, dir;

                if (typeof params.order === 'string') {
                    col = params.order;
                    dir = 'asc';
                } else {
                    col = params.order.col;
                    dir = params.order.dir;
                }

                qs.o = (dir == 'desc' ? '-' : '') + col;
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
    };

    _.extend(Rest.prototype, EventEmitter.prototype);


    return {
        Rest: Rest
    };
});
