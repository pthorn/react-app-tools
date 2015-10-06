'use strict';

var _ = require('lodash');
var React = require('react');
var cx = require('classnames');

var { upload_file } = require('./uploader');


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
        selected: React.PropTypes.bool.isRequired,
        onClick: React.PropTypes.func.isRequired,
        onActionClick: React.PropTypes.func.isRequired,
        config: React.PropTypes.object.isRequired
    },

    render: function () {
        var { id, selected, onClick, onActionClick, config } = this.props;

        var thumb_src = get_url(config.url_prefix, config.image_type,
                                id, config.thumb_variant);

        //width={config.thumb_size[0]}
        //height={config.thumb_size[1]}

        return <div className={cx({image: true, selected: selected})}>
            <img src={thumb_src}
                 onClick={onClick} />
                <div className="buttons">
                    {config.enable_delete &&
                        <a href
                           onClick={onActionClick.bind(null, 'delete')}
                           title="Удалить">
                            <span className="glyphicon glyphicon-remove gi gi-remove"/>
                        </a>
                    }
                    {!_.isUndefined(config.large_variant) &&
                        <a href
                           onClick={onActionClick.bind(null, 'open-large')}
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
        config: React.PropTypes.object.isRequired,
        onImageSelected: React.PropTypes.func
    },

    getInitialState: function () {
        return {
            selected_image_index: null,
            files_being_uploaded: []
        }
    },

    render: function () {
        var c = this,
            s = this.state;
        var { model, path } = this.props;

        var file_list_model = model.child(path);
        //console.log('files:', file_list_model);

        var show_empty = c.config.gallery || file_list_model.nItems() === 0;

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
                {file_list_model.mapItems((file_model, n) => {
                    var file_id = file_model.child('id').getValue();
                    //console.log('MAPITEMS', n, file_id, file_model);
                    return <Image key={file_id}
                                  id={file_id}
                                  selected={n === s.selected_image_index}
                                  onClick={c.onImageClicked.bind(null, n, file_id)}
                                  onActionClick={c.onImageActionClicked.bind(null, n, file_id)}
                                  config={c.config} />;
                })}
                {show_empty &&
                    <Empty onClick={c.onEmptyClicked} config={c.config} />
                }
            </div>
        </div>;
    },

    uploadFile: function (file_obj) {
        var c = this,
            { model, path } = c.props,
            list_model = model.child(path),
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
                    list_model.addItem().setValueFromJSON(resp.data);
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

    onImageClicked: function (index, file_id) {
        var { model, path, onImageSelected } = this.props;

        this.setState({selected_image_index: index});

        if (onImageSelected) {
            onImageSelected(model, path, index, file_id);
        }
    },

    onImageActionClicked: function (n, image_id, action, e) {
        e.preventDefault();
        //console.log('onImageActionClicked', arguments);

        var c = this,
            { model, path } = c.props;

        var list_model = model.child(path);

        if (action === 'delete') {
            list_model.removeItemAt(n);
            return;
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
