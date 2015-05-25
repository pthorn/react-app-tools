'use strict';

var _  = require('lodash');
var React = require('react');
var cx = require('classnames');
var { Pagination } = require('./pagination');


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

        var rows = s.rows.map(function (row, i) {
            var cells = p.config.columns.map(function (col_config, j) {
                return <Cell key={j} grid={c} col_config={col_config} row={row} />;
            });

            return <tr key={i} className={cx({even: i%2==0, odd: i%2!=0})}>
                {cells}
            </tr>;
        });

        return (
            <div className="table-responsive">
                <table className="table table-condensed table-hover">
                    <thead>
                        <tr>
                            {p.config.columns.map(function (col, i) {
                                return <ColumnHeader
                                  key={i}
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


var GridBlock = React.createClass({
    propTypes: {
        config: React.PropTypes.object.isRequired
    },

    render: function () {
       var c = this,
           { config, children } = this.props;

        return <div className="panel panel-default rat-grid">
            <div className="panel-heading filters">
                {children}
            </div>
            <div className="panel-body">
                <Grid config={config} />
            </div>
            <div className="panel-footer clearfix">
                <Pagination config={config} />
            </div>
        </div>;
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


module.exports = {
    GridBlock: GridBlock,
    Grid: Grid,
    template: template,
    Filters: require('./filters')
};
