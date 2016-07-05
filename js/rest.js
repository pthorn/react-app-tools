'use strict';

import _ from 'lodash';
import EventEmitter from 'eventemitter';


export function RestError (options) {
    _.assign(this, options);

    this.name = 'RestError';
    this.message = 'Rest Error';
    this.stack = Error(this.message).stack;  // http://es5.github.io/#x15.11.1
};

RestError.prototype = Object.create(Error.prototype);
RestError.prototype.constructor = RestError;


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
export class Rest {
    constructor(config_) {
        this.config = _.assign({
            url_prefix: '/rest/',
            csrf_token: null
        }, config_ || {});

        if (this.config.url_prefix.indexOf('/', this.config.url_prefix.length - 1) === -1) {
            this.config.url_prefix = this.config.url_prefix + '/';
        }

        this.csrf_token = this.config.csrf_token;
        this.requests_in_progress = 0;
    }

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
     *     .catch(arg): RestError {reason: 'rest-error|http-error', json_response: {...}|undefined, status:, statusText:}
     */
    request(opts) {
        const self = this;
        const defaultOpts = {
            dataType: 'json',
            contentType: 'application/json'
        };

        if (opts.method != 'GET' && this.csrf_token !== null) {
            let csrf_token = this.csrf_token;
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

        // TODO _nocache=`new Date().getTime()`
        // TODO https://docs.angularjs.org/api/ng/service/$http#security-considerations

        return new Promise(function (resolve, reject) {
            if (self.requests_in_progress++ == 0) {
                self.emit('start-request');
            }

            $.ajax(_.assign({}, defaultOpts, opts, {
                success: function (json) {
                    if (--self.requests_in_progress == 0) {
                        self.emit('end-request');
                    }

                    // TODO what if response is not JSON?

                    if (json.status === 'ok') {
                        resolve(json);
                    }

                    if (json.status !== 'ok') {
                        self.emit('rest-error', json);
                        reject(new RestError({
                            reason: 'rest-error',
                            json_response: json
                        }));
                    }
                },

                error: function (jqXhr, textStatus, errorThrown) {
                    if (--self.requests_in_progress == 0) {
                        self.emit('end-request');
                    }

                    const error = new RestError({
                        reason: 'http-error',
                        status: jqXhr.status,
                        statusText: jqXhr.statusText
                    });

                    if (jqXhr.status == 401) {
                        self.emit('http-error-401', error);
                    } else if  (jqXhr.status == 403) {
                        self.emit('http-error-403', error);
                    } else {
                        self.emit('http-error', error);
                    }

                    reject(error);
                }
            }));
        });
    }

    // CRUD methods

    getList(entity, params) {
        const url = this.config.url_prefix + entity;

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
    }

    getEntityById(entity, id) {
        const url = `${this.config.url_prefix}${entity}/${id}`;
        return this.request({
            url: url,
            method: 'GET'
        });
    }

    createEntity(entity, data) {
        const url = this.config.url_prefix + entity;
        return this.request({
            url: url,
            method: 'POST',
            data: data
        });
    }

    updateEntityForId(entity, id, data) {
        const url = `${this.config.url_prefix}${entity}/${id}`;
        return this.request({
            url: url,
            method: 'PUT',
            data: data
        });
    }

    deleteById(entity, id) {
        const url = `${this.config.url_prefix}${entity}/${id}`;
        return this.request({
            url: url,
            method: 'DElETE'
        });
    }

    // low level methods

    get(url, data) {
        return this.request({
            url: url,
            method: 'GET',
            data: data
        });
    }

    post(url, data) {
        return this.request({
            url: url,
            method: 'POST',
            data: data
        });
    }

    put(url, data) {
        return this.request({
            url: url,
            method: 'PUT',
            data: data
        });
    }

    del(url, data) {
        return this.request({
            url: url,
            method: 'DELETE',
            data: data
        });
    }

    // utiliity

    set csrfToken(new_token) {
        this.csrf_token = new_token;
    }
}

_.extend(Rest.prototype, EventEmitter.prototype);
