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
            fixed_filters: []
        }, config_);

        this.rows = [];
        this.current_page = 1;
        this.total_rows = 0;
        this.order_column = null;
        this.order_direction = 'asc';
    };

    _.extend(PagedStore.prototype, EventEmitter.prototype);

    PagedStore.prototype.getRows = function () {
        return this.rows;
    };

    PagedStore.prototype.setRowsPerPage = function (n) {
        this.config.rows_per_page = n;
    };

    PagedStore.prototype.setFilters = function (xxxx) {
        // TODO
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

    PagedStore.prototype.getOrderColumn = function () {
        return this.order_column;
    };

    PagedStore.prototype.getOrderDirection = function () {
        return this.order_direction;
    };

    PagedStore.prototype.setOrder = function (column, direction) {
        this.order_column = column;
        this.order_direction = direction;
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

    PagedStore.prototype._request = function () {
        var self = this;

        // TODO use loading & error to indicate to user
        //$scope.loading = true;

        this.config.rest.getList(this.config.entity, {
            start: (self.current_page - 1) * self.config.rows_per_page,
            limit: self.config.rows_per_page,
            order: {dir: self.order_direction, col: self.order_column}//,
            // TODO search and filters
            //search: self.search,
            //filters: self.selected_filters
        }).then(function (data) {
            self.rows = data.data;
            self.total_rows = data.count;
            self.emit('page-loaded');
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
