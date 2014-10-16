var aspectRatio = require('./aspect-ratio');

module.exports = function fitInside(outer, inner) {
    if (!Array.isArray(outer)) { outer = [outer, 1]; }
    if (!Array.isArray(inner)) { inner = [inner, 1]; }

    var outerAR = aspectRatio(outer);
    var innerAR = aspectRatio(inner);

    if (innerAR > outerAR) {
        //shrinkWidth
        return [
            outer[0],
            outer[0] / innerAR
        ];
    } else {
        //shrinkHeight
        return [
            outer[1] * innerAR,
            outer[1]
        ];
    }
};
