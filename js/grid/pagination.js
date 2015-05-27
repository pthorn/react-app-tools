'use strict';

var _  = require('lodash');
var React = require('react');
var cx = require('classnames');


/**
 * <Pagination config={} />
 */
exports.Pagination = React.createClass({
    render: function () {
        var c = this,
            p = this.props;

        var store = p.config.store;

        //console.log('store.getCurrentPageNumber()', store.getCurrentPageNumber(),
        //            'store.getTotalPages()', store.getTotalPages());

        var list_of_pages = function () {
            var N_LINKS = 4;  // TODO config!

            var pages = [];
            for(var i = Math.max(store.getCurrentPageNumber() - N_LINKS, 1);
                i <= Math.min(store.getCurrentPageNumber() + N_LINKS, store.getTotalPages());
                ++i) {
                pages.push(i);
            }

            return pages;
        };

        return <div className="page-nav row">
            <div className="col-xs-6">
                <ul className="pagination">
                    <li className={cx({disabled: store.getCurrentPageNumber() == 1})}>
                        <a className="first" onClick={c.onClickFirst}>
                            <i className="glyphicon glyphicon-step-backward"/>
                        </a>
                    </li>
                    <li className={cx({disabled: store.getCurrentPageNumber() == 1})}>
                        <a className="prev" onClick={c.onClickPrevious}>
                            <i className="glyphicon glyphicon-chevron-left"/>
                        </a>
                    </li>
                    {list_of_pages().map(function (page) {
                        return <li key={page} className={cx({active: page == store.getCurrentPageNumber()})}>
                            <a onClick={c.onClickPage.bind(null, page)}>{page}</a>
                        </li>;
                    })}
                    <li className={cx({disabled: store.getCurrentPageNumber() == store.getTotalPages()})}>
                        <a className="next" onClick={c.onClickNext}>
                            <i className="glyphicon glyphicon-chevron-right"/>
                        </a>
                    </li>
                    <li className={cx({disabled: store.getCurrentPageNumber() == store.getTotalPages()})}>
                        <a className="last" onClick={c.onClickLast}>
                            <i className="glyphicon glyphicon-step-forward"/>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="col-xs-6 info">
                {store.getTotalRows() > 0 &&
                    <span>
                        Страница {store.getCurrentPageNumber()}/{store.getTotalPages()},
                        строки {store.getFirstRowNumber()}/{store.getLastRowNumber()}
                        {' '} из {store.getTotalRows()}
                    </span>
                }
                {store.getTotalRows() == 0 &&
                    <span>Нет данных.</span>
                }
            </div>
        </div>;
    },

    onClickFirst: function () {
        var store = this.props.config.store;
        store.requestPage(1);
    },

    onClickPrevious: function () {
        var store = this.props.config.store;
        store.requestPreviousPage();
    },

    onClickNext: function () {
        var store = this.props.config.store;
        store.requestNextPage();
    },

    onClickLast: function () {
        var store = this.props.config.store;
        store.requestPage(store.getTotalPages());
    },

    onClickPage: function (page_n) {
        var store = this.props.config.store;
        store.requestPage(page_n);
    }
});
