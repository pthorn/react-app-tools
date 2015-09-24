'use strict';

var _ = require('lodash');
var React = require('react');
var cx = require('classnames');


var DropDownList = React.createClass({
    propTypes: {
        options: React.PropTypes.array.isRequired,
        onSelected: React.PropTypes.func.isRequired
    },

    render: function () {
        var { options, onSelected } = this.props;

        //console.log('--- KKKK', options);

        return <ul className="dropdown">
            {options.map((opts) =>
                <li>
                    <h6>{opts.title}</h6>
                    <ul className="options">
                        { /*console.log('--- ', opts)*/ }
                        {opts.options.map((opt) =>
                            <li onClick={onSelected.bind(null, opt)}>
                                {/* TODO call renderers if any */}
                                {opt.label}
                            </li>
                        )}
                    </ul>
                </li>
            )}
        </ul>;
    }
});


var MultiSelectSelected = React.createClass({
    propTypes: {
        selected_options: React.PropTypes.array.isRequired,
        onClicked: React.PropTypes.func.isRequired,
        onRemoveClicked: React.PropTypes.func.isRequired
    },

    render: function () {
        var { selected_options, onClicked, onRemoveClicked } = this.props;

        return <ul className="selected"
                   onClick={onClicked}>
            {selected_options.map((opt) =>
                <li>
                    <button onClick={onRemoveClicked.bind(null, opt)}>
                        <i className="fa fa-times" />
                    </button>
                    {opt.label}
                </li>
            )}
        </ul>;
    }
});


var clickedOutsideElement = function (element, event) {
    var eventTarget = (event.target) ? event.target : event.srcElement;

    while (eventTarget != null) {
        if (eventTarget === element) return false;
        eventTarget = eventTarget.offsetParent;
    }

    return true;
};


export var MultiSelect = React.createClass({
    propTypes: {
        model: React.PropTypes.object.isRequired,
        path: React.PropTypes.string.isRequired,
        options: React.PropTypes.array.isRequired,
        config: React.PropTypes.object.isRequired
    },

    getInitialState: function () {
        return {
            dropdown_open: false // TODO false
        }
    },

    render: function () {
        var c = this,
            { model, path, options } = this.props,
            { dropdown_open } = this.state;

        var selected_option_ids = model.child(path).getValueForView();
        var selected_options = [];
        //var unselected_options = [];  // TODO!

        //console.log('selected_option_ids', selected_option_ids);

        for (let opts of options) {
            //console.log('MEOW', opts);
            for (let opt of opts.options) {
                //console.log('EOOF', opt);
                if (_.includes(selected_option_ids, opt.val)) {
                    selected_options.push(opt);
                //} else {
                //    unselected_options.push(opt);
                }
            }
        }

        return <div ref="select" className="rat-select">
            <MultiSelectSelected onRemoveClicked={c.onRemoveClicked}
                                 selected_options={selected_options}
                                 onClicked={(e) => this.setState({dropdown_open: true})} />
            {dropdown_open &&
                <DropDownList options={options /*unselected_options*/}
                              onSelected={c.onOptionSelected} />
            }
        </div>;
    },

    onOptionSelected: function (opt, e) {
        e.preventDefault();

        var { model, path } = this.props,
            value = model.child(path).getValueForView();

        //console.log('onOptionSelected', value, opt.val in value, opt);

        if (!_.includes(value, opt.val)) {
            value.push(opt.val);
            model.child(path).setValueFromView(value);
            //console.log('onOptionSelected new value', model.child(path).getValueForView());
        }
    },

    onRemoveClicked: function (opt, e) {
        e.preventDefault();

        //console.log('onRemoveClicked', opt);

        var { model, path } = this.props,
            value = model.child(path).getValueForView();

        if (_.remove(value, (val) => val === opt.val).length > 0) {
            model.child(path).setValueFromView(value);
        }
    },

    _closeMenuIfClickedOutside: function (e) {
        if (clickedOutsideElement(React.findDOMNode(this.refs.select), e)) {
            this.setState({dropdown_open: false});
        }
    },

    componentDidMount: function () {
        document.addEventListener('click', this._closeMenuIfClickedOutside);
    },

    componentWillUnmount: function() {
        document.removeEventListener('click', this._closeMenuIfClickedOutside);
    }
});
