'use strict';

var _     = require('lodash'),
    React = require('react'),
    cx    = require('classnames');

var FormGroup = React.createClass({
    propTypes: {
        model:    React.PropTypes.object.isRequired,
        path:     React.PropTypes.string.isRequired,
        label:    React.PropTypes.string
    },

    getDefaultProps: function () {
        return {
            label: null
        };
    },

    render: function() {
        var c = this,
            { model, path, label, children } = this.props;

        // add "form-control" to the input
        /*
        var i = 0;
        var children = React.Children.map(p.children, function (child) {
            if (i++ == 0) {
                return React.addons.cloneWithProps(child, {className: "form-control" });
            } else {
                return child;
            }
        });
        */

        var show_error = model.shouldShowError(path);
        //console.log(path, 'show_error', show_error);

        var validation_classes = cx({
            'form-group': true,
            'has-error': show_error
        });

        var validation_messages;
        if (show_error) {
            validation_messages = (
                <div className="help-block animation-slideDown">
                    {_.map(model.validationErrors(path), (err, key) => <span key={key}>{err}<br/></span>)}
                </div>
            );
        }

        return (
            <div className={validation_classes}>
                {label &&
                    <label className="col-md-3 control-label" htmlFor={name}>
                        {label}
                    </label>
                }
                <div className="col-md-9">
                    {children}
                    {validation_messages}
                </div>
            </div>
        );
    }
});


var StaticGroup = React.createClass({
    propTypes: {
        label:    React.PropTypes.string
    },

    render: function() {
        var c = this;
        var {label, children} = this.props;

        return <div className="form-group">
            <label className="col-md-3 control-label">{label}</label>
            <div className="col-md-9">
                <p className="form-control-static">
                    {children}
                </p>
            </div>
        </div>;
    }
});

module.exports = {
    FormGroup: FormGroup,
    StaticGroup: StaticGroup
};