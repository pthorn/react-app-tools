'use strict';


/**
 *
 */
define([
    'lodash',
    'react'
], function (
    _,
    React
) {

    var cx = React.addons.classSet;


    /**
     * <ColumnHeader config={} col_config={} />
     */
    var ColumnHeader = React.createClass({
        render: function () {
            var c = this,
                p = this.props,
                store = p.config.store,
                col_config = this.props.col_config;

            var header_classes = function () {
                var key = col_config.sort_key || col_config.key;

                return cx({
                    'order': true,
                    'enabled': key != store.getOrderColumn(),
                    'disabled': !key,
                    'asc': key == store.getOrderColumn() && store.getOrderDirection() == 'asc',
                    'desc': key == store.getOrderColumn() && store.getOrderDirection() != 'asc'
                });
            };

            return <th className={header_classes()}
                       onClick={c.onClick}>
                {col_config.label || col_config.key}
            </th>;
        },

        onClick: function () {
            var c = this,
                p = this.props,
                store = p.config.store,
                col_config = p.col_config;

            var key = col_config.sort_key || col_config.key;

            if(!key) {
                return;
            }

            if(key == store.getOrderColumn()) {
                store.setOrder(key, (store.getOrderDirection() == 'asc') ? 'desc' : 'asc');
            } else {
                store.setOrder(key, 'asc');
            }
        }
    });


    /**
     * <Cell grid={} col_config={} row={} />
     */
    var Cell = React.createClass({
        render: function () {
            var c = this,
                p = this.props;

            var col_config = p.col_config,
                key = col_config.key;

            // key is a string or a list of strings: 'a' -> val = row.a; ['a', 'b'] -> val = row.a.b
            var val = null;
            if (_.isString(key)) {
                val = p.row[key];
            } else {
                val = p.row;
                _.each(key, el => val = val[el]);
            }

            if (col_config.template) {
                return <td>
                    <col_config.template
                      val={val}
                      row={p.row}
                      col_config={col_config}
                      grid={p.grid} />
                </td>;
            } else {
                return <td>{val}</td>;
            }
        }
    });


    var Filter = React.createClass({
        render: function () {
            var c = this,
                p = this.props;
        }
    });


    /**
     * <Pagination config={} />
     */
    var Pagination = React.createClass({
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
                            <a className="first" onClick={c.onClickFirst}>&laquo;</a>
                        </li>
                        <li className={cx({disabled: store.getCurrentPageNumber() == 1})}>
                            <a className="prev" onClick={c.onClickPrevious}>&lt;</a>
                        </li>
                        {list_of_pages().map(function (page) {
                            return <li key={page} className={cx({active: page == store.getCurrentPageNumber()})}>
                                <a onClick={c.onClickPage.bind(null, page)}>{page}</a>
                            </li>;
                        })}
                        <li className={cx({disabled: store.getCurrentPageNumber() == store.getTotalPages()})}>
                            <a className="next" onClick={c.onClickNext}>&gt;</a>
                        </li>
                        <li className={cx({disabled: store.getCurrentPageNumber() == store.getTotalPages()})}>
                            <a className="last" onClick={c.onClickLast}>&raquo;</a>
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


    /**
     * config: {
     *   store: new PagedStore({rest: rest, entity: 'foo'}),
     *   columns: [{
     *     key: 'foo' | ['foo', 'bar'],  //  'a' -> val = row.a; ['a', 'b'] -> val = row.a.b
     *     sort_key: '',
     *     label: '',
     *     template: React.createClass({})
     *   }],
     *   default_order: {key: '', dir: ''}
     * }
     */
    var Grid = React.createClass({
        propTypes: {
            config: React.PropTypes.object
        },

        getDefaultProps: function () {
            return {
                config: {}
            };
        },

        getInitialState: function () {
            return {
                rows: []
            }
        },

        render: function () {
            var c = this,
                p = this.props,
                s = this.state;

            var i = 0;
            var rows = s.rows.map(function (row) {
                var cells = p.config.columns.map(function (col_config) {
                    return <Cell grid={c} col_config={col_config} row={row} />;
                });

                var tr = <tr key={i} className={cx({even: i%2==0, odd: i%2!=0})}>{cells}</tr>;
                ++i;
                return tr;
            });

            return (
                <div className="rat-grid">
                    <table className="table table-condensed table-hover">
                        <thead>
                            <tr>
                                {p.config.columns.map(function (col) {
                                    return <ColumnHeader
                                      col_config={col}
                                      config={p.config} />;
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {rows}
                        </tbody>
                    </table>
                    <Pagination config={p.config} />
                </div>
            );
        },

        onPageLoaded: function () {
            this.setState({rows: this.props.config.store.getRows()});
        },

        componentWillMount: function () {
            var c = this,
                p = this.props,
                store = p.config.store;

            if (!store) {
                throw new Error('no store supplied to grid');
            }

            store.on('page-loaded', this.onPageLoaded);

            if (p.config.default_order) {
                store.setOrder(p.config.default_order.key, p.config.default_order.dir);
            }

            p.config.store.requestPage(1, true);
        },

        componentWillUnmount: function () {
            this.props.config.store.off('page-loaded', this.onPageLoaded);
        },

        // public API (also for cells)

        reload: function () {
            this.props.config.store.requestPage(this.props.config.store.getCurrentPageNumber(), true);
        }
    });


    /**
     * columns: [{key: 'foo', template: Grid.template((val, row) => <a href={row.id}>{val}</a>)}]
     */
    var template = function (render) {
        return React.createClass({
            render: function () {
                var c = this,
                    p = this.props;

                return render(p.val, p.row, p.col_config, p.grid);
            }
        });
    };

    return {
        Grid: Grid,
        template: template
    };
});
