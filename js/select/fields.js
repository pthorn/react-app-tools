'use strict';

const _ = require('lodash');
const React = require('react');
const ReactDOM = require('react-dom');

const handlers = require('./option-handlers');


const DropDownList = React.createClass({
    propTypes: {
        options: React.PropTypes.array.isRequired,
        optionHandler: React.PropTypes.object.isRequired,
        onSelected: React.PropTypes.func.isRequired
    },

    render: function () {
        const { options, optionHandler: h, onSelected } = this.props;

        return <ul className="options">
            {options.map((opt) =>
                <li key={h.value(opt)} onClick={onSelected.bind(null, opt)}>
                    {h.label(opt)}
                </li>
            )}
        </ul>;
    }
});


const TwoLevelDropDownList = React.createClass({
    propTypes: {
        options: React.PropTypes.array.isRequired,
        optionHandler: React.PropTypes.object.isRequired,
        onSelected: React.PropTypes.func.isRequired
    },

    render: function () {
        const { options, optionHandler, onSelected } = this.props;

        return <ul>
            {options.map((opts, n) =>
                <li key={n}>
                    <h6>{opts.title}</h6>
                    <DropDownList options={opts.options}
                                  optionHandler={optionHandler}
                                  onSelected={onSelected} />
                </li>
            )}
        </ul>;
    }
});


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
                   value={p.inputValue} onChange={(e) => p.onInputChange(e.target.value)}
                   onBlur={p.onEnter}
                   onKeyPress={c.onKeyPress} />
        </ul>;
    },

    onKeyPress: function (e) {
        const { onEnter } = this.props;

        if (e.key === 'Enter') {
            e.preventDefault();
            onEnter();
        }
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
        //console.log('selected_option_ids', selected_option_ids);

        const selected_options = c.handler.getSelected(options, selected_option_ids);
        //var unselected_options = [];  // TODO!

        return <div ref="select" className="rat-select">
            <SelectedOptions selected_options={selected_options}
                             optionHandler={c.handler}
                             onClicked={(e) => c.setState({dropdown_open: !dropdown_open})}
                             onRemoveClicked={c.onRemoveClicked}
                             inputValue={input_value}
                             onInputChange={c.onInputChange}
                             onEnter={c.onEnter} />
            {dropdown_open &&
                <div className="dropdown">
                    {config.mode === 'two-level' &&
                        <TwoLevelDropDownList options={options /*unselected_options*/}
                                              optionHandler={c.handler}
                                              onSelected={c.onOptionSelected}/>
                    ||
                        <DropDownList options={options /*unselected_options*/}
                                      optionHandler={c.handler}
                                      onSelected={c.onOptionSelected}/>
                    }
                </div>
            }
        </div>;
    },

    onOptionSelected: function (opt, e) {
        e.preventDefault();

        const { store, node } = this.props;
        const model = store.model;

        this.handler.select(model, node, opt);
    },

    onRemoveClicked: function (opt, e) {
        e.preventDefault();

        const { store, node } = this.props;
        const model = store.model;

        this.handler.deselect(model, node, opt);
    },

    onInputChange: function (val) {
        this.setState({input_value: val});
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
        // TODO use this.props.config
        const c = this,
              { config } = this.props;

        c.config = _.extend({
            mode:           'one-level'
        }, config);

        c.handler = ((mode) => {
            if (mode === 'one-level') {
                return new handlers.OneLevelOptionHandler();
            } else if (mode === 'two-level') {
                return new handlers.TwoLevelOptionHandler();
            } else if (mode === 'tags') {
                return new handlers.TagOptionHandler();
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
