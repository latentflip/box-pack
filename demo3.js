var solver = require('./solver2');
var _ = require('underscore');

var randVid = function () {
    return '/vids/cut-' + (Math.floor(Math.random() * 20) + 10) + '.mp4';
};

var randN = function () {
    return Math.floor(Math.random() * 235) + 20;
};

var randColor = function () {
    return '#' + randN().toString(16) + randN().toString(16) + randN().toString(16);
};

var createVideo = function () {
    var aspectRatio = 6/4;
    var video = document.createElement('div');
    video.setAttribute('class', 'video');
    video.setAttribute('data-aspect-ratio', aspectRatio);
    video.style.background = randColor();
    video.style.width = 100*aspectRatio + 'px';
    video.style.height = 100 + 'px';
    video.style.position = 'absolute';
    video.style.transition = 'all 0.25s linear';
    video.style.overflow = 'hidden';

    return video;
    var v = document.createElement('video');
    v.src = randVid();
    v.autoplay = true;
    v.addEventListener('ended', function () {
        v.load();
    }, false);
    video.appendChild(v);
    return video;
};

window.addVideo = function (region) {
    var video = createVideo();
    manager.addVideo(region, video);
};

window.addNVideos = function (region, n, delay) {
    var interval = setInterval(function() {
        addVideo(region);
        n--;
        if (!n) { clearInterval(interval); }
    }, delay);
};


function VideoManager (el) {
    this._regions = [];
    this.el = el;
    this.update = _.throttle(this.update.bind(this), 50);
}

VideoManager.prototype.update = function () {
    _.values(this._regions).forEach(function (r) { r.update(); });
};

VideoManager.prototype.start = function () {
    //_.values(this._regions).forEach(function (r) { r.start(); });
    window.addEventListener('resize', this.update, false);
};

VideoManager.prototype.addRegion = function (name, region) {
    this._regions[name] = region;
    region.manager = this;
};

VideoManager.prototype.gotDrop = function (region) {
    var video = this.dragging;

    if (video) {
        this.removeVideo(video);
        region.addVideo(video);
    }
};

VideoManager.prototype.addVideo = function (region, videoEl) {
    var self = this;
    if (videoEl.parentNode !== this.el) {
        this.el.appendChild(videoEl);
        videoEl.setAttribute('draggable', true);
        videoEl.draggable = true;

        videoEl.addEventListener('dragstart', function (e) {
            self.dragging = videoEl;
        }, false);

        videoEl.addEventListener('dragend', function (e) {
            self.dragging = null;
        }, false);
    }

    this._regions[region].addVideo(videoEl);
};

VideoManager.prototype.removeVideo = function (videoEl) {
    Object.keys(this._regions).forEach(function (key) {
        this._regions[key].removeVideo(videoEl);
    }.bind(this));
};

VideoManager.prototype.moveVideo = function (region, videoEl) {
    this.removeVideo(videoEl);
    this.addVideo(region, videoEl);
};

function Region (el) {
    if (!el || !(el instanceof Element)) { throw "Region needs an el, got a " + typeof el; }

    this._videos = [];
    this.el = el;

    var self = this;

    this.el.addEventListener('dragover', function (e) {
        e.preventDefault();
    });

    this.el.addEventListener('drop', function (e) {
        e.preventDefault();
        self.manager.gotDrop(self);
    }, false);
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

Region.prototype.addVideo = function (video) {
    this._videos.push(video);
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
    var solution = this.layouts[this._videos.length];
    var videoSize = calculateVideoSize(
        [this.dimensions.width, this.dimensions.height],
        6/4,
        solution
    );

    var xOffset = this.dimensions.left;
    var yOffset = this.dimensions.top;
    this._videos.forEach(function (el, i) {
        var x, y, row, col;

        el.style.width = videoSize[0] + 'px';
        el.style.height = videoSize[1] + 'px';
        
        row = Math.floor(i / solution[0]);
        col = i - (row * solution[0]);

        x = xOffset + videoSize[0] * col + (videoSize[2] * (col + 1));
        y = yOffset + videoSize[1] * row + (videoSize[3] * (row + 1));

        el.style.transform = "translate(" + x + "px, " + y + "px)";
    });
};

Region.prototype.removeVideo = function (video) {
    this._videos = _.without(this._videos, video);
    this.update();
};

window.manager = new VideoManager(document.querySelector('#wrapper'));
manager.addRegion('podium', new Region(document.querySelector('#region1')));
manager.addRegion('filmstrip', new Region(document.querySelector('#region2')));
manager.addRegion('avatars', new Region(document.querySelector('#region3')));

manager.start();



//----------------------------
var fitInside = require('./lib/fit-inside');
function calculateVideoSize (wrapperSize, videoAR, layout) {
    var totalAR = videoAR * (layout[0] / layout[1]);
    var totalSize = fitInside(wrapperSize, [totalAR, 1]);
    var videoSize = [
        totalSize[0]/layout[0],
        totalSize[1]/layout[1]
    ];
    var videoPadding = [
        (wrapperSize[0] - totalSize[0]) / (layout[0] + 1),
        (wrapperSize[1] - totalSize[1]) / (layout[1] + 1)
    ];

    return videoSize.concat(videoPadding);
}

setTimeout(function () {
    addNVideos('podium', 3, 10); addNVideos('filmstrip', 10, 10); addNVideos('avatars', 20, 10);
}, 500);
