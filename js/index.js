
define([
    './rest',
    './data',
    './grid/index.js',
    './form.jsx',
    './validators.js',
    './bootstrap-widgets.jsx',
    './image-upload.jsx',
    './sidebar/index.js',
    './utils/index.js',

    '../css/image-upload.scss',
    '../css/grid.scss'
], function (
    Rest,
    Data,
    Grid,
    Form,
    Validators,
    BootstrapWidgets,
    ImageUpload,
    Sidebar,
    Utils,
    image_upload_scss,
    grid_scss
) {
    return {
        Rest:              Rest,
        Data:              Data,
        Grid:              Grid,
        Form:              Form,
        Validators:        Validators,
        BootstrapWidgets:  BootstrapWidgets,
        ImageUpload:       ImageUpload,
        Sidebar:           Sidebar,
        Utils:             Utils
    };
});
