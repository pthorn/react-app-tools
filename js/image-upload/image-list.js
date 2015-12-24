'use strict';

import _ from 'lodash';
import React from 'react';
import cx from 'classnames';
import { DragSource, DropTarget } from 'react-dnd';

import { get_url } from './utils';


export const Empty = React.createClass({
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


const imageSource = {
    beginDrag (props) {
        console.log('imageSource.beginDrag:', props);
        return {
            index: props.index
        };
    }
};

const imageTarget = {
    hover (props, monitor, component) {
        const dragIndex = monitor.getItem().index;
        const hoverIndex = props.index;

        //console.log('imageTarget.hover:', monitor.getItem(), dragIndex, hoverIndex, props);

        // Don't replace items with themselves
        if (dragIndex === hoverIndex) {
            return;
        }

        // Determine rectangle on screen
        const hoverBoundingRect = React.findDOMNode(component).getBoundingClientRect();

        // Get vertical middle
        const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        // Get pixels to the top
        const hoverClientX = clientOffset.x - hoverBoundingRect.left;

        // Only perform the move when the mouse has crossed half of the items height
        // When dragging downwards, only move when the cursor is below 50%
        // When dragging upwards, only move when the cursor is above 50%

        // Dragging downwards
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
            return;
        }

        // Dragging upwards
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
            return;
        }

        // Time to actually perform the action
        props.onReorder(dragIndex, hoverIndex);

        // Note: we're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        monitor.getItem().index = hoverIndex;
    }
};


const Image = React.createClass({
    propTypes: {
        id: React.PropTypes.string.isRequired,
        selected: React.PropTypes.bool.isRequired,
        onClick: React.PropTypes.func.isRequired,
        onActionClick: React.PropTypes.func.isRequired,
        config: React.PropTypes.object.isRequired,

        // injected by react-dnd
        isDragging: React.PropTypes.bool.isRequired,
        connectDragSource: React.PropTypes.func.isRequired,
        connectDropTarget: React.PropTypes.func.isRequired
    },

    render: function () {
        const { id, selected, onClick, onActionClick, config,
              isDragging, connectDragSource, connectDropTarget } = this.props;

        var thumb_src = get_url(config.url_prefix, config.image_type,
                                id, config.thumb_variant);

        //width={config.thumb_size[0]}
        //height={config.thumb_size[1]}

        return connectDropTarget(connectDragSource(
            <div className={cx({image: true, selected: selected, dragging: isDragging})}>
                <img src={thumb_src}
                     onClick={onClick} />
                    <div className="buttons">
                        {config.enable_delete &&
                            <a href
                               onClick={onActionClick.bind(null, 'delete')}
                               title="Удалить">
                                <i className="fa fa-times" />
                            </a>
                        }
                        {!_.isUndefined(config.large_variant) &&
                            <a href
                               onClick={onActionClick.bind(null, 'open-large')}
                               title="Открыть оригинал">
                                <i className="fa fa-external-link" />
                            </a>
                        }
                    </div>
            </div>
        ));
    }
});


const ItemTypes = {
    IMAGE: 'image'
};


export const WrappedImage = DropTarget(
    ItemTypes.IMAGE,
    imageTarget,
    connect => ({
        connectDropTarget: connect.dropTarget()
    })
)(DragSource(
    ItemTypes.IMAGE,
    imageSource,
    (connect, monitor) => ({
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    })
)(Image));
