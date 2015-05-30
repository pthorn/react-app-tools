'use strict';

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


var SidebarListItem = React.createClass({
    mixins: [ State ],

    render: function () {
        var c = this,
            { children, prefix } = this.props;

        return <li className={cx({active: c.prefixMatches(prefix)})}>
            {children}
        </li>;
    },

    prefixMatches: function (prefix) {
        return this.getPathname().lastIndexOf(prefix, 0) === 0;
    }
});


module.exports = {
    Sidebar: Sidebar,
    SidebarList: SidebarList,
    SidebarListItem: SidebarListItem
};
