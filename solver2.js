var _ = require('underscore');
var aspectRatio = require('./lib/aspect-ratio');
var fitInside = require('./lib/fit-inside');
var area = require('./lib/area');

function coverage (outer, inner) {
    return area(inner) / area(outer);
}

function calcLayout(wrapperSize, videoAspectRatio, nVideos) {
    if (nVideos === 0) { return [1, 1]; }

    var wrapperAspectRatio = aspectRatio(wrapperSize);

    var layouts = _.times(nVideos, function (nCols) {
        nCols++;

        return [nCols, Math.ceil(nVideos/nCols)];
    });

    return _.max(layouts, function (layout) {
        return coverage(wrapperSize, fitInside(wrapperSize, (videoAspectRatio * (layout[0] / layout[1]))));
    });
}

module.exports = function solve(size, videoAspectRatio, maxVideos) {
    var results = [];

    return _.times(maxVideos + 1, function (nVideos) {
        return calcLayout(size, videoAspectRatio, nVideos);
    });
};

