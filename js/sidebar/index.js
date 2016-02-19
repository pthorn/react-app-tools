'use strict';

var _  = require('lodash');
var React = require('react');
var cx = require('classnames');


var Sidebar = React.createClass({
    render: function () {
        var { children } = this.props;

        return <div className="col-sm-3 col-md-2 sidebar">
            {children}
        </div>;
    }
});


var SidebarList = React.createClass({
    render: function () {
        var { children } = this.props;

        return <ul className="nav nav-sidebar">
            {children}
        </ul>;
    }
});


/**
 * <SidebarListItem pathRegex={/^\/user/}> ... </SidebarListItem>
 */
var SidebarListItem = React.createClass({
    contextTypes: {
        location: React.PropTypes.object
    },

    propTypes: {
        pathRegex: React.PropTypes.object
    },

    render: function () {
        var c = this,
            { children } = this.props;

        return <li className={cx({active: c.match()})}>
            {children}
        </li>;
    },

    match: function () {
        const { pathRegex } = this.props;
        const { location } = this.context;

        if (!_.isUndefined(pathRegex)) {
            if (pathRegex.test(location.pathname)) {
                return true;
            }
        }

        return false;
    }
});


module.exports = {
    Sidebar: Sidebar,
    SidebarList: SidebarList,
    SidebarListItem: SidebarListItem
};
