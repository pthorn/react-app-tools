'use strict';

var _ = require('lodash');
var React = require('react');
var cx = require('classnames');

var { upload_file } = require('./uploader');


// TODO not used, remove
var filename_from_template = function (template, subst) {
    var filename = template;
    _.each(subst, function (val, key) {
        filename = filename.replace(key, val);
    });
    return filename;
};


// TODO not used, remove
var PreviewImage = React.createClass({
    propTypes: {
        width: React.PropTypes.number.isRequired,
        height: React.PropTypes.number.isRequired,
        file_obj: React.PropTypes.object.isRequired
    },

    render: function () {
        var c = this,
            p = this.props;

        return (
            <img ref="img" width={p.width} height={p.height} />
        );
    },

    componentDidMount: function () {
        var c = this,
            p = this.props;

        var $img = c.refs.img.getDOMNode();

        // https://developer.mozilla.org/en-US/docs/Web/API/FileReader
        var reader = new FileReader();  // TODO test!

        reader.onload = (function (img) {
            return function (e) {
                img.src = e.target.result;
            };
        })($img);

        reader.readAsDataURL(p.file_obj.file);
    }
});


// TODO remove
var modes = {
    DISPLAY: 'display',
    PREVIEW: 'preview',
    PROGRESS: 'progress',
    ERROR: 'error'
};


/**
 * TODO model and path as per field API
 * TODO no rest url, get list of IDs from the model value

        c.config = _.extend({
            thumb_size:        [125, 125],
            thumb_variant:     'thumb',
            large_variant:     '',

            show_del_button:   true,               // show delete button
            show_link_button:  true                // show "view original" button

            //? get_url: '',
            //? upload_url:        '/upload',
            //? file_param:        'file',
            //? upload_params:     {},
            // TODO validation callback
        }, p.config);

 *
 * config:
 *   rest_url   -
 *   upload_url -
 *
 */
var ImageField_old = React.createClass({
    propTypes: {
        config: React.PropTypes.object,
        imageInfo: React.PropTypes.object,
        onImageSelected: React.PropTypes.func
    },

    getDefaultProps: function () {
        return {
        };
    },

    getInitialState: function () {
        return {
            mode: modes.DISPLAY,
            imageInfo: this.props.imageInfo || {id: null, ext: null},
            file_obj: null,
            progress: null   // TODO remove
        };
    },

    componentWillReceiveProps: function (new_props) {
        console.log('componentWillReceiveProps', new_props);
        this.setState({imageInfo: new_props.imageInfo || {id: null, ext: null}});
    },

    render: function () {
        var c = this,
            s = this.state;

        console.log('image info:', s.imageInfo);

        var render_file_input = function () {
            return <input type="file"
              accept="image/*"
              ref="fileInput"
              onChange={c.onFileSelected} />;
        };

        var render_empty = function () {
            var style = {
                width: c.config.thumb_size[0] + 'px',
                height: c.config.thumb_size[1] + 'px'
            };

            return (
                <div style={style} className="no-image" onClick={c.onSelectFile}>
                    {render_file_input()}
                    <p>Загрузить изображение</p>
                </div>
            );
        };

        var render_preview = function () {
            return (
                <div className="preview">
                    {render_file_input()}
                    <PreviewImage
                        width={c.config.thumb_size[0] + 'px'}
                        height={c.config.thumb_size[1] + 'px'}
                        file_obj={s.file_obj}
                        onClick={c.onSelectFile} />
                </div>
            );
        };

        var render_image = function () {
            var thumb_src = c.config.src_prefix + '/' + filename_from_template(
                c.config.thumb_name_tpl,
                {$id: s.imageInfo.id, $ext: s.imageInfo.ext}
            );

            return (
                <div className="image">
                    {render_file_input()}
                    <img src={thumb_src} onClick={c.onSelectFile} />
                    {(c.config.show_del_button || c.config.show_link_button) &&
                        <div className="buttons">
                        {c.config.show_del_button &&
                            <a href onClick={c.onDelete} title="Удалить">
                                <span className="glyphicon glyphicon-remove gi gi-remove"/>
                            </a>
                        }
                        {c.config.show_link_button &&
                            <a href onClick={c.onOpenLarge} title="Открыть оригинал">
                                <span className="glyphicon glyphicon-new-window gi gi-new_window"/>
                            </a>
                        }
                        </div>
                    }
                </div>
            );
        };

        var render_progress = function () {
            var progress_bar_classes = React.addons.classSet({
                'progress-bar': true,
                'progress-bar-striped': s.progress === 100,
                'active': s.progress === 100
            });

            return (
                <div className="progress-item" onClick={c.onProgressClicked}>
                    <p>{s.file_obj.name} {s.file_obj.size}</p>
                    <div className="progress">
                        <div className={progress_bar_classes} style={{width: s.progress + '%'}}>
                            {s.progress + '%'}
                        </div>
                    </div>
                </div>
            );
        };

        var render_error = function () {
            return (
                <div className="error progress-item" onClick={c.onProgressClicked}>
                    <p>{s.file_obj.name} {s.file_obj.size}</p>
                    <p className="text-danger">{s.message}</p>
                    <div className="progress">
                        <div className="progress-bar progress-bar-striped progress-bar-danger"
                             style={{width: '100%'}}>
                        </div>
                    </div>
                </div>
            );
        };

        var content;
        if (s.mode === modes.DISPLAY && s.imageInfo.id) {
            content = render_image();
        } else if (s.mode === modes.DISPLAY) {
            content = render_empty();
        } else if (s.mode === modes.PREVIEW) {
            content = render_preview();
        } else if (s.mode === modes.PROGRESS) {
            content = render_progress();
        } else if (s.mode === modes.ERROR) {
            content = render_error();
        }

        return <div className="rat-image-field">
            {content}
        </div>;
    },

    componentWillMount: function () {
        var c = this,
            p = this.props;

        c.config = _.extend({
            src_prefix:        '/store',
            thumb_name_tpl:    '$id-thumb.$ext',   // <id>-thumb.jpg
            link_name_tpl:     '$id.$ext',         // <id>.jpg

            upload_url:        '/upload',
            file_param:        'file',
            upload_params:     {},
            // TODO validation callback

            immediate_upload:  true,
            thumb_size:        [125, 125],
            show_del_button:   true,               // show delete button
            show_link_button:  true                // show "view original" button
        }, p.config);
    },

    componentDidMount: function () {  // TODO ?
        var c = this;

        var $el = $(this.getDOMNode());

        // note: on mobile, mouseover fires when element is touched,
        // mouseout fires when a different one is touched

        $el.on('mouseover', 'div.image', function() {
            $('div.buttons', $(this)).show();
        });

        $el.on('mouseout', 'div.image', function() {
            $('div.buttons', $(this)).hide();
        });
    },

    onFileSelected: function (e) {
        var c = this,
            p = this.props;

        var file = e.target.files[0],
            file_obj = {
            file: file,
            name: file.name,
            size: human_readable_file_size(file.size),
            upload_url: c.config.upload_url,
            file_param: c.config.file_param || 'file',
            upload_params: c.config.upload_params,
            progress: 0 // TODO!
        };

        if (c.config.immediate_upload) {
            c.uploadFile(file_obj);
        } else {
            console.log('not immediate upload');
            c.setState({
                mode: modes.PREVIEW,
                file_obj: file_obj,
                progress: 0  // ? waiting for upload
            });

            if (p.onImageSelected) {
                p.onImageSelected();
            }
        }
    },

    uploadFile: function (file_obj) {
        var c = this;

        c.setState({
            mode: modes.PROGRESS,
            file_obj: file_obj,
            progress: 0  // ? waiting for upload
        });

        upload_file(file_obj, {
            loadstart: function (xhr, file_obj, event) {
                console.log('loadstart');
                c.setState({progress: 0});
            },

            progress: function (xhr, file_obj, event, percentage) {
                console.log('progress', percentage);
                c.setState({progress: percentage});
            },

            uploaded: function (resp, xhr, file_obj, event) {
                console.log('uploaded', xhr.status, resp);
                c.setState({
                    mode: modes.DISPLAY,
                    imageInfo: {id: resp.id, ext: resp.ext},
                    file_obj: null
                });
            },

            upload_error: function (error_code, error_arg, response, xhr, file_obj, e) {
                console.log('upload_error', error_code, error_arg, response);

                var message = 'Ошибка загрузки: ' + error_code + ' ' + error_arg;

                if (error_code == 'status' && response.code === 'not-an-image') {
                    message = 'Файл не является изображением';
                } else if (error_code == 'status') {
                    message = response.code || response.message;
                } else if (error_code == 'http-status' && error_arg == 413) {
                    message = 'Файл слишком большой';
                } else if (error_code == 'http-status') {
                    message = 'Ошибка ' + error_arg;
                }

                c.setState({
                    mode: modes.ERROR,
                    message: message
                });
            }
        });
    },

    onSelectFile: function () {
        this.refs.fileInput.getDOMNode().click();  // TODO triggerFileSelect
    },

    onDelete: function () {
        console.log('onDelete');
    },

    onOpenLarge: function () {
        console.log('onOpenLarge');
    },

    onProgressClicked: function () {
        if (this.state.mode === modes.ERROR) {
            this.setState({
                mode: modes.DISPLAY,
                file_obj: null
            });
        }
    },

    // public API
    // TODO not required!
    doUpload: function (x) {
        var c = this,
            s = this.state;

        console.log('doUpload');

        _.assign(s.file_obj, x);
        c.setState({file_obj: s.file_obj});
        c.uploadFile(s.file_obj);
    }
});


///////////////////////////////////////////////////////////////////////////////


// TODO configurable
var DISPLAY_URL = '';
var UPLOAD_URL = '';


var human_readable_file_size = function(size) {
    if(size > 1024*1024) {
        return (size / (1024*1024)).toFixed(2) + 'M';
    }
    if(size > 1024) {
        return (size / 1024).toFixed(2) + 'K';
    }
    return "" + size;
};


var upload_error_message = function (error_code, error_arg, response, xhr, file_obj, e) {
    console.log('upload_error', error_code, error_arg, response);

    var message = 'Ошибка загрузки: ' + error_code + ' ' + error_arg;

    if (error_code == 'status' && response.code === 'not-an-image') {
        message = 'Файл не является изображением';
    } else if (error_code == 'status') {
        message = response.code || response.message;
    } else if (error_code == 'http-status' && error_arg == 413) {
        message = 'Файл слишком большой';
    } else if (error_code == 'http-status') {
        message = 'Ошибка ' + error_arg;
    }

    return message;
};


var get_url = function (prefix, type, id, variant) {
    var url = prefix + '/' + type;

    if (_.isUndefined(id)) {
        return url;
    }

    url = url + '/' + id;

    if (_.isUndefined(variant) || variant === '') {
        return url;
    }

    return url + '/' + variant;
};


var FileInput = React.createClass({
    propTypes: {
        multiple: React.PropTypes.bool.isRequired,
        onFileSelected: React.PropTypes.func.isRequired
    },

    render: function () {
        var { onFileSelected, multiple } = this.props;

        return <input type="file"
            accept="image/*"
            multiple={multiple}
            ref="fileInput"
            onChange={onFileSelected} />;
    },

    triggerFileSelect: function () {
        this.refs.fileInput.getDOMNode().click();
    }
});


var Empty = React.createClass({
    propTypes: {
        config: React.PropTypes.object.isRequired,
        onClick: React.PropTypes.func.isRequired
    },

    render: function () {
        var { config, onClick } = this.props;

        var style = {
            width: config.thumb_size[0] + 'px',
            height: config.thumb_size[1] + 'px'
        };

        return (
            <div style={style} className="no-image" onClick={onClick}>
                <p>Загрузить изображение</p>
            </div>
        );
    }
});


var Image = React.createClass({
    propTypes: {
        id: React.PropTypes.string.isRequired,
        onClick: React.PropTypes.func.isRequired,
        onActionClick: React.PropTypes.func.isRequired,
        config: React.PropTypes.object.isRequired
    },

    render: function () {
        var { id, onClick, onActionClick, config } = this.props;

        var thumb_src = get_url(config.url_prefix, config.image_type,
                                id, config.thumb_variant);

        //width={config.thumb_size[0]}
        //height={config.thumb_size[1]}

        return <div className="image">
            <img src={thumb_src}
                 onClick={onClick} />
                <div className="buttons">
                    {config.enable_delete &&
                        <a href
                           onClick={onActionClick.bind(null, 'delete', id)}
                           title="Удалить">
                            <span className="glyphicon glyphicon-remove gi gi-remove"/>
                        </a>
                    }
                    {!_.isUndefined(config.large_variant) &&
                        <a href
                           onClick={onActionClick.bind(null, 'open-large', id)}
                           title="Открыть оригинал">
                            <span className="glyphicon glyphicon-new-window gi gi-new_window"/>
                        </a>
                    }
                </div>
        </div>;
    }
});


var ProgressItem = React.createClass({
    propTypes: {
        fileObj: React.PropTypes.object.isRequired
    },

    render: function () {
        var { fileObj, onClick } = this.props;

        var progress_bar_classes = React.addons.classSet({
            'progress-bar': true,
            'progress-bar-striped': fileObj.progress === 100,
            'active': fileObj.progress === 100
        });

        return <div className="progress-item" onClick={onClick}>
            <p>{fileObj.name} {fileObj.size}</p>
            <div className="progress">
                <div className={progress_bar_classes} style={{width: fileObj.progress + '%'}}>
                    {fileObj.progress + '%'}
                </div>
            </div>
        </div>;
    }
});


var ProgressItemError = React.createClass({
    propTypes: {
        fileObj: React.PropTypes.object.isRequired,
        onClick: React.PropTypes.func.isRequired
    },

    render: function () {
        var { fileObj, onClick } = this.props;

        return <div className="error progress-item" onClick={onClick}>
            <p>{fileObj.name} {fileObj.size}</p>
            <p className="text-danger">{fileObj.message}</p>
            <div className="progress">
                <div className="progress-bar progress-bar-striped progress-bar-danger"
                     style={{width: '100%'}}>
                </div>
            </div>
        </div>;
    }
});


/**
 * model: RAT.Form.FormModel instance,
 * path: path to field in the model
 * config:{
 *     gallery:           false,
 *     thumb_size:        [125, 125],
 *     thumb_variant:     'thumb',
 *     large_variant:     '',
 *     handler_url:       '',  // /rest/image; GET /rest/image/{id}[/{variant}] redirects to image, POST /rest/image uploads, DELETE /rest/image/{id} deletes
 *     image_type:        '',
 *     upload_params:     {},
 *     enable_delete:   true,  TODO custom actions?
 *     file_param:        'file',
 *     // TODO validation callback
 * }
 *
 * File ID or list of IDs is obtained from the model.
 */
export var ImageField = React.createClass({
    propTypes: {
        model: React.PropTypes.object.isRequired,
        path: React.PropTypes.string.isRequired,
        config: React.PropTypes.object.isRequired
    },

    getInitialState: function () {
        return {
            files_being_uploaded: []
        }
    },

    render: function () {
        var c = this,
            s = this.state;
        var { model, path } = this.props;

        var files = model.child(path).getValueForView();
        console.log('files:', files);

        var show_empty = c.config.gallery || files.length == 0;

        return <div className="rat-image-field">
            <FileInput ref="file_input"
                       multiple={c.config.gallery}
                       onFileSelected={c.onFileSelected} />

            {s.files_being_uploaded.length > 0 &&
                <div className="progress-block">
                    {s.files_being_uploaded.map((file_obj) =>
                        file_obj.error ? <ProgressItemError fileObj={file_obj}
                                                            onClick={c.onProgressClicked}/>
                            : <ProgressItem fileObj={file_obj}/>)
                    }
                </div>
            }

            <div className="gallery">
                {files.map((file) =>
                    <Image key={file.id}
                           id={file.id}
                           onClick={c.onImageClicked}
                           onActionClick={c.onImageActionClicked}
                           config={c.config} />)
                }
                {show_empty &&
                    <Empty onClick={c.onEmptyClicked} config={c.config} />
                }
            </div>
        </div>;
    },

    uploadFile: function (file_obj) {
        var c = this,
            { model, path } = c.props,
            s = this.state;

        s.files_being_uploaded.push(file_obj);
        c.setState({files_being_uploaded: s.files_being_uploaded});

        upload_file(file_obj, {
            loadstart: function (xhr, file_obj, event) {
                console.log('loadstart');
                file_obj.progress = 0;
                c.setState({files_being_uploaded: s.files_being_uploaded});
            },

            progress: function (xhr, file_obj, event, percentage) {
                console.log('progress', percentage);
                file_obj.progress = percentage;
                c.setState({files_being_uploaded: s.files_being_uploaded});
            },

            uploaded: function (resp, xhr, file_obj, event) {
                console.log('uploaded', xhr.status, resp);

                if (resp.status === 'ok') {
                    var list_model = model.child(path);
                    list_model.addItem().setValueFromView(resp.data);  // TODO two changed signals -> empty child is seen
                    _.remove(s.files_being_uploaded, (obj) => obj === file_obj);
                } else {
                    // TODO
                }

                c.setState({files_being_uploaded: s.files_being_uploaded});
            },

            upload_error: function (error_code, error_arg, response, xhr, file_obj, e) {
                console.log('upload_error', error_code, error_arg, response);

                file_obj.error = true;
                file_obj.message = upload_error_message(error_code, error_arg, response, xhr, file_obj, e);
                c.setState({files_being_uploaded: s.files_being_uploaded});
            }
        });
    },

    onFileSelected: function (e) {
        var c = this;

        _.each(e.target.files, function (file) {
            var file_obj = {
                file: file,
                name: file.name,
                size: human_readable_file_size(file.size),
                upload_url: get_url(c.config.url_prefix, c.config.image_type),
                file_param: c.config.file_param,
                upload_params: c.config.upload_params,
                progress: null,  // TODO visual difference between null (not yet started) & 0?
                message: '',
                error: false
            };

            c.uploadFile(file_obj);
        });
    },

    onEmptyClicked: function () {
        this.refs.file_input.triggerFileSelect();
    },

    onImageClicked: function () {
        //
    },

    onImageActionClicked: function (action, image_id, e) {
        e.preventDefault();
        console.log('onImageActionClicked', action, image_id);

        var c = this,
            { model, path } = c.props;

        var list_model = model.child(path);

        if (action === 'delete') {
            _.each(list_model.getValue(), (item, i) => {
                if (item.id === image_id) {
                    list_model.removeItemAt(i);
                }
            });
        }

        if (action === 'open-large') {
            var large_src = get_url(c.config.url_prefix, c.config.image_type,
                                    image_id, c.config.large_variant);

            window.open(large_src, '_blank');
        }
    },

    onProgressClicked: function () {
        //
    },

    componentWillMount: function () {
        var { config } = this.props;

        this.config = _.extend({
            url_prefix:     undefined,
            image_type:     undefined,

            gallery:        false,
            thumb_size:     [125, 125],
            thumb_variant:  'thumb',
            large_variant:  undefined,

            upload_params:  {},
            file_param:     'file',

            enable_delete:  true
            // TODO validation callback
        }, config);

        if (_.isUndefined(this.config.url_prefix)) {
            throw new Error('ImageField: config.url_prefix must be specified');
        }

        if (_.isUndefined(this.config.image_type)) {
            throw new Error('ImageField: config.image_type must be specified');
        }
    }
});
