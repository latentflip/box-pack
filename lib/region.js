var _ = require('underscore');
var solver = require('../solver2');
var fitInside = require('./fit-inside');

function Region (opts) {
    var el = opts.el;

    if (!el || !(el instanceof Element)) { throw "Region needs an el, got a " + typeof el; }

    this.views = [];
    this.el = el;
    this.manager = opts.manager;

    var self = this;

    this.el.addEventListener('dragover', function (e) {
        e.preventDefault();
    });

    this.el.addEventListener('drop', function (e) {
        e.preventDefault();
        if (self.positionOf(self.manager.currentlyDragging) !== -1) {
            return;
        }
        self.manager.handleDrop(self, -1);
    }, false);

    var _update = this.update.bind(this);
    this.update = _.throttle(function () {
        window.requestAnimationFrame(_update);
    }, 50);
}

Region.prototype.start = function () {
    this.updateDimensions();
};

Region.prototype.updateDimensions = function () {
    var prevDimensions = JSON.stringify(this.dimensions);

    this.dimensions = this.el.getBoundingClientRect();
    this.dimensions.aspectRatio = this.dimensions.width / this.dimensions.height;

    return prevDimensions !== JSON.stringify(this.dimensions);
};

Region.prototype.positionOf = function (view) {
    return this.views.indexOf(view);
};

Region.prototype.addView = function (view, position) {
    view.region = this;
    if (typeof position === 'undefined' || position === -1) {
        this.views.push(view);
    } else {
        this.views.splice(position, 0, view);
    }
    this.update();
};

Region.prototype.updateSolutions = function () {
    var changed = this.updateDimensions();
    if (!changed) return false;

    this.layouts = solver(
        [this.dimensions.width, this.dimensions.height],
        6/4,
        50
    );
    return true;
};

Region.prototype.update = function () {
    var solutionsChanged = this.updateSolutions();
    var solution = this.layouts[this.views.length];
    var viewSize = calculateViewSize(
        [this.dimensions.width, this.dimensions.height],
        6/4,
        solution
    );

    var parentNode = this.el.parentNode.getBoundingClientRect();
    var xOffset = this.dimensions.left - parentNode.left;
    var yOffset = this.dimensions.top - parentNode.top;

    this.views.forEach(function (view, i) {
        var x, y, row, col;
        var el = view.el;

        el.style.width = viewSize[0] + 'px';
        el.style.height = viewSize[1] + 'px';

        row = Math.floor(i / solution[0]);
        col = i - (row * solution[0]);

        x = xOffset + viewSize[0] * col + (viewSize[2] * (col + 1));
        y = yOffset + viewSize[1] * row + (viewSize[3] * (row + 1));

        el.style.transform = "translate(" + x + "px, " + y + "px)";
    });
};

Region.prototype.removeView = function (view) {
    this.views = _.without(this.views, view);
    this.update();
};

//----------------------------
function calculateViewSize (wrapperSize, viewAR, layout) {
    var totalAR = viewAR * (layout[0] / layout[1]);

    var totalSize = fitInside(wrapperSize, [totalAR, 1]);

    var viewSize = [
        totalSize[0]/layout[0],
        totalSize[1]/layout[1]
    ];
    var viewPadding = [
        (wrapperSize[0] - totalSize[0]) / (layout[0] + 1),
        (wrapperSize[1] - totalSize[1]) / (layout[1] + 1)
    ];

    return viewSize.concat(viewPadding);
}


module.exports = Region;
