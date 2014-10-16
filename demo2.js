var domready = require('domready');
var _ = require('underscore');
var solver = require('./solver2');

var randN = function () {
    return Math.floor(Math.random() * 235) + 20;
};

var randColor = function () {
    return '#' + randN().toString(16) + randN().toString(16) + randN().toString(16);
};

var videoN = 10;

var createVideo = function (aspectRatio) {
    var video = document.createElement('div');
    video.setAttribute('data-aspect-ratio', aspectRatio);
    video.style.background = randColor();
    video.style.width = 100*aspectRatio + 'px';
    video.style.height = 100 + 'px';
    video.style.position = 'absolute';
    video.style.transition = 'all 0.25s linear';
    video.style.overflow = 'hidden';

    videoN++;
    return video;
};

var createWrapper = function (size) {
    var wrapper = document.createElement('div');
    wrapper.style.outline = "1px black solid";
    wrapper.style.width = '100%';
    wrapper.style.height = '200px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.position = 'relative';
    return wrapper;
};

function aspectRatio(rect) {
    return rect[0] / rect[1];
}

function fitInside(outer, inner) {
    var outerAR = aspectRatio(outer);
    var innerAR = aspectRatio(inner);

    if (innerAR > outerAR) {
        //shrinkWidth
        return [
            outer[0],
            outer[1] / innerAR
        ];
    } else {
        //shrinkHeight
        return [
            outer[1] * innerAR,
            outer[1]
        ];
    }
}

var calculateVideoSize = function (wrapperSize, videoAR, layout) {
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
    var solutions = solver(wrapperSize, videoAR, 1000);
    var lastWrapperAR = wrapperSize[0] / wrapperSize[1];

    var updateLoop = function () {
        var wbcr = wrapper.getBoundingClientRect();
        var wrapperSize = [ wbcr.width, wbcr.height ];
        var nVideos = wrapper.childNodes.length;//videoEls.length;

        if (wrapperSize[0] / wrapperSize[1] !== lastWrapperAR) {
            solutions = solver(wrapperSize, videoAR, 1000);
            lastWrapperAR = wrapperSize[0] / wrapperSize[1];
        }

        var solution = solutions[videoEls.length];
        var videoSize = calculateVideoSize(wrapperSize, videoAR, solution);

        [].map.call(wrapper.childNodes, function (el, i) {
        //videoEls.map(function (el, i) {
            var x, y, row, col;

            el.style.width = videoSize[0] + 'px';
            el.style.height = videoSize[1] + 'px';
            
            row = Math.floor(i / solution[0]);
            col = i - (row * solution[0]);

            x = videoSize[0] * col + (videoSize[2] * (col + 1));
            y = videoSize[1] * row + (videoSize[3] * (row + 1));

            el.style.transform = "translate(" + x + "px, " + y + "px)";

            //console.log(row, col);
        });

        //var x=0, y=0, i=0;
        //solver(wrapperSize, videoAR, nVideos, function (err, layout) {
        //    layout.map(function (row, ir) {
        //        row.map(function (size, ic) {
        //            if (!videoEls[i]) return;

        //            y = ir * size[1] + (ir + 1) * size[3];
        //            x = ic * size[0] + (ic + 1) * size[2];

        //            videoEls[i].style.width = size[0] + 'px';
        //            videoEls[i].style.height = size[1] + 'px';
        //            videoEls[i].style.transform = 'translate(' + x + 'px, ' + y + 'px)';

        //            i++;
        //        });
        //    });
        //});

        //window.requestAnimationFrame(updateLoop);
    };

    var tUpdateLoop = _.throttle(updateLoop, 100);

    setTimeout(function () {
        tUpdateLoop();
    }, 250);

    window.addEventListener('resize', tUpdateLoop, false);
    var observer = new MutationObserver(tUpdateLoop);
    observer.observe(wrapper, { childList: true });
    //setInterval(function () {
    //    updateLoop();
    //    //window.requestAnimationFrame(updateLoop);
    //}, 20);
});
