/** @jsx React.DOM */
'use strict';

define([
    'lodash',
    'react'
], function (
    _,
    React
) {
    var Modal = (function () {

        var handlerProps = [
            'handleShow', 'handleShown', 'handleHide', 'handleHidden'
        ];

        var bsModalEvents = {
            handleShow:   'show.bs.modal',
            handleShown:  'shown.bs.modal',
            handleHide:   'hide.bs.modal',
            handleHidden: 'hidden.bs.modal'
        };

        return React.createClass({

            propTypes: {
                backdrop:     React.PropTypes.bool,
                buttons:      React.PropTypes.array,
                handleShow:   React.PropTypes.func,
                handleShown:  React.PropTypes.func,
                handleHide:   React.PropTypes.func,
                handleHidden: React.PropTypes.func,
                keyboard:     React.PropTypes.bool,
                show:         React.PropTypes.bool,
                remote:       React.PropTypes.string
            },

            getDefaultProps: function () {
                return {
                    backdrop: true,
                    buttons: [],
                    keyboard: true,
                    show: true,
                    remote: ''
                }
            },

            render: function () {
                var c = this,
                    p = this.props,
                    s = this.state;

                var buttons = this.props.buttons.map(function(button) {
                    var icon;
                    if (button.icon_class) {
                        icon = <i className={button.icon_class}/>
                    }

                    return (
                        <button type="button" className={'btn btn-' + button.type} onClick={button.handler}>
                            {icon} {button.text}
                        </button>
                    );
                });

                return (
                    <div className="modal fade">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <button type="button" className="close" data-dismiss="modal">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                    <h4 className="modal-title">{p.title}</h4>
                                </div>
                                <div className="modal-body">
                                    {p.children}
                                </div>
                                <div className="modal-footer">
                                    {buttons}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            },

            componentDidMount: function () {
                var $modal = $(this.getDOMNode()).modal({
                    backdrop: this.props.backdrop,
                    keyboard: this.props.keyboard,
                    show: this.props.show,
                    remote: this.props.remote
                });

                handlerProps.forEach(function (prop) {
                    if (this[prop]) {
                        $modal.on(bsModalEvents[prop], this[prop]);  // TODO remove?
                    }
                    if (this.props[prop]) {
                        $modal.on(bsModalEvents[prop], this.props[prop]);
                    }
                }.bind(this));
            },

            componentWillUnmount: function () {
                var $modal = $(this.getDOMNode());

                handlerProps.forEach(function (prop) {
                    if (this[prop]) {
                        $modal.off(bsModalEvents[prop], this[prop]);  // TODO remove?
                    }
                    if (this.props[prop]) {
                        $modal.off(bsModalEvents[prop], this.props[prop]);
                    }
                }.bind(this));
            },

            hide: function () {
                $(this.getDOMNode()).modal('hide');
            },

            show: function () {
                $(this.getDOMNode()).modal('show');
            },

            toggle: function () {
                $(this.getDOMNode()).modal('toggle');
            }
        });
    })();

    var Chosen = React.createClass({
        displayName: 'Chosen',

        componentDidUpdate: function () {
            // chosen doesn't refresh the options by itself, babysit it
            $(this.refs.select.getDOMNode()).trigger('chosen:updated');
        },

        handleChange: function (a, b, c) {
            var selectedValue;

            if (this.props.multiple) {
                var options = this.refs.select.getDOMNode().options;

                selectedValue = [];
                for (var i = 0, l = options.length; i < l; i++) {
                    if (options[i].selected) {
                        selectedValue.push(options[i].value);  //  || opt.text ?
                    }
                }
            } else {
                selectedValue = e.target.value;
            }

            // force the update makes it so that we reset chosen to whatever
            // controlled value the parent dictated
            this.forceUpdate();

            //console.log('Chosen handleChange: a b c:', a, b, c, 'selectedValue', selectedValue);
            this.props.onChange && this.props.onChange({target: {value: selectedValue}});
        },

        componentDidMount: function () {
            var props = this.props;
            var select = $(this.refs.select.getDOMNode());

            select.chosen({
                allow_single_deselect: props.allowSingleDeselect,
                disable_search: props.disableSearch,
                disable_search_threshold: props.disableSearchThreshold,
                display_disabled_options: props.displayDisabledOptions,
                display_selected_options: props.displaySelectedOptions,
                enable_split_word_search: props.enableSplitWordSearch,
                inherit_select_classes: props.inheritSelectClasses,
                max_selected_options: props.maxSelectedOptions,
                no_results_text: props.noResultsText,
                placeholder_text_multiple: props.placeholderTextMultiple,
                placeholder_text_single: props.placeholderTextSingle,
                search_contains: props.searchContains,
                single_backstroke_delete: props.singleBackstrokeDelete,
                width: props.width
            });

            select.on('chosen:maxselected', this.props.onMaxSelected);
            select.on('change', this.handleChange);
        },

        componentWillUnmount: function () {
            $(this.refs.select.getDOMNode()).off('chosen:maxselected change');
        },

        render: function () {
            //return React.DOM.div(null,
            return  this.transferPropsTo(React.DOM.select({ref: "select"}, this.props.children));
            //);
        }
    });


    return {
        Modal:   Modal,
        Chosen:  Chosen
    }
});
