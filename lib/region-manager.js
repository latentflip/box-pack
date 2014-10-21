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
    },
    _rerenderAll: function () {
        this._renderAll();
    },
    _reset: function () {
        this._renderAll();
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
                el: self.query(config),
                manager: self
            });
        });
    },

    registerCollectionViewEvents: function () {
        var self = this;

        this.listenTo(this.collectionView, 'childview:inserted', function (view) {
            this.addView(view);
            
            //Yeuch, effectively a draggable mixin
            view.el.setAttribute('draggable', true);
            view.regionOnDragStart = function (e) {
                self.currentlyDragging = view;
                e.dataTransfer.effectAllowed = "move";
            };
            view.regionOnDragEnd = function () {
                self.currentlyDragging = null;
            };
            view.regionOnDragOver = function (e) {
                e.preventDefault();
            };
            view.regionOnDrop = function (e) {
                e.preventDefault();
                e.stopPropagation();
                var pos = view.region.positionOf(view);
                self.handleDrop(view.region, pos);
            };
            view.delegateEvents({
                dragstart: 'regionOnDragStart',
                dragend: 'regionOnDragEnd',
                dragover: 'regionOnDragOver',
                drop: 'regionOnDrop',
            });

        }.bind(this));

        this.listenTo(this.collectionView, 'childview:removed', function (view) {
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

    update: function () {
        var self = this;
        Object.keys(this.regions).forEach(function (r) { self.regions[r].update(); });
    },

    handleDrop: function (region, position) {
        var view = this.currentlyDragging;

        if (!view) { return; }
        this.removeView(view);
        region.addView(view, position);
    }
});

module.exports = RegionManager;
