'use strict';

var _            = require('lodash');
var EventEmitter = require('eventemitter');
var S            = require('string');
var moment       = require('moment');


function debounce(fn, delay) {
    var timer = null;

    return function () {
        var context = this,
            args = arguments;

        clearTimeout(timer);

        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}

var _Validation = {

    // validation

    _setupValidation: function (options) {
        if (_.isArray(options.validators)) {
            this.validators = options.validators;
        } else {
            this.validators = [];
        }

        if (options.validator !== undefined) {
            this.validators.push(options.validator);
        }

        this.errors = {};
    },

    _validate: function () {
        _.forEach(this.validators, (validator) => validator(this));
    },

    setValid: function (valid, key, message) {
        if (valid) {
            delete this.errors[key];
        } else {
            this.errors[key] = message;
        }
    },

    isValid: function () {  // TODO es6 property?
        return _.isEmpty(this.errors) && _.every(this.children, (child) => child.isValid());
    },

    validationErrors: function () {
        return this.errors;
    },

    // TODO
    validationErrorsDeep: function () {

    }
};



class SimpleModel {
    constructor(options) {

        // http://stackoverflow.com/questions/19965844/lodash-difference-between-extend-assign-and-merge
        this.options = _.extend({}, {
            //initialValue:  undefined,     // initial model value if none is supplied
            //validator:     undefined      // or validators: [ ... ]
            //formatter:   undefined
            // parser:     undefined
            disabled:      false,
            readonly:      false,           // not submitted if true
            //label: 'Логин',
        }, options);

        if (_.isArray(this.options.validators)) {
            this.validators = this.options.validators;
        } else {
            this.validators = [];
        }

        if (this.options.validator !== undefined) {
            this.validators.push(this.options.validator);
        }

        this.errors = {};
        this.parent = null;

        this.reset();
    }

    addedToParent(parent) {
        this.parent = parent;
    }

    //
    // value
    //

    reset() {
        this.setValue(this.options.initialValue === undefined ?
            this.getDefaultValue() : this.options.initialValue);
        this.dirty = false;
    }

    /**
     * note: can return garbage if the model is invalid
     */
    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
        this.viewValue = this.modelToView(value);  // update what user sees

        this.validate();

        if (this.parent) {
            this.parent.childValueChanged(this);
        }
    }

    /** never fails */
    getValueForView() {
        return this.viewValue;
    }

    /**
     * if options.emptyValue is undefined, the model becomes invalid,
     * otherwise it is used
     * TOTO emptyValue is not used anywhere!
     */
    setValueFromView(value) {
        this.viewValue = value;
        this.value = this.viewToModel(value);

        this.validate();
        this.dirty = true;

        if (this.parent) {
            this.parent.childValueChanged(this);
        }
    }

    getValueForJSON() {
        if (this.options.readonly) {
            return undefined;  // MapModel will not include undefined-valued properties into the json output
        }

        return this.modelToJSON(this.value);
    }

    setValueFromJSON(value) {
        this.setValue(this.JSONToModel(value));
    }

    /**
     *  to be overridden in subclasses
     */
    getDefaultValue(value) {
        return null;
    }

    /** viewToModel(viewValue) -> modelValue
     * can call setValid()
     * to be overridden in subclasses
     */
    viewToModel(value) {
        return value;
    }

    /** modelToView(modelValue) -> viewValue
     * to be overridden in subclasses
     */
    modelToView(value) {
        return value;
    }

    /** JSONToModel(JSONValue) -> modelValue
     * to be overridden in subclasses
     */
    JSONToModel(value) {
        return value;
    }

    /** modelToJSON(modelValue) -> JSONValue
     * to be overridden in subclasses
     */
    modelToJSON(value) {
        return value;
    }

    //
    // validation
    //

    setValid(valid, key, message) {
        if (valid) {
            delete this.errors[key];
        } else {
            this.errors[key] = message;
        }
    }

    validate() {
        _.forEach(this.validators, (validator) => validator(this));
    }

    isValid() {  // TODO es6 property?
        return _.isEmpty(this.errors);
    }

    validationErrors() {
        return this.errors;
    }

    //
    // flags
    //

    isDirty() {  // TODO es6 property?
        return this.dirty;
    }

    isDisabled() {
        return this.options.disabled;
    }
}


class StringModel extends SimpleModel {
    constructor(options) {
        super(_.extend({}, {
            trim: false
        }, options));
    }

    getDefaultValue(value) {
        return '';
    }

    modelToView(value) {
        if (value === null) {
            return '';
        }

        return value;
    }

    viewToModel(value) {
        return this.options.trim ? value.trim() : value;
    }
}


class PhoneModel extends SimpleModel {
    //constructor(options) {
    //    super(_.extend({}, {
    //        trim: false
    //    }, options));
    //}

    getDefaultValue(value) {
        return '';
    }

    modelToView(value) {
        if (value === null) {
            return '';
        }

        return value;
    }

    viewToModel(value) {
        if (value === '') {
            this.setValid(true, 'phone');
            return '';
        }

        var val = S(value).strip(' ', '-','(',')');

        if (val.startsWith('8')) {
            val = S('+7' + val.chompLeft('8'));
        }

        val = val.s;

        var re = /^\+7\d{10}$/;
        var is_valid = re.test(val);

        this.setValid(is_valid, 'phone', 'Неверный формат номера телефона'); // TODO message

        return val;
    }
}


class NumberModel extends SimpleModel {
    constructor(options) {
        super(_.extend({}, {
            float: false
        }, options));
    }

    modelToView(value) {
        if (value === null) {
            return '';
        }

        return value.toString();
    }

    viewToModel(value) {
        var result;
        var is_valid;

        if (value.trim() == '') {
            is_valid = true;
            result = null;
        } else {
            result = Number(value);
            is_valid = !isNaN(result);
            if (!this.options.float) {
                is_valid = is_valid && (result | 0) === result;
            }
        }

        this.setValid(is_valid, 'number', 'Number format'); // TODO message
        return result;
    }

    JSONToModel(value) {
        return Number(value);
    }
}


class DateModel extends SimpleModel {
    constructor(options) {
        super(_.extend({}, {
            viewFormat: 'DD.MM.YYYY HH:mm:ss'
        }, options));
    }

    modelToView(value) {
        if (value === null) {
            return '';
        }

        return value.format(this.options.viewFormat);
    }

    viewToModel(value) {
        var result;
        var is_valid;

        if (value.trim() == '') {
            is_valid = true;
            result = null;
        } else {
            result = moment(value, this.options.viewFormat, true);
            is_valid = result.isValid();
        }

        this.setValid(is_valid, 'date', 'Date format'); // TODO message
        return result;
    }

    JSONToModel(value) {
        return moment(value);  // TODO ?
    }

    modelToJSON(value) {
        return value;  // TODO
    }
}


class BooleanModel extends SimpleModel {
    viewToModel(value) {
        return value;
    }

    modelToView(value) {
        return value;
    }

    JSONToModel(value) {
        return value;
    }

    modelToJSON(value) {
        return value;
    }
}


class ListModel {
    constructor(options) {

        // http://stackoverflow.com/questions/19965844/lodash-difference-between-extend-assign-and-merge
        this.options = _.extend({}, {
            create_child: null
            //validator:     undefined      // or validators: [ ... ]
        }, options);

        this.parent = null;
        this.children = [];

        this._setupValidation();

        this.reset();
    }

    addedToParent(parent) {
        this.parent = parent;
    }

    child(path) {
        if (_.isString(path)) {
            path = path.split('.');
        }

        if (path.length === 0) {
            throw new Error('ListModel.child(): path is empty');
        }

        var index = parseInt(path[0], 10);
        path.shift();

        if (index < 0 || index >= this.children.length) {
            throw new Error('ListModel.child(): index out of range');
        }

        var child = this.children[index];

        if (path.length === 0) {
            return child;
        } else {
            return child.child(path);
        }
    }

    childValueChanged(child) {
        this._validate();

        if (this.parent) {
            this.parent.childValueChanged(this);
        }
    }

    nItems() {
        return this.children.length;
    }

    mapItems(fn) {  // TODO useful for MapModel also
        return this.children.map(fn);
    }

    _addChild() {
        var new_child = this.options.create_child();
        this.children.push(new_child);
        new_child.addedToParent(this);
        return new_child;
    }

    addItem() {
        var new_child = this._addChild();

        if (this.parent) {
            this.parent.childValueChanged(this);
        }

        return new_child;
    }

    addItemAt(index, item) {
        this.children.splice(index, 0, item);

        if (this.parent) {
            this.parent.childValueChanged(this);
        }
    }

    moveItem(index_from, index_to) {
        const item = this.children.splice(index_from, 1)[0];
        this.children.splice(index_to, 0, item);

        if (this.parent) {
            this.parent.childValueChanged(this);
        }
    }

    removeItemAt(index) {
        const item = this.children.splice(index, 1);

        if (this.parent) {
            this.parent.childValueChanged(this);
        }

        return item;
    }

    //
    // values
    //

    reset() {
        this.children = [];
    }

    getValue() {
        return this.mapItems((item) => item.getValue());
    }

    getValueForView() {
        return this.mapItems((item) => item.getValueForView());
    }

    getValueForJSON() {
        return this.mapItems((item) => item.getValueForJSON());
    }

    setValueFromJSON(value) {
        if (!_.isArray(value)) {
            console.warn('ListModel.setValueFromJSON(): expected array, got',  value);
            return;
        }

        this.children = [];

        _.each(value, (item) => {
            var child = this._addChild();
            child.setValueFromJSON(item);
        });

        this._validate();
    }

    //
    // validation
    // TODO inherit all this!
    //

    _setupValidation() {
        if (_.isArray(this.options.validators)) {
            this.validators = this.options.validators;
        } else {
            this.validators = [];
        }

        if (this.options.validator !== undefined) {
            this.validators.push(this.options.validator);
        }

        this.errors = {};
    }

    _validate() {
        _.forEach(this.validators, (validator) => validator(this));
    }

    setValid(valid, key, message) {
        if (valid) {
            delete this.errors[key];
        } else {
            this.errors[key] = message;
        }
    }

    isValid() {  // TODO es6 property?
        return _.isEmpty(this.errors) && _.every(this.children, (child) => child.isValid());
    }

    validationErrors() {
        return this.errors;
    }
}


class MapModel {
    constructor(options) {
        this.options = options;

        this.children = {};
        _.each(this.options.children, (child, key) => this.addChild(key, child));

        if (_.isArray(this.options.validators)) {
            this.validators = this.options.validators;
        } else {
            this.validators = [];
        }

        if (this.options.validator !== undefined) {
            this.validators.push(this.options.validator);
        }

        //this.errors = {};  // TODO do we need this
        this.submitAttempted = false;
        this.mode = null;
        this.entityId = null;

        this.parent = null;
        this.throttle = false;
        this.changed_when_throttled = false;
    }

    addedToParent(parent) {
        this.parent = parent;
    }

    child(path) {
        if (_.isString(path)) {
            path = path.split('.');
        }

        if (path.length === 0) {
            throw new Error('MapModel.child(): path is empty');
        }

        var child = this.children[path[0]];
        if (_.isUndefined(child)) {
            throw new Error('MapModel.child(): no child named ' + path);
        }

        path.shift();

        if (path.length === 0) {
            return child;
        } else {
            return child.child(path);
        }
    }

    addChild(key, child) {
        this.children[key] = child;
        child.addedToParent(this);
    }

    childValueChanged(child) {
        this._onChanged();
    }

    reset() {
        _.each(this.children, (child) => child.reset());
        this.submitAttempted = false;
    }

    //
    // value
    //

    getValue(path) {
        return this.child(path).getValue();
    }

    setValue(value) {
        if (!_.isObject(value)) {
            throw new Error('MapModel.setValue(): expected object');
        }

        this._startThrottle();

        _.each(this.children, (child, key) => {
            if (key in value) {
                child.setValue(value[key]);
            }
        });

        this._endThrottle();
    }

    getValueForView(path) {
        return this.child(path).getValueForView();
    }

    setValueFromView(value) {
        if (!_.isObject(value)) {
            throw new Error('MapModel.setValueFromView(): expected object');
        }

        this._startThrottle();

        _.each(this.children, (child, key) => {
            if (key in value) {
                child.setValueFromView(value[key]);
            }
        });

        this._endThrottle();
    }

    getValueForJSON() {
        return _.merge({}, _.mapValues(this.children, (child) => child.getValueForJSON()));
    }

    setValueFromJSON(value) {
        if (!_.isObject(value)) {
            console.warn('MapModel.setValueFromJSON(): expected object, got',  value);
            return;
        }

        //console.log('MapModel.setValueFromJSON()', value);

        this._startThrottle();

        _.each(this.children, (child, key) => {
            if (key in value) {
                //console.log('  MapModel.setValueFromJSON()', value[key]);
                child.setValueFromJSON(value[key]);
            }
        });

        this._endThrottle();
    }

    //
    // validation
    //

    validate() {
        _.forEach(this.validators, (validator) => validator(this));
    }

    isValid(path) {  // TODO es6 property?
        if (_.isEmpty(path)) {
            return _.isEmpty(this.errors) && _.every(this.children, (child) => child.isValid());
        } else {
           return this.child(path).isValid();
        }
    }

    validationErrors(path) {
        return this.child(path).validationErrors();
    }

    //
    // flags
    //

    isDirty(path) {  // TODO es6 property?
        return this.child(path).isDirty(/*TODO rest of the path,*/);
    }

    // TODO no path arg to isValid; call parent when setValid?
    shouldShowError(path) {
        return (!this.isValid(path)) && (this.isDirty(path) || this.submitAttempted);
    }

    isDisabled(path) {
        if (!this.mode) {
            return true;
        }

        return this.child(path).isDisabled();
    }

    setSubmitAttempted() {
        this.submitAttempted = true;
        this._onChanged();
    }

    getMode() {
        return this.mode;
    }

    setMode(mode) {
        this.mode = mode;
        this._onChanged();
    }

    getEntityId() {
        return this.entityId;
    }

    setEntityId(entityId) {
        this.entityId = entityId;
    }

    _onChanged(validate=true) {
        if (this.throttle) {
            this.changed_when_throttled = true;
            return;
        }

        //console.log('_onChanged()');

        if (validate) {
            this.validate();
        }

        if (this.parent) {
            this.parent.childValueChanged(this);
        }

        this.emit('changed');
    }

    _startThrottle() {
        this.throttle = true;
    }

    _endThrottle() {
        this.throttle = false;

        if (this.changed_when_throttled) {
            this._onChanged();
        }

        this.changed_when_throttled = false;
    }
}


class FormModel extends MapModel {
    constructor(options) {
        super(options);

        this.submitAttempted = false;
        this.mode = null;
        this.entityId = null;
    }

    setSubmitAttempted() {
        this.submitAttempted = true;
        this._emitChanged();
    }

    setMode(mode) {
        this.mode = mode;
        this._emitChanged();
    }

    setEntityId(entityId) {
        this.entityId = entityId;
    }
}

_.extend(MapModel.prototype, EventEmitter.prototype);  // TODO FormModel


module.exports = {
    SimpleModel:  SimpleModel,
    StringModel:  StringModel,
    PhoneModel:   PhoneModel,
    NumberModel:  NumberModel,
    DateModel:    DateModel,
    BooleanModel: BooleanModel,
    ListModel:    ListModel,
    MapModel:     MapModel,
    FormModel:    FormModel
};
