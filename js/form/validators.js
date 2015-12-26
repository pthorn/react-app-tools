'use strict';

var _ = require('lodash');

var Required = function (message) {
    message = message || 'Field is required';

    return function (model) {
        // TODO '' is for StringModel, null for everything else, what about string list?
        // TODO should implement and use isEmptyValue()?
        var invalid = model.getValue() === null || model.getValue() === '';
        model.setValid(!invalid, 'required', message);
    };
};

var Identifier = function (message) {
    var re = /^[A-Za-z0-9_\.-]+$/;
    message = message || 'Invalid identifier';

    return function (model) {
        var valid = model === '' || re.test(model.getValue());
        model.setValid(valid, 'identifier', message);
    };
};

var URL = function (message) {

};

var Email = function (message) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    message = message || 'Invalid email address';

    return function (model) {
        const val = model.getValue();

        if (!val) {
            model.setValid(true, 'email');
            return;
        }

        const valid = re.test(val);
        model.setValid(valid, 'email', message);
    }
};

var PasswordsMatch = function (path1, path2, message) {
    var message = message || 'Passwords do not match';

    return function (model) {
        //console.log('PasswordsMatch: model =', model);

        var valid = model.child(path1).getValue() === model.child(path2).getValue();

        model.child(path1).setValid(valid, 'passwords-match', message);
        model.child(path2).setValid(valid, 'passwords-match', message);
    }
};

module.exports = {
    Required: Required,
    Identifier: Identifier,
    URL: URL,
    Email: Email,
    PasswordsMatch: PasswordsMatch
};
