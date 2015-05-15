'use strict';


var add_subdomain = function(subdomain) {
    var hostname_split = document.location.hostname.split(".");
    if (hostname_split.length && hostname_split[0] == 'www') {    // TODO
        hostname_split.splice(0, 1); // [xxx, site, com] -> [site, com]
    }
    hostname_split.unshift(subdomain);
    var hostname = hostname_split.join('.');

    if (document.location.port) {
        hostname = hostname + ':' + document.location.port;
    }

    return hostname;
};


module.exports = {
    add_subdomain:     add_subdomain,
    EventMixin:        require('./events').EventMixin,
    showNotification:  require('./notification').showNotification
};