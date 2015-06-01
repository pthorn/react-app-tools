'use strict';

var _            = require('lodash');
var EventEmitter = require('eventemitter');
var moment       = require('moment');

class SimpleModel {
    constructor(options) {
        // http://stackoverflow.com/questions/19965844/lodash-difference-between-extend-assign-and-merge
        this.options = _.extend({}, {
            //initialValue:  undefined,     // initial model value if none is supplied
            //emptyValue:    undefined,     // default model value that is set if user input is '' or null
            disabled:      false,
            readonly:      false,           // not submitted if true
            //validator:     undefined      // or validators: [ ... ]
            //label: 'Логин',
            //options: xxx
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

        this.reset();
    }

    /**
     * note: can return garbage if the model is invalid
     */
    getValue() {
        return this.value;
    }

    reset() {
        this.setValue(this.options.initialValue === undefined ?
            this.getDefaultValue() : this.options.initialValue);
        this.dirty = false;
    }

    setValue(value) {
        this.value = value;
        this.viewValue = this.modelToView(value);
        this.validate();
    }

    /** never fails */
    getValueForView() {
        return this.viewValue;
    }

    /**
     * if options.emptyValue is undefined, the model becomes invalid,
     * otherwise it is used
     */
    setValueFromView(value) {
        this.viewValue = value;
        this.value = this.viewToModel(value);
        this.validate();
        this.dirty = true;
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

    isDirty() {  // TODO es6 property?
        return this.dirty;
    }

    isDisabled() {
        return this.options.disabled;
    }

    //isSubmitAttempted();
    //shouldDisplayValidationErrors();  // see ...
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

class NumberModel extends SimpleModel {
    constructor(options) {
        super(_.extend({}, {
            trim: false
        }, options));

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt
        this.re = /^(\-|\+)?([0-9]+|Infinity)$/;
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
            is_valid = this.re.test(value);
            if (is_valid) {
                result = Number(value);
            }
        }

        this.setValid(is_valid, 'number', 'Number format'); // TODO message
        return result;
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
    constructor(options) {
        super(_.extend({}, {
            viewFormat: 'DD.MM.YYYY HH:mm:ss'
        }, options));
    }

    viewToModel(value) {
        return this.options.trim ? value.trim() : value;
    }

    modelToView(value) {
        return value.format(this.options.viewFormat);
    }

    JSONToModel(value) {
        return moment(value);  // TODO ?
    }

    modelToJSON(value) {
        return value;  // TODO
    }
}

class ListModel {
    addItem() {

    }

    deleteItem(index) {

    }

    getValueForJSON() {
        return _.map(this.items, (item) => item.getValueForJSON());
    }
}

class MapModel {
    constructor(options) {
        this.options = options;

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
    }

    child(path) {
        if (!this.options.children.hasOwnProperty(path)) {
            throw new Error('MapModel: no child named ' + path);
        }

        return this.options.children[path];  // TODO actual path
    }

    reset() {
        _.each(this.options.children, (child) => child.reset());
        this.submitAttempted = false;
    }


    getValueForView(path) {
        return this.child(path).getValueForView(/*TODO rest of the path*/);
    }

    /** x */
    setValueFromView(path, value) {
        this.child(path).setValueFromView(/*TODO rest of the path,*/ value);
        this.validate();
        this.emit('changed');
    }

    getValueForJSON() {
        return _.merge({}, _.mapValues(this.options.children, (child) => child.getValueForJSON()));
    }

    setValueFromJSON(value) {
        _.each(this.options.children, (child, key) => {
            if (key in value) {
                child.setValueFromJSON(value[key]);
            }
        });

        this.validate();
        this.emit('changed');
    }

    // TODO when will this run?
    validate() {
        //_.forEach(this.options.children, (child) => child.validate());  // mult-field validators!
        _.forEach(this.validators, (validator) => validator(this));
    }

    isValid(path) {  // TODO es6 property?
        if (_.isEmpty(path)) {
            return _.isEmpty(this.errors) && _.every(this.options.children, (child) => child.isValid());
        } else {
           return this.child(path).isValid(/*TODO rest of the path,*/);
        }
    }

    validationErrors(path) {
        return this.child(path).validationErrors(/*TODO rest of the path,*/);
    }

    isDirty(path) {  // TODO es6 property?
        return this.child(path).isDirty(/*TODO rest of the path,*/);
    }

    shouldShowError(path) {
        return (!this.isValid(path)) && (this.isDirty(path) || this.submitAttempted);
    }

    isDisabled(path) {
        if (!this.mode) {
            return true;
        }

        return this.child(path).isDisabled(/*TODO rest of the path,*/);
    }

    setSubmitAttempted() {
        this.submitAttempted = true;
        this.emit('changed');
    }

    setMode(mode) {
        this.mode = mode;
        this.emit('changed');
    }

    setEntityId(entityId) {
        this.entityId = entityId;
    }
}

_.extend(MapModel.prototype, EventEmitter.prototype);


module.exports = {
    SimpleModel:  SimpleModel,
    StringModel:  StringModel,
    NumberModel:  NumberModel,
    DateModel:    DateModel,
    BooleanModel: BooleanModel,
    ListModel:    ListModel,
    MapModel:     MapModel
};