'use strict';


/**
 *
 */
define([
    'lodash',
    'react'
], function (
    lodash,
    React
) {
    /** TODO not yet ready
     *  - call into form for onSubmit etc.
     *  - implement 'submitting' state
     *  - pass whole form state to FormGroups as a prop? to avoid repeating field key many times in form jsx code
     *
     *  props
     *    entityId -- TODO not always possible!
     *
     *  state
     *    mode
     *    model
     */
    var FormMixin = {

        getInitialState: function () {
            return {
                model:    this.props.initialModel || {},
                errors: {}, // {key: 'string', ...}
                dirty: {},  // {key: true}
                submitAttempted: false
            };
        },

        componentWillMount: function () {
            if (_.isUndefined(this.validators)) {
                return;
            }

            _.each(_.keys(this.validators), function (key) {
                var validators = this.validators[key];

                if (!_.isArray(validators)) {
                    this.validators[key] = [validators];
                }
            }, this);
        },

        // validation

        validate: function (key) {
            var model = this.state.model,
                errors = {};

            var runValidators = function (validators, key) {
                _.every(validators, function (validator) {
                    var failed = false;

                    var fail = function (key, msg) {
                        errors[key] = msg;
                        failed = true;
                    };

                    validator(model, key, model[key], fail);

                    return !failed;  // false value stops iteration
                });
            };

            if (key) {
                runValidators(this.validators[key], key);
            } else {
                _.each(_.keys(this.validators), function (key) {
                    runValidators(this.validators[key], key);
                }, this);
            }

            if (_.has(this.validators, '*')) {
                runValidators(this.validators['*'], null);
            }

            this.setState({
                'errors': errors
            });

            return _.isEmpty(errors);
        },

        addValidators: function (key, validators) {
            if (!_.isDefined(this.validators)) {
                this.validators = {};
            }

            if (!_.isDefined(this.validators[key])) {
                this.validators[key] = [];
            }

            this.validators[key] = this.validators[key].concat(validators);
        },

        addServerValidationErrors: function (server_errors) {
            // TODO
        },

        clearErrors: function () {
            this.setState({
                errors: {}
            });
        },

        // TODO do we even need this?
        resetError: function (key) {
            this.setState({
                'errors': _.omit(this.state.errors, key)
            });
        },

        isDirty: function () {
            return !_.isEmpty(this.state.dirty);
        },

        // field api

        fieldShouldShowError: function (key) {
            var is_valid = !_.has(this.state.errors, key),
                is_dirty = _.has(this.state.dirty, key);

            return (!is_valid) && (is_dirty || this.state.submitAttempted);
        },

        fieldMessage: function (key) {
            return this.state.errors[key];
        },

        onFieldValueChanged: function (key, value) {
            //console.log('Form.onFieldValueChanged(): ', key, value);

            this.state.model[key] = value;
            this.state.dirty[key] = true;

            this.setState({
                model: this.state.model,
                dirty: this.state.dirty
            });

            /*
            this.setState(React.addons.update(this.state, {
                model: {$merge: {}},
                dirty: {}
            }));
            */

            this.validate(key);  // TODO
        },

        // form submission

        submitForm: function (e) {
            var c = this,
                p = this.props,
                s = this.state;

            e.preventDefault();

            c.setState({submitAttempted: true});

            if (!this.validate()) {
                console.log('invalid', s.errors);
                c.showNotification('Ошибки в форме', undefined, 'warning');  // TODO list errors!
                return;
            }

           // TODO catch any exceptions!
            c.saveModel();

            // TODO after submit
        },

        // TODO wrap everything in this?
        handleErrors: function (promise) {
            return promise.catch(function () {

            });
        }
    };


    /**
     * methods to be implemented by the user
     *   loadDefaults: function ()
     *   loadEntity: function (entity_id) { return fooStore.loadFoo(entity_id); }
     *   createEntity: function (model) { return fooStore.createFoo(model); }
     *   updateEntity: function (entity_id, model) { return fooStore.updateFoo(entity_id, model); }
     *   afterSaved: function (data)
     */
    var AdminFormMixin = {
        getInitialState: function () {
            return {
                mode:     null,
                entityId: null
            };
        },

        loadModel: function (props) {
            var c = this,
                entity_id = props.params.id;

            console.log("AdminFormMixin loadModel", props.name, props.params);

            if (_.isUndefined(entity_id)) {
                c.setState({
                    mode: 'new',
                    model: c.loadDefaults()  // TODO allow it to return promise?
                });
            } else {
                c.loadEntity(entity_id).then(function (data) {
                    c.setState({
                        mode: 'edit',
                        entityId: entity_id,
                        model: data.data
                    });
                }).catch(function (error) {
                    console.log('loadEntity error:', error);
                    if (error.reason == 'rest-error') {
                        c.showNotification('Ошибка', JSON.stringify(error.json), 'error');  // TODO
                    }
                });
            }
        },

        saveModel: function () {
            var c = this,
                p = this.props,
                s = this.state;

            var promise;
            if (s.mode === 'new') {
                promise = c.createEntity(s.model);
            } else if (s.mode === 'edit') {
                promise = c.updateEntity(s.entityId, s.model);
            } else {
                console.warn('AdminFormMixin.saveModel(): bad s.mode: ', s.mode);
                return;  // ???
            }

            promise.then(function (data) {
                c.showNotification('Объект сохранен', '', 'success');
                c.onSaved && c.onSaved(data);   // TODO
            }).catch(function (error) {
                if (error.reason == 'invalid') {
                    c.showNotification('Ошибки валидации', JSON.stringify(error.json), 'warning');  // TODO
                    c.addServerValidationErrors(error.json.errors);
                } else if (error.reason == 'rest-error') {
                    c.showNotification('Ошибка', JSON.stringify(error.json), 'error');  // TODO
                }
            });
        },

        componentWillMount: function () {
            this.loadModel(this.props);
        },

        componentWillReceiveProps: function (new_props) {
            this.loadModel(new_props);
        }
    };


    var FormGroup = React.createClass({
        propTypes: {
            form:     React.PropTypes.object,
            name:     React.PropTypes.string,
            label:    React.PropTypes.string
        },

        render: function() {
            var c = this,
                p = this.props,
                form = this.props.form,
                name = this.props.name;

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
            var children = p.children;

            var show_error = form.fieldShouldShowError(name);

            var validation_classes = React.addons.classSet({
                'form-group': true,
                'has-error': show_error
            });

            var validation_messages;
            if (show_error) {
                validation_messages = (
                    <div className="help-block animation-slideDown">
                        {form.fieldMessage(name)}
                    </div>
                );
            }

            return (
                <div className={validation_classes}>
                    <label className="col-md-3 control-label" htmlFor="{p.name}">{p.label}</label>
                    <div className="col-md-9">
                        {children}
                        {validation_messages}
                    </div>
                </div>
            );
        }
    });


    // TODO:
    // value (<input>, <textarea>), checked (<input type="checkbox|radio">), selected (<option>)
    // TODO select multiple
    // TODO generae options for <select>

    var InputMixin = {

    };


    var TextInput = React.createClass({
        propTypes: {
            form:     React.PropTypes.object.isRequired,
            name:     React.PropTypes.string.isRequired,
            type:     React.PropTypes.string
        },

        getDefaultProps: function() {
            return {
                type: 'text'
            }
        },

        componentWillMount: function () {
            var c = this,
                form = this.props.form,
                name = this.props.name;

            // TODO form.addValidator(name, required);
        },

        render: function () {
            var c = this,
                p = this.props,
                form = p.form,
                name = p.name;

            var cx = React.addons.classSet;

            // TODO serialize value
            var value = form.state.model[name] || '';

            // TODO class, style, placeholder etc.!
            return (
                <input type={p.type}
                       className="form-control"
                       value={value}
                       onChange={c.onChange}
                       onBlur={c.onBlur} />
            );
        },

        onChange: function (e) {
            var c = this,
                p = this.props,
                form = p.form,
                name = p.name;

            form.onFieldValueChanged(name, e.target.value);
        },

        onBlur: function (e) {
            var form = this.props.form,
                name = this.props.name;

            //console.log('Input.onBlur:', name, e.target.value);
            // TODO form.onFieldValueChanged(name, xxx);
        }
    });


    var Checkbox = React.createClass({
        propTypes: {
            form:     React.PropTypes.object.isRequired,
            name:     React.PropTypes.string.isRequired
        },

        getDefaultProps: function() {
            return {
            }
        },

        componentWillMount: function () {
            var c = this,
                form = this.props.form,
                name = this.props.name;

            // TODO form.addValidator(name, required);
        },

        render: function () {
            var c = this,
                p = this.props,
                form = p.form,
                name = p.name;

            var cx = React.addons.classSet;

            // TODO serialize value
            var value = !!(form.state.model[name]);

            // TODO class, style, placeholder etc.!
            return (
                <input type="checkbox"
                       checked={value}
                       onChange={c.onChange}
                       onBlur={c.onBlur} />
            );
        },

        onChange: function (e) {
            var c = this,
                p = this.props,
                form = p.form,
                name = p.name;

            form.onFieldValueChanged(name, e.target.checked);
        },

        onBlur: function (e) {
            var form = this.props.form,
                name = this.props.name;

            //console.log('Input.onBlur:', name, e.target.value);
            // TODO form.onFieldValueChanged(name, xxx);
        }
    });


    var RadioList = React.createClass({
        propTypes: {
            form:     React.PropTypes.object.isRequired,
            name:     React.PropTypes.string.isRequired,
            options:  React.PropTypes.array.isRequired
        },

        render: function () {
            var c = this,
                form = this.props.form,
                name = this.props.name,
                options = this.props.options;

            var cx = React.addons.classSet;

            // TODO serialize value
            var value = form.state.model[name] || '';

            var options_html = options.map(function (option) {
                return <div className={cx({radio: true, disabled: options.disabled})}>
                    <label>
                        <input type="radio"
                               checked={option.val == value}
                               disabled={options.disabled}
                               onChange={c.onChange.bind(null, option.val)} />
                        {option.label}
                    </label>
                </div>
            });

            // TODO class, style, placeholder etc.!
            return <div>
                {options_html}
            </div>;
        },

        onChange: function (val, e) {
            var form = this.props.form,
                name = this.props.name;

            // TODO deserialize value
            form.onFieldValueChanged(name, val);
        }
    });


    var Textarea = React.createClass({
        propTypes: {
            form:     React.PropTypes.object.isRequired,
            name:     React.PropTypes.string.isRequired
        },

        render: function () {
            var c = this,
                form = this.props.form,
                name = this.props.name;

            // TODO serialize value
            var value = form.state.model[name] || '';

            // TODO class, style, placeholder etc.!
            // onBlur={c.onBlur}
            return (
                <textarea className="form-control"
                          value={value} onChange={c.onChange} />
            );
        },

        onChange: function (e) {
            var form = this.props.form,
                name = this.props.name;

            // TODO deserialize value
            form.onFieldValueChanged(name, e.target.value);
        }
    });


    var Select = React.createClass({
        propTypes: {
            form:     React.PropTypes.object.isRequired,
            name:     React.PropTypes.string.isRequired,
            options:  React.PropTypes.array.isRequired
        },

        render: function () {
            var c = this,
                form = this.props.form,
                name = this.props.name,
                options = this.props.options;

            // TODO serialize value
            var value = form.state.model[name] || '';

            var options_html = options.map(function (option) {
                return <option value={option.val}>{option.label}</option>;
            });

            // TODO class, style, placeholder etc.!
            return (
                <select value={value} onChange={c.onChange} className="form-control">
                    {options_html}
                </select>
            );
        },

        // TODO multiple!!
        onChange: function (e) {
            var form = this.props.form,
                name = this.props.name;

            // TODO deserialize value
            form.onFieldValueChanged(name, e.target.value);
        }
    });


    return {
        FormMixin:         FormMixin,
        AdminFormMixin:    AdminFormMixin,
        FormGroup:         FormGroup,
        TextInput:         TextInput,
        Checkbox:          Checkbox,
        RadioList:         RadioList,
        Textarea:          Textarea,
        Select:            Select
    };
});
