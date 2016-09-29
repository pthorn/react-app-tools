'use strict';

/**
 *
 */
define([
    'lodash',
    'eventemitter'
], function (
    _,
    EventEmitter
) {
    /**
     * paged store for grids
     */
    var PagedStore = function (config_) {

        this.config = _.extend({
            entity: null,
            rows_per_page: 25,
            order_col: null,
            order_dir: 'asc',
            filters: {}
        }, config_);

        this.initialized = false;
        this.rows = [];
        this.current_page = 1;
        this.total_rows = 0;
        this.order_col = this.config.order_col;
        this.order_dir = this.config.order_dir;
        this.filters = this.config.filters;
        this.search = '';

        EventEmitter.call(this);
    };

    _.extend(PagedStore.prototype, EventEmitter.prototype);

    PagedStore.prototype.init = function () {
        if (!this.initialized) {
            this.requestPage(1, true);
            this.initialized = true;
        }
    };

    PagedStore.prototype.getRows = function () {
        return this.rows;
    };

    PagedStore.prototype.setRowsPerPage = function (n) {
        this.config.rows_per_page = n;
    };

    PagedStore.prototype.getTotalRows = function () {
        return this.total_rows;
    };

    PagedStore.prototype.getTotalPages = function () {
        return (((this.total_rows - 1) / this.config.rows_per_page) | 0) + 1;
    };

    PagedStore.prototype.getCurrentPageNumber = function () {
        return this.current_page;
    };

    PagedStore.prototype.getFirstRowNumber = function () {
        return (this.current_page - 1) * this.config.rows_per_page + 1;
    };

    PagedStore.prototype.getLastRowNumber = function () {
        var last_row = this.current_page * this.config.rows_per_page;

        if (last_row > this.total_rows) {
            last_row = this.total_rows;
        }

        return last_row;
    };

    PagedStore.prototype.setFilter = function (key, val, op) {
        if (_.isUndefined(op)) {
            this.filters[key] = val;
        } else {
            this.filters[key] = [op, val];
        }

        this.requestPage(1, true);
    };

    PagedStore.prototype.clearFilter = function (key) {
        delete this.filters[key];
        this.requestPage(1, true);
    };

    PagedStore.prototype.getSearch = function () {
        return this.search;
    };

    PagedStore.prototype.setSearch = function (val) {
        if (this.search !== val) {
            this.search = val;
            this.requestPage(1, true);
        }
    };

    PagedStore.prototype.getOrderColumn = function () {
        return this.order_col;
    };

    PagedStore.prototype.getOrderDirection = function () {
        return this.order_dir;
    };

    PagedStore.prototype.setOrder = function (column, direction) {
        this.order_col = column;
        this.order_dir = direction;
        this.requestPage(1, true);
    };

    PagedStore.prototype.requestPage = function (page_n, reload) {
        if (this.current_page != page_n || reload) {
            this.current_page = page_n;
            this._request();
        }
    };

    PagedStore.prototype.requestNextPage = function () {
        if (this.current_page < this.getTotalPages()) {
            this.current_page++;
            this._request();
        }
    };

    PagedStore.prototype.requestPreviousPage = function () {
        if (this.current_page > 1) {
            this.current_page--;
            this._request();
        }
    };

    PagedStore.prototype.refresh = function () {
        this._request();
    };

    PagedStore.prototype.reload = function () {
        this.current_page = 1;
        this._request();
    };

    PagedStore.prototype._request = function () {
        var self = this;

        // TODO use loading & error to indicate to user
        //$scope.loading = true;

        this.config.rest.getList(this.config.entity, {
            start: (self.current_page - 1) * self.config.rows_per_page,
            limit: self.config.rows_per_page,
            order: {col: self.order_col, dir: self.order_dir},
            filters: self.filters,
            search: self.search
        }).then(function (data) {
            if (data.status === 'ok') {
                self.rows = data.data;
                self.total_rows = data.count;
                self.emit('page-loaded');
            }
        });
//        }).catch(function (xxx) {
//            console.log('grid: rest req error!', xxx);
//            //$scope.data = [];
//            //$scope.loading = false;
//            //$scope.error = true;
//        });
    };


    return {
        PagedStore: PagedStore
    };
});
