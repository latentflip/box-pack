var _ = require('underscore');
var AmpersandView = require('ampersand-view');
var CollectionView = require('ampersand-collection-view');
var Region = require('./region');

var RegionCollectionView = CollectionView.extend({
    _insertViewAtIndex: function (view) {
        CollectionView.prototype._insertViewAtIndex.call(this, view);
        this.trigger('childview:inserted', view, this.views);
    },
    _insertView: function (view) {
        CollectionView.prototype._insertView.call(this, view);
        this.trigger('childview:inserted', view, this.views);
    },
    _removeView: function (view) {
        CollectionView.prototype._removeView.call(this, view);
        this.trigger('childview:removed', view, this.views);
    }
});

var RegionManager = AmpersandView.extend({
    initialize: function () {
        var _update = this.update.bind(this);
        this.update = _.throttle(function () {
            window.requestAnimationFrame(_update);
        }, 50);
    },

    props: {
        ChildView: 'any'
    },

    render: function () {
        this.renderWithTemplate();
        this.initializeRegions(this.initialRegions);
        this.collectionView = new RegionCollectionView({
            el: this.el,
            view: this.ChildView,
            collection: this.collection
        });
        this.registerSubview(this.collectionView);
        this.registerCollectionViewEvents();
        this.registerWindowEvents();
        this.collectionView.render();
        this.update();
        return this;
    },

    initializeRegions: function (regionConfigs) {
        var self = this;
        this.regions = this.regions || {};

        Object.keys(regionConfigs).forEach(function (name) {
            var config = regionConfigs[name];

            self.regions[name] = new Region({
                el: self.query(config)
            });
        });
    },

    registerCollectionViewEvents: function () {
        this.listenTo(this.collectionView, 'childview:inserted', function (view) {
            console.log('Added View', view);
            this.addView(view);
        }.bind(this));

        this.listenTo(this.collectionView, 'childview:removed', function (view) {
            console.log('Removed View', view);
            this.removeView(view);
        }.bind(this));
    },

    registerWindowEvents: function () {
        window.addEventListener('resize', this.update, false);
    },

    addView: function (view, options) {
        this.removeView(view);
        var region = this.determineRegion();
        region.addView(view);
    },

    removeView: function (view) {
        var self = this;
        Object.keys(this.regions).forEach(function (r) { self.regions[r].removeView(view); });
    },

    moveView: function (view) {
    },

    update: function () {
        console.log('Updating manager');
        var self = this;
        Object.keys(this.regions).forEach(function (r) { self.regions[r].update(); });
    }
});

module.exports = RegionManager;
