'use strict';

var _  = require('lodash');
var RSVP = require('rsvp');
var EventEmitter = require('eventemitter');
var { showNotification } = require('../utils');


class FormStore {
    constructor(options) {
        this.options = options; // {entity, rest, model}

        if (!_.isObject(this.options.model)) {
            throw new Error('FormStore: bad options.model');
        }
        this.model = this.options.model;

        if (!_.isObject(this.options.rest)) {
            throw new Error('FormStore: bad options.rest');
        }
        this.rest = this.options.rest;

        if (!_.isString(this.options.entity)) {
            throw new Error('FormStore: bad options.entity');
        }
        this.entity = this.options.entity;
    }

    getModel() {
        return this.model;
    }

    start(mode, entity_id) {
        var x = {
            'new': this.loadNew,
            'edit':this.loadForIdReturnPromise
        };

        var promise = x[mode].call(this, entity_id);

        promise.then((data) => {
            this.model.setMode(mode);

            if (data) {
                this.model.setValueFromJSON(data.data);
            }

            if (entity_id) {
                this.model.setEntityId(entity_id);
            }
        }).catch((error) => {
            if (error.reason == 'rest-error') {
                showNotification('Ошибка', JSON.stringify(error.json), 'error');
            } else {
                console.log('FormStore.start(): promise error:', error);
            }
        });
    }

    submit() {
        this.model.setSubmitAttempted();

        if (!this.model.isValid()) {
            showNotification('Ошибки в форме', '', 'warning');  // TODO list errors!
            return;
        }

        var x = {
            'new': this.saveNewReturnPromise,
            'edit':this.saveForIdReturnPromise
        };

        var promise = x[this.model.mode].call(this, this.model.getValueForJSON(), this.model.entityId);

        promise.then((data) => {
            if (data.status === 'ok') {
                showNotification('Объект сохранен', '', 'success');
                this.emit('saved', data);
            } else if (data.code === 'invalid') {
                showNotification('Ошибки валидации', JSON.stringify(data.errors), 'warning');
                // TODO !!! c.addServerValidationErrors(error.json.errors);
            } else {
                showNotification('Ошибка', JSON.stringify(data), 'error');
            }
        }).catch((error) => {
            showNotification('Ошибка', JSON.stringify(error.json), 'error');
        });
    }

    loadNew() {
        return new RSVP.Promise((resolve, reject) => {
            this.model.reset();
            resolve();
        });
    }

    loadForIdReturnPromise(entity_id) {
        return this.rest.getEntityById(this.entity, entity_id);
    }

    saveNewReturnPromise(data) {
        return this.rest.createEntity(this.entity, data);
    }

    saveForIdReturnPromise(data, entity_id) {
        return this.rest.updateEntityForId(this.entity, entity_id, data);
    }
}

_.extend(FormStore.prototype, EventEmitter.prototype);


module.exports = {
    FormStore: FormStore
};