'use strict';

var _  = require('lodash');
var React = require('react');
var cx = require('classnames');


var ENTER = 13;


var Search = React.createClass({
    propTypes: {
        config: React.PropTypes.object.isRequired,
        label: React.PropTypes.string.isRequired
    },

    getInitialState: function () {
        return {
            value: ''
        };
    },

    render: function () {
        var c = this,
            p = this.props,
            { label } = this.props,
            s = this.state;

        return <span className="filter-item">

            <div className="input-group input-group-sm">
                <input type="text"
                       className="form-control"
                       value={s.value}
                       onChange={c.onChange}
                       onKeyDown={c.onKeyDown}
                       placeholder={label}/>
                <span className="input-group-btn">
                    <button className="btn btn-default"
                            onClick={c.onSearch}
                            disabled={!s.value}>
                        <i className="glyphicon glyphicon-search gi gi-search"/>
                    </button>
                    <button className="btn btn-default"
                            onClick={c.onReset}
                            disabled={!s.value}>
                        <i className="glyphicon glyphicon-remove gi gi-remove"/>
                    </button>
                </span>
            </div>
        </span>;
    },

    onChange: function (e) {
        var c = this;
        var value = e.target.value;

        c.setState({value: value});
    },

    onSearch: function () {
        var c = this,
            p = this.props,
            s = this.state,
            store = p.config.store;

        store.setSearch(s.value);
    },

    onReset: function () {
        var c = this,
            p = this.props,
            store = p.config.store;

        c.setState({value: ''});
        store.setSearch('');
    },

    onKeyDown: function (e) {
        var c = this,
            p = this.props,
            s = this.state;

        if(e.keyCode == ENTER && s.value) {
            this.onSearch();
        }
    }
});


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
            <select className="form-control input-sm"
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
    Search: Search,
    Select: Select
};
