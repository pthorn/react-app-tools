'use strict';

const _ = require('lodash');
const React = require('react');
const ReactDOM = require('react-dom');
const cx = require('classnames');

const handlers = require('./handlers');


const List = function (props) {
    const { options, common } = props;
    const h = common.optionHandler;

    return <ul>
        {options.length > 0 && options.map((opt) =>
            <Row key={h.value(opt)}
                 option={opt}
                 common={common} />
        )}
    </ul>;
};


const Row = function (props) {
    const { option, common } = props;
    const h = common.optionHandler;

    const has_children = h.hasChildren(option);

    return <li className={cx({selectable: !has_children})}
               onClick={has_children ? null : common.onOptionSelected.bind(null, option)}>
        {has_children &&
            <h6>{h.label(option)}</h6>
        ||
            <span>{h.label(option)}</span>
        }
        {has_children &&
            <List options={h.children(option)}
                  common={common} />
        }
    </li>;
};


const DropDown = function (props) {
    const { options, common } = props;

    return <div className="dropdown">
        {options.length > 0 &&
            <List options={options} common={common} />
        ||
            <p>Nothing</p>
        }
    </div>;
};


const SelectedOption = function (props) {
    const { selected_options, common } = props;
    const h = common.optionHandler;

    const opt = selected_options.length > 0 ? selected_options[0] : null;

    return <ul className="selected single"
               onClick={common.onClicked}>
        {opt &&
            <span className="single">{h.label(opt)}</span>
        ||
            <span className="single">----</span>
        }
    </ul>;
};


const SelectedOptions = React.createClass({
    propTypes: {
        selected_options: React.PropTypes.array.isRequired,
        inputValue: React.PropTypes.string.isRequired,
        common: React.PropTypes.object.isRequired
    },

    render: function () {
        const c = this,
              { selected_options, inputValue, common } = this.props,
              h = common.optionHandler;

        return <ul className="selected"
                   onClick={common.onClicked}>
            {selected_options.map((opt) =>
                <li key={h.value(opt)}>
                    <button onClick={common.onRemoveClicked.bind(null, opt)} tabIndex="-1">
                        <i className="fa fa-times" />
                    </button>
                    <span>{h.label(opt)}</span>
                </li>
            )}
            <input type="text"
                   ref="input"
                   value={inputValue}
                   onChange={(e) => common.onInputChange(e.target.value)}
                   onKeyPress={c.onKeyPress}
                   onKeyDown={c.onKeyDown} />
        </ul>;
    },

    onKeyPress: function (e) {
        const { onEnter } = this.props.common;

        if (e.key === 'Enter') {
            e.preventDefault();
            onEnter();
        }
    },

    onKeyDown: function (e) {
        const { onEnter } = this.props.common;

        if (e.key === 'Tab') {  //  || e.key === ' '
            onEnter();
        }
    },

    // instance API
    focus: function () {
        ReactDOM.findDOMNode(this.refs.input).focus();
    }
});


const clickedOutsideElement = function (element, event) {
    var eventTarget = (event.target) ? event.target : event.srcElement;

    while (eventTarget != null) {
        if (eventTarget === element) return false;
        eventTarget = eventTarget.offsetParent;
    }

    return true;
};


export const MultiSelect = React.createClass({
    propTypes: {
        store:    React.PropTypes.object.isRequired,
        node:     React.PropTypes.object.isRequired,
        options:  React.PropTypes.array.isRequired,
        config:   React.PropTypes.object
    },

    getDefaultProps: function () {
        return {
            config: {}
        };
    },

    getInitialState: function () {
        return {
            input_value: '',
            dropdown_open: false
        }
    },

    render: function () {
        const c = this;
        const { store, node, options, config } = c.props;
        const model = store.model;
        const { input_value, dropdown_open } = c.state;

        const selected_option_ids = c.model_handler.getSelectedIds(model, node);
        const selected_options = c.handler.getSelected(options, selected_option_ids);
        const filtered_options = c.handler.getFiltered(options, input_value, selected_option_ids);
        //var unselected_options = [];  // TODO!

        const common = {
            optionHandler: c.handler,
            onClicked: c.onClicked,
            onOptionSelected: c.onOptionSelected,
            onRemoveClicked: c.onRemoveClicked,
            onInputChange: c.onInputChange,
            onEnter: c.onEnter
        };

        return <div ref="select" className="rat-select">
            {c.config.model === 'simple' &&
                <SelectedOption selected_options={selected_options}
                                common={common} />
            ||
                <SelectedOptions ref="selectedOptions"
                                 selected_options={selected_options}
                                 inputValue={input_value}
                                 common={common} />
            }
            {dropdown_open &&
                <DropDown options={filtered_options /*unselected_options*/}
                          common={common} />
            }
        </div>;
    },

    onClicked: function (e) {
        const c = this;

        this.refs.selectedOptions && this.refs.selectedOptions.focus();
        c.setState({dropdown_open: !c.state.dropdown_open});
    },

    onOptionSelected: function (opt, e) {
        e.preventDefault();

        const { store, node } = this.props;
        const model = store.model;

        this.model_handler.select(model, node, opt);
        this.setState({
            dropdown_open: false,
            input_value: ''
        });
    },

    onRemoveClicked: function (opt, e) {
        e.preventDefault();

        const { store, node } = this.props;
        const model = store.model;

        this.model_handler.deselect(model, node, opt);
    },

    onInputChange: function (val) {
        this.setState({
            dropdown_open: true,
            input_value: val
        });
    },

    onEnter: function () {
        const { store, node } = this.props;
        const model = store.model;
        const value = this.state.input_value;

        if (this.config.mode === 'tags' && value) {
            this.model_handler.addNew(model, node, value);
        }

        this.setState({
            input_value: '',
            dropdown_open: false
        });
    },

    _closeMenuIfClickedOutside: function (e) {
        if (clickedOutsideElement(ReactDOM.findDOMNode(this.refs.select), e)
            && this.state.dropdown_open) {
            this.setState({dropdown_open: false});
        }
    },

    componentWillMount: function () {
        const c = this,
              { config } = this.props;

        c.config = _.extend({
            mode: 'hierarchy',
            model: config.mode === 'tags' ? 'flat' : 'objects',
            model_id_key: 'id',
            option_label_key: 'label',
            option_value_key: 'val',
            option_children_key: 'children',
            filter_options_by_user_input: false
        }, config);

        c.handler = ((mode) => {
            if (mode === 'hierarchy') {
                return new handlers.HierarchicalOptionHandler(c.config);
            } else if (mode === 'tags') {
                return new handlers.TagOptionHandler(c.config);
            } else {
                throw new Error('MultiSelect: bad config.mode');
            }
        })(c.config.mode);

        c.model_handler = ((model) => {
            if (model === 'objects') {
                return new handlers.ObjectListModelHandler(c.config, c.handler);
            } else if (model === 'flat') {
                return new handlers.FlatListModelHandler(c.config, c.handler);
            } else if (model === 'simple') {
                return new handlers.SimpleIDModelHandler(c.config, c.handler);
            } else {
                throw new Error('MultiSelect: bad config.model');
            }
        })(c.config.model);
    },

    componentWillReceiveProps: function () {
    },

    componentDidMount: function () {
        document.addEventListener('click', this._closeMenuIfClickedOutside);
    },

    componentWillUnmount: function() {
        document.removeEventListener('click', this._closeMenuIfClickedOutside);
    }
});
