var domready = require('domready');
var _ = require('underscore');
var solver = require('./solver');

var randN = function () {
    return Math.floor(Math.random() * 235) + 20;
};

var randColor = function () {
    return '#' + randN().toString(16) + randN().toString(16) + randN().toString(16);
};

var createVideo = function (aspectRatio) {
    var video = document.createElement('div');
    video.setAttribute('data-aspect-ratio', aspectRatio);
    video.style.background = randColor();
    video.style.width = 100*aspectRatio + 'px';
    video.style.height = 100 + 'px';
    video.style.position = 'absolute';
    video.style.transition = 'all 0.25s linear';
    return video;
};

var createWrapper = function (size) {
    var wrapper = document.createElement('div');
    wrapper.style.outline = "1px black solid";
    wrapper.style.width = '100%';
    wrapper.style.height = '500px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.position = 'relative';
    return wrapper;
};

domready(function () {
    var wrapperSize = [500,400];
    var videoAR = 6/4;
    var nVideos = 5;
    var wrapper = createWrapper(wrapperSize);

    var videoEls = [];
    document.body.appendChild(wrapper);

    window.addVideo = function () {
        var video = createVideo(videoAR);
        videoEls.push(video);
        wrapper.appendChild(video);
    };

    window.addNVideos = function (n, delay) {
        var interval = setInterval(function() {
            addVideo();
            n--;
            if (!n) { clearInterval(interval); }
        }, delay);
    };

    _.times(nVideos, window.addVideo);

    var updateLoop = function () {
        var wbcr = wrapper.getBoundingClientRect();
        var wrapperSize = [ wbcr.width, wbcr.height ];
        var nVideos = videoEls.length;

        var x=0, y=0, i=0;
        solver(wrapperSize, videoAR, nVideos, function (err, layout) {
            layout.map(function (row, ir) {
                row.map(function (size, ic) {
                    if (!videoEls[i]) return;

                    y = ir * size[1] + (ir + 1) * size[3];
                    x = ic * size[0] + (ic + 1) * size[2];

                    videoEls[i].style.width = size[0] + 'px';
                    videoEls[i].style.height = size[1] + 'px';
                    videoEls[i].style.transform = 'translate(' + x + 'px, ' + y + 'px)';

                    i++;
                });
            });
        });

        //window.requestAnimationFrame(updateLoop);
    };

    setInterval(function () {
        window.requestAnimationFrame(updateLoop);
    }, 20);
});
