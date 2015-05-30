'use strict';

var _  = require('lodash');
var React = require('react');
var { State,  Link } = require('react-router');
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
 * <SidebarListItem route="messages"> ... </SidebarListItem>
 * <SidebarListItem route={['grid', 'edit']}> ... </SidebarListItem>
 * <SidebarListItem pathRegex={/^\/user/}> ... </SidebarListItem>
 */
var SidebarListItem = React.createClass({
    mixins: [ State ],

    propTypes: {
        pathRegex: React.PropTypes.object,
        route: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.array
        ])
    },

    render: function () {
        var c = this,
            { children } = this.props;

        return <li className={cx({active: c.match()})}>
            {children}
        </li>;
    },

    match: function () {
        var { pathRegex, route } = this.props;

        if (_.isArray(route)) {
            if (!_.every(route, (item) => !_.find(this.getRoutes(), 'name', item))) {
                return true;
            }
        } else  if (!_.isUndefined(route)) {
            if (_.find(this.getRoutes(), 'name', route)) {
                return true;
            }
        }

        if (!_.isUndefined(pathRegex)) {
            if (pathRegex.test(this.getPathname())) {
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
