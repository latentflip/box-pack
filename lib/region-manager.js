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
        return;
    },
    _reset: function () {
        return;
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
            view: this.ChildView.extend({ insertSelf: true }),
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
        if (!view.rendered) { view.render(); }
        if (!view.el.parentNode) {
            this.el.appendChild(view.el);
        }

        this.removeView(view);
        var region = this.determineRegion(view);
        region.addView(view);
    },

    removeView: function (view) {
        var self = this;
        Object.keys(this.regions).forEach(function (r) { self.regions[r].removeView(view); });
    },

    swapViews: function (view1, view2) {
        var r1 = view1.region;
        var r2 = view2.region;

        var p1 = r1.positionOf(view1);
        var p2 = r2.positionOf(view2);

        r1.removeView(view1);
        r2.removeView(view2);

        r1.addView(view2, p1);
        r2.addView(view1, p2);
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
