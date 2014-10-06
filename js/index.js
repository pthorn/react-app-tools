
define([
    './rest',
    './grid.jsx',
    './form.jsx',
    './validators.js',
    './bootstrap-widgets.jsx',
    './image-upload.jsx',
    './utils'
], function (
    Rest,
    Grid,
    Form,
    Validators,
    BootstrapWidgets,
    ImageUpload,
    Utils
) {

    return {
        Rest:              Rest,
        Grid:              Grid,
        Form:              Form,
        Validators:        Validators,
        BootstrapWidgets:  BootstrapWidgets,
        ImageUpload:       ImageUpload,
        Utils:             Utils
    };
});
