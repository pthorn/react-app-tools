'use strict';

var _     = require('lodash'),
    React = require('react'),
    cx = require('classnames');


var TextField = React.createClass({
    propTypes: {
        model:      React.PropTypes.object.isRequired,
        path:       React.PropTypes.string.isRequired,
        type:       React.PropTypes.string,
        className:  React.PropTypes.string
    },

    getDefaultProps: function() {
        return {
            type: 'text',
            className: 'form-control'
        }
    },

    render: function () {
        var c = this;
        var { model, path, type, className, ...etc } = this.props;

        var value = model.child(path).getValueForView();

        return <input type={type}
            className={className}
            value={value}
            disabled={model.isDisabled(path)}
            onChange={c.onChange}
            onBlur={c.onBlur}
            {...etc} />;
    },

    onChange: function (e) {
        var c = this;
        var { model, path } = this.props;

        model.child(path).setValueFromView(e.target.value);
    },

    onBlur: function (e) {
        // TODO ???
    }
});


var Textarea = React.createClass({
    propTypes: {
        model:    React.PropTypes.object.isRequired,
        path:     React.PropTypes.string.isRequired
    },

    render: function () {
        var c = this;
        var { model, path, ...etc } = this.props;

        var value = model.child(path).getValueForView();

        return <textarea
            className="form-control"
            value={value}
            disabled={model.isDisabled(path)}
            onChange={c.onChange}
            onBlur={c.onBlur}
            {...etc} />;
    },

    onChange: function (e) {
        var c = this;
        var { model, path } = this.props;

        model.child(path).setValueFromView(e.target.value);
    },

    onBlur: function (e) {
        // TODO ???
    }
});


var Checkbox = React.createClass({
    propTypes: {
        model:    React.PropTypes.object.isRequired,
        path:     React.PropTypes.string.isRequired
    },

    render: function () {
        var c = this;
        var { model, path, ...etc } = this.props;

        var value = model.child(path).getValueForView();

        return <input type="checkbox"
            checked={value}
            disabled={model.isDisabled(path)}
            onChange={c.onChange}
            {...etc} />;
    },

    onChange: function (e) {
        var { model, path } = this.props;

        model.child(path).setValueFromView(e.target.checked);
    }
});


var Select = React.createClass({
    propTypes: {
        model:    React.PropTypes.object.isRequired,
        path:     React.PropTypes.string.isRequired,
        options:  React.PropTypes.array.isRequired
    },

    render: function () {
        var c = this;
        var { model, path, options, ...etc } = this.props;

        var value = model.child(path).getValueForView();

        var options_html = options.map(function (option) {
            return <option key={option.val} value={option.val}>{option.label}</option>;
        });

        return <select
            className="form-control"
            value={value}
            disabled={model.isDisabled(path)}
            onChange={c.onChange}
            {...etc}>
                {options_html}
        </select>
    },

    // TODO multiple!!
    onChange: function (e) {
        var { model, path } = this.props;

        model.child(path).setValueFromView(e.target.value);
    }
});


var RadioList = React.createClass({
    propTypes: {
        model:    React.PropTypes.object.isRequired,
        path:     React.PropTypes.string.isRequired,
        options:  React.PropTypes.array.isRequired
    },

    render: function () {
        var c = this;
        var { model, path, options, ...etc } = this.props;

        var value = model.child(path).getValueForView();

        var options_html = options.map(function (option, n) {
            return <div className={cx({radio: true, disabled: options.disabled})} key={n}>
                <label>
                    <input type="radio"
                           checked={_.includes(value, option.val)}
                           disabled={option.disabled /* TODO how to disable whole control when model.isDisabled(path)*/}
                           onChange={c.onChange.bind(null, option.val)} />
                    {option.label}
                </label>
            </div>
        });

        return <div {...etc}>
            {options_html}
        </div>;
    },

    onChange: function (val, e) {
        var { model, path } = this.props;

        model.child(path).setValueFromView(val);
    }
});


var CheckboxList = React.createClass({
    propTypes: {
        model:    React.PropTypes.object.isRequired,
        path:     React.PropTypes.string.isRequired,
        options:  React.PropTypes.array.isRequired
    },

    render: function () {
        var c = this;
        var { model, path, options, ...etc } = this.props;

        var values = model.child(path).getValueForView();

        var options_html = options.map(function (option, n) {
            return <div className={cx({checkbox: true, disabled: options.disabled})} key={n}>
                <label>
                    <input type="checkbox"
                           checked={_.indexOf(values, option.val) !== -1}
                           disabled={option.disabled /* TODO how to disable whole control when model.isDisabled(path)*/}
                           onChange={c.onChange.bind(null, option.val)} />
                    {option.label}
                </label>
            </div>
        });

        return <div {...etc}>
            {options_html}
        </div>;
    },

    onChange: function (val, e) {
        var { model, path } = this.props;
        var values = model.child(path).getValueForView();
        var checked = e.target.checked;

        //console.log('onChange before, values =', values, val, checked);

        if (checked) {
            values.push(val);
        } else {
            values = _.without(values, val);
        }

        //console.log('onChange after, values =', values);

        model.child(path).setValueFromView(values);
    }
});


module.exports = {
    TextField: TextField,
    Textarea: Textarea,
    Checkbox: Checkbox,
    Select: Select,
    RadioList: RadioList,
    CheckboxList: CheckboxList
};