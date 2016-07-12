'use strict';

const _ = require('lodash');
const React = require('react');
const ReactDOM = require('react-dom');
const cx = require('classnames');

const handlers = require('./option-handlers');


const List = function (props) {
    const { options, optionHandler: h, onSelected } = props;

    return <ul>
        {options.length > 0 && options.map((opt) =>
            <Row key={h.value(opt)}
                 option={opt}
                 optionHandler={h}
                 onSelected={onSelected} />
        )}
    </ul>;
};


const Row = function (props) {
    const { option, optionHandler: h, onSelected } = props;

    const has_children = h.hasChildren(option);

    return <li className={cx({selectable: !has_children})}
               onClick={has_children ? null : onSelected.bind(null, option)}>
        {has_children &&
            <h6>{h.label(option)}</h6>
        ||
            <span>{h.label(option)}</span>
        }
        {has_children &&
            <List options={h.children(option)}
                  optionHandler={h}
                  onSelected={onSelected} />
        }
    </li>;
};


const DropDown = function (props) {
    const { options, optionHandler, onSelected } = props;

    return <div className="dropdown">
        {options.length > 0 &&
            <List options={options} optionHandler={optionHandler} onSelected={onSelected} />
        ||
            <p>Nothing</p>
        }
    </div>;
};


const SelectedOptions = React.createClass({
    propTypes: {
        selected_options: React.PropTypes.array.isRequired,
        optionHandler: React.PropTypes.object.isRequired,
        onClicked: React.PropTypes.func.isRequired,
        onRemoveClicked: React.PropTypes.func.isRequired,
        inputValue: React.PropTypes.string.isRequired,
        onInputChange: React.PropTypes.func.isRequired,
        onEnter: React.PropTypes.func.isRequired
    },

    render: function () {
        const c = this,
              p = this.props,
              h = p.optionHandler;

        return <ul className="selected"
                   onClick={p.onClicked}>
            {p.selected_options.map((opt) =>
                <li key={h.value(opt)}>
                    <button onClick={p.onRemoveClicked.bind(null, opt)} tabIndex="-1">
                        <i className="fa fa-times" />
                    </button>
                    <span>{h.label(opt)}</span>
                </li>
            )}
            <input type="text"
                   ref="input"
                   value={p.inputValue}
                   onChange={(e) => p.onInputChange(e.target.value)}
                   onKeyPress={c.onKeyPress}
                   onBlur={p.onBlur} />
        </ul>;
    },

    onKeyPress: function (e) {
        const { onEnter } = this.props;

        if (e.key === 'Enter') {
            e.preventDefault();
            onEnter();
        }
    },

    onBlur: function () {
        // TODO ?
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

        const selected_option_ids = c.handler.getSelectedIds(model, node);
        const selected_options = c.handler.getSelected(options, selected_option_ids);
        const filtered_options = c.handler.getFiltered(options, input_value, selected_option_ids);
        //var unselected_options = [];  // TODO!

        return <div ref="select" className="rat-select">
            <SelectedOptions ref="selectedOptions"
                             selected_options={selected_options}
                             optionHandler={c.handler}
                             onClicked={c.onClicked}
                             onRemoveClicked={c.onRemoveClicked}
                             inputValue={input_value}
                             onInputChange={c.onInputChange}
                             onEnter={c.onEnter} />
            {dropdown_open &&
                <DropDown options={filtered_options /*unselected_options*/}
                          optionHandler={c.handler}
                          onSelected={c.onOptionSelected}/>
            }
        </div>;
    },

    onClicked: function (e) {
        const c = this;

        this.refs.selectedOptions.focus();
        c.setState({dropdown_open: !c.state.dropdown_open});
    },

    onOptionSelected: function (opt, e) {
        e.preventDefault();

        const { store, node } = this.props;
        const model = store.model;

        this.handler.select(model, node, opt);
        this.setState({
            dropdown_open: false,
            input_value: ''
        });
    },

    onRemoveClicked: function (opt, e) {
        e.preventDefault();

        const { store, node } = this.props;
        const model = store.model;

        this.handler.deselect(model, node, opt);
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
            this.handler.addNew(model, node, value);
        }

        this.setState({input_value: ''});
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
