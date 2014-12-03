'use strict';

define([
    'lodash',
    'react'
], function (
    _,
    React
) {

    /**
     * params
     *   loadstart:    function (xhr, file_obj, e)
     *   progress:     function (xhr, file_obj, e, percentage)
     *   uploaded:     function(response, xhr, file_obj, e)
     *   upload_error: function (error_code, error_arg, response, xhr, file_obj, e)
     */
    var upload_file = function(file_obj, params) {
        var xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("loadstart", function (e) {
            params.loadstart(xhr, file_obj, e);
        }, false);

        xhr.upload.addEventListener("progress", function (e) {
            var percentage;
            if (e.lengthComputable) {
                percentage = Math.round((e.loaded * 100) / e.total);
            }
            params.progress(xhr, file_obj, e, percentage);
        });

        xhr.addEventListener("loadend", function (e) {

            if(xhr.status != 200) {
                params.upload_error('http-status', xhr.status, xhr.responseText, xhr, file_obj, e);
                return;
            }

            try {
                var json_response = $.parseJSON(xhr.responseText);
            } catch (err) {
                params.upload_error('json-decode', err, xhr.responseText, xhr, file_obj, e);
                return;
            }

            if (json_response.status === 'ok') {
                params.uploaded(json_response, xhr, file_obj, e);
                return;
            }

            params.upload_error('status', json_response.status, json_response, xhr, file_obj, e);
        }, false);

        // build and send request with form data

        xhr.open('POST', file_obj.upload_url);

        var form_data = new FormData();

        form_data.append(file_obj.file_param, file_obj.file);

        var upload_params = typeof file_obj.upload_params === 'function' ?
            file_obj.upload_params.call($this) : file_obj.upload_params;

        $.each(upload_params, function(k, v) {
            form_data.append(k, v);
        });

        xhr.send(form_data);
    };

    var human_readable_file_size = function(size) {
        if(size > 1024*1024) {
            return (size / (1024*1024)).toFixed(2) + 'M';
        }
        if(size > 1024) {
            return (size / 1024).toFixed(2) + 'K';
        }
        return "" + size;
    };

    var filename_from_template = function (template, subst) {
        var filename = template;
        _.each(subst, function (val, key) {
            filename = filename.replace(key, val);
        });
        return filename;
    };

    var PreviewImage = React.createClass({

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

    var modes = {
        DISPLAY: 'display',
        PREVIEW: 'preview',
        PROGRESS: 'progress',
        ERROR: 'error'
    };

    /**
     * config:
     *   rest_url   -
     *   upload_url -
     *
     */
    var ImageField = React.createClass({

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
            this.refs.fileInput.getDOMNode().click();
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
        doUpload: function (x) {
            var c = this,
                s = this.state;

            console.log('doUpload');

            _.assign(s.file_obj, x);
            c.setState({file_obj: s.file_obj});
            c.uploadFile(s.file_obj);
        }
    });

    return {
        ImageField: ImageField
    }
});
