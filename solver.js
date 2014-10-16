var wrapper = [ 400, 500 ];
var videoAspect = 6/4;
var nVideos;
var _ = require('underscore');

var area = require('./lib/area');
var fitInside = require('./lib/fit-inside');

//assuming rows are aligned
function coverage(wrapper, videos) {
    var video = videos[0][0];
    return area(video) / area(wrapper);
}

module.exports = function (wrapper, ratio, nVideos, done) {
    if (nVideos === 1) {
        return done(null, [[fitInside(wrapper, [ratio, 1])]]);
    }

    var colsRange = nVideos;
    var layouts = [];
    for (var i=1; i<=colsRange; i++) {
        layouts.push([
            i,
            Math.ceil(colsRange/i)
        ]);
    }

    var sizes = layouts.map(function (layout) {
        var outerSize = fitInside(wrapper, [ratio * (layout[0]/layout[1]), 1]);
        return [outerSize[0]/layout[0], outerSize[1]/layout[1]];
    });

    var bestLayout = _.max(layouts, function (layout, i) {
        var coverage = (area(sizes[i]) * nVideos) / area(wrapper);
        return coverage;
    });

    var bestSize = sizes[ _.indexOf(layouts, bestLayout) ];

    var xpad = wrapper[0] - (bestLayout[0] * bestSize[0]);
    var ypad = wrapper[1] - (bestLayout[1] * bestSize[1]);
    xpad = xpad/(bestLayout[0] + 1);
    ypad = ypad/(bestLayout[1] + 1);

    var result = _.times(bestLayout[1], function _byRow() {
        return _.times(bestLayout[0], function _byCol() {
            return _.clone(bestSize).concat(xpad, ypad);
        });
    });

    done(null, result);
};
