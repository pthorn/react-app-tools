'use strict';

var _ = require('lodash');
var React = require('react');
var ReactDOM = require('react-dom');
var cx = require('classnames');


var DropDownList = React.createClass({
    propTypes: {
        options: React.PropTypes.array.isRequired,
        onSelected: React.PropTypes.func.isRequired,
        twolevel: React.PropTypes.bool
    },

    render: function () {
        var { options, twolevel, onSelected } = this.props;

        const render_one_level_list = (opts) =>
            opts.map((opt) =>
                <li key={opt.val} onClick={onSelected.bind(null, opt)}>
                    {/* TODO call renderers if any */}
                    {opt.label}
                </li>
            );

        if (twolevel) {
            return <ul className="dropdown">
                {options.map((opts) =>
                    <li>
                        <h6>{opts.title}</h6>
                        <ul className="options">
                            {render_one_level_list(opts.options)}
                        </ul>
                    </li>
                )}
            </ul>;
        } else {
            return <ul className="dropdown options">
                {render_one_level_list(options)}
            </ul>;
        }
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
                <li key={opt.val}>
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
        store:    React.PropTypes.object.isRequired,
        node:     React.PropTypes.object.isRequired,
        options:  React.PropTypes.array.isRequired,
        twolevel: React.PropTypes.bool
    },

    getDefaultProps: function () {
        return {
            twolevel: false
        };
    },

    getInitialState: function () {
        return {
            dropdown_open: false
        }
    },

    render: function () {
        const c = this;
        const { store, node, options, twolevel } = c.props;
        const model = store.model;
        const { dropdown_open } = c.state;

        // TODO val.id is hardcoded here
        const selected_option_ids = model.viewValue(node).map((subval) => subval.id);
        var selected_options = [];
        //var unselected_options = [];  // TODO!

        //console.log('selected_option_ids', selected_option_ids);

        if (twolevel) {
            for (let opts of options) {
                for (let opt of opts.options) {
                    if (_.includes(selected_option_ids, opt.val)) {
                        selected_options.push(opt);
                        //} else {
                        //    unselected_options.push(opt);
                    }
                }
            }
        } else {
            for (let opt of options) {
                if (_.includes(selected_option_ids, opt.val)) {
                    selected_options.push(opt);
                }
            }
        }

        return <div ref="select" className="rat-select">
            <MultiSelectSelected onRemoveClicked={c.onRemoveClicked}
                                 selected_options={selected_options}
                                 onClicked={(e) => this.setState({dropdown_open: true})} />
            {dropdown_open &&
                <DropDownList options={options /*unselected_options*/}
                              twolevel={twolevel}
                              onSelected={c.onOptionSelected} />
            }
        </div>;
    },

    onOptionSelected: function (opt, e) {
        e.preventDefault();

        const { store, node } = this.props;
        const model = store.model;
        const val_to_add = opt.val;

        // model.viewValue(node) -> [{id: "foo"}, ...]
        // TODO val.id is hardcoded here
        if (_.some(model.viewValue(node), (val) => val.id === val_to_add)) {
            return;  // already selected
        }

        // TODO transaction
        // TODO more elegant
        // TODO id is hardcoded
        const new_subnode = model.add(node);
        model.setViewValue(new_subnode.children.id, val_to_add);
    },

    onRemoveClicked: function (opt, e) {
        e.preventDefault();

        const { store, node } = this.props;
        const model = store.model;
        const val_to_remove = opt.val;

        model.filter(node, (subnode) =>
            model.viewValue(subnode.children.id) !== val_to_remove);
    },

    _closeMenuIfClickedOutside: function (e) {
        if (clickedOutsideElement(ReactDOM.findDOMNode(this.refs.select), e)
            && this.state.dropdown_open) {
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
