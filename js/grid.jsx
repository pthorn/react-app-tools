/** @jsx React.DOM */
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


    /*
     * <GridCell col_config={} row={} />
     */
    var GridCell = React.createClass({
        render: function () {
            var c = this,
                p = this.props;

            var col_config = p.col_config,
                val = col_config.key ? p.row[col_config.key] : null;

            if (col_config.template) {
                return <td><col_config.template val={val} row={p.row} col_config={col_config} /></td>;
            } else {
                return <td>{val}</td>;
            }
        }
    });


    var Grid = React.createClass({

        propTypes: {
            config: React.PropTypes.object
        },

        getDefaultProps: function () {
            return {
                config: {},
                data: []
            };
        },

        render: function () {
            var c = this,
                p = this.props,
                s = this.state;

            // TODO ng-click="col_header_click(col)" class="{{col_header_class(col)}}
            var col_headings = p.config.columns.map(function (col) {
                return <th>{col.label || col.key}</th>;
            });

            var i = 0;
            var rows = p.data.map(function (row) {
                var cells = p.config.columns.map(function (col_config) {
                    return <GridCell col_config={col_config} row={row} />;
                });

                var tr = <tr key={i} className={cx({even: i%2==0, odd: i%2!=0})}>{cells}</tr>;
                ++i;
                return tr;
            });

            // TODO pagination, filters
            return (
                <div className="aat-grid">
                    <table className="table table-condensed table-hover">
                        <thead>
                            <tr>
                                {col_headings}
                            </tr>
                        </thead>
                        <tbody>
                            {rows}
                        </tbody>
                    </table>
                </div>
            );
        },

        componentDidMount: function () {
        },


        componentWillUnmount: function () {

        }
    });


    return {
        Grid: Grid
    };
});

/*
{
    choices: callable_returnuing_promise().then(function (data) {
        return data.map(function (el) {
            return {l: el.foo, v: el/bar};
        })
    })
}
*/
