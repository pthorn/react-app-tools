'use strict';

var _  = require('lodash');
var React = require('react');
var cx = require('classnames');


var Select = React.createClass({
    propTypes: {
        config: React.PropTypes.object.isRequired,
        name: React.PropTypes.string.isRequired,
        op: React.PropTypes.string,
        label: React.PropTypes.string.isRequired,
        options: React.PropTypes.array.isRequired
    },

    getInitialState: function () {
        return {
            value: ''
        };
    },

    render: function () {
        var c = this,
            { label, options } = this.props,
            s = this.state;

        var options2 = [{val:'', label: '-- ' + label + ' --'}];
        options2.push.apply(options2, options);

        var options_html = options2.map((option, i) =>
            <option key={i} value={option.val}>{option.label}</option>
        );

        return <span className="filter-item">
            <select className="form-control"
                    value={s.value}
                    onChange={c.onChange}>
                {options_html}
            </select>
        </span>
    },

    onChange: function (e) {
        var c = this,
            p = this.props,
            { config, name, op } = this.props;

        var value = e.target.value;

        c.setState({value: value});

        if (value) {
            config.store.setFilter(name, value, op);
        } else {
            config.store.clearFilter(name);
        }
    }
});


module.exports = {
    Select: Select
};
