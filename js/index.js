
define([
    './rest',
    './grid.jsx',
    './form.jsx',
    './validators.js',
    './bootstrap-widgets.jsx',
    './image-upload.jsx',
    './utils',
    '../css/image-upload.scss',
    '../css/grid.scss'
], function (
    Rest,
    Grid,
    Form,
    Validators,
    BootstrapWidgets,
    ImageUpload,
    Utils,
    image_upload_scss,
    grid_scss
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
