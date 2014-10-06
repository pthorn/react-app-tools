/** @jsx React.DOM */
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
     *   loadstart: function (xhr, file_obj, e)
     *   progress: function (xhr, file_obj, e, percentage)
     *   loadend: function (xhr, file_obj, e)
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

        xhr.addEventListener("loadend", function(e) {
            params.loadend(xhr, file_obj, e);
        }, false);

        // build and send request with form data

        xhr.open('POST', file_obj.upload_url);
        xhr.overrideMimeType('text/plain; charset=x-user-defined-binary'); // ?

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

    /*
    var $$this = this;

    $scope.$apply(function() {
        var image_id  = null,
            image_ext = null;

        if($$this.status == 200) {
            var json_response = $.parseJSON($$this.responseText);

            if(json_response.code === 'not-an-image') {
                file_obj.message = 'Файл не является изображением';
            } else if(json_response.status === 'ok') {
                file_obj.message = 'Файл загружен';
                image_id = json_response.id;
                image_ext = json_response.ext;
            } else {
                file_obj.message = json_response.message ? ('Ошибка: ' + json_response.message) : 'Ошибк загрузки изображения';
            }
        } else {
            file_obj.progress = "Ошибка " + $$this.status;
        }

        file_obj.done = true;

        var all_done = true;

        $.each($scope.files_to_upload, function(i, f) {
            if(f.deferred === file_obj.deferred) {
                all_done = all_done && f.done;
            }
        });

        if(all_done) {
            //$scope.files_to_upload = [];
            file_obj.deferred.resolve(image_id, image_ext);
        }
    });
    */

    /**
     * config:
     *   rest_url   -
     *   upload_url -
     *
     */
    var ImageField = React.createClass({

        propTypes: {
            config: React.PropTypes.object,
            imageInfo: React.PropTypes.object
        },

        getDefaultProps: function () {
            return {
            };
        },

        getInitialState: function () {
            return {
                mode: 'display',
                imageInfo: this.props.imageInfo || {id: null, ext: null},
                progress: null
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

            var render_image = function () {
                var thumb_src = null;
                if (s.imageInfo.id) {
                    thumb_src = c.config.src_prefix + '/' + filename_from_template(c.config.thumb_name_tpl,
                    {$id: s.imageInfo.id, $ext: s.imageInfo.ext});
                }

                return (
                    <div>
                        <input type="file" accept="image/*" onChange={c.onFileSelected}/>
                        {thumb_src && <img src={thumb_src}/>}
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
                    </div>
                );
            };

            var render_progress = function () {
                var width = '' + s.progress + '%';

                return (
                    <div>
                        <div className="progress">
                            <div className="progress-bar progress-bar-striped active" style={{width: width}}>{s.progress}%</div>
                        </div>
                    </div>
                );
            };

            return <div className="rat-image-field">
                {s.mode === 'uploading' ? render_progress() : render_image()}
            </div>;
        },

        componentWillMount: function () {
            var c = this,
                p = this.props;

            this.config = _.extend({
                src_prefix:        '/store',
                thumb_name_tpl:    '$id-thumb.$ext',   // <id>-thumb.jpg
                link_name_tpl:     '$id.$ext',         // <id>.jpg

                upload_url:        '/upload',
                file_param:        'file',
                upload_params:     {},

                show_del_button:   true,               // show delete button
                show_link_button:  true                // show "view original" button
            }, p.config);
        },

        componentDidMount: function () {  // TODO ?
            var c = this;

            var $el = $(this.getDOMNode());
        },

        onFileSelected: function (e) {
            var c = this;

            var file = e.target.files[0],
                file_obj = {
                file: file,
                name: file.name,
                size: human_readable_file_size(file.size),
                upload_url: c.config.upload_url,
                file_param: c.config.file_param || 'file',
                upload_params: c.config.upload_params,
                progress: 'notyetstarted',
                message: '',
                done: false//,
                //deferred: deferred
            };

            console.log('file selected', file);

            c.setState({
                mode: 'uploading',
                progress: null
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

                loadend: function (xhr, file_obj, event) {
                    var resp = $.parseJSON(xhr.responseText);  // TODO catch SyntaxError
                    console.log('loadend', xhr.status, resp);
                    c.setState({
                        mode: 'display',
                        imageInfo: {id: resp.id, ext: resp.ext}
                    });
                }
            });
        },

        onDelete: function () {
            console.log('onDelete');
        },

        onOpenLarge: function () {
            console.log('onOpenLarge');
        }
    });

    return {
        ImageField: ImageField
    }
});
