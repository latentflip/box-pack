var domready = require('domready');
var _ = require('underscore');
var AmpersandView = require('ampersand-view');
var AmpersandState = require('ampersand-state');
var AmpersandCollection = require('ampersand-collection');

var VideoView = AmpersandView.extend({
    template: function (view) {
        var color = randColor();
        return "<div class='video' style='background: " + color + "'>" + view.model.id + "</div>";
    }
});

var RegionTemplate = [
    "<div id='wrapper' data-hook='region-container'>",
        "<div id='region1' data-hook='podium'></div>",
        "<div id='region2' data-hook='filmstrip'></div>",
        "<div id='region3' data-hook='avatars'></div>",
    "</div>"
].join('\n');


var RegionManager = require('./lib/region-manager');
var MyRegionManager = RegionManager.extend({
    template: RegionTemplate,
    initialRegions: {
        podium: '[data-hook~=podium]',
        filmstrip: '[data-hook~=filmstrip]',
        avatars: '[data-hook~=avatars]'
    },
    determineRegion: function () {
        if (this.regions.podium.views.length < 2) return this.regions.podium;
        if (this.regions.filmstrip.views.length < 10) return this.regions.filmstrip;
        return this.regions.avatars;
    }
});

var Model = AmpersandState.extend({
    props: {
        id: 'number'
    }
});
var Collection = AmpersandCollection.extend({
    model: Model
});

var collection = new Collection([{ id: 1 }, { id: 2 }, { id: 3 }]);
var regionManager = new MyRegionManager({ ChildView: VideoView, collection: collection, el: document.querySelector('[data-hook=region-container]') });
window.regionManager = regionManager;


domready(function () {
    regionManager.render();
    document.body.appendChild(regionManager.el);
});


///////////////////////////
var randN = function () {
    return Math.floor(Math.random() * 235) + 20;
};

var randColor = function () {
    return '#' + randN().toString(16) + randN().toString(16) + randN().toString(16);
};

