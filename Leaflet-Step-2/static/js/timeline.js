import IntervalTree from 'diesal/src/ds/IntervalTree';

L.Timeline = L.GeoJSON.extend({
  times:  null,
  ranges: null,

  /**
   * @constructor
   * @param {Object} geojson 
   * @param {Object} options 
   * @param {Function} [options.getInterval] 
   
   * @param {Boolean} [options.drawOnSetTime=true] 
   * 
   */
  initialize(geojson, options = {}) {
    this.times = [];
    this.ranges = new IntervalTree();
    const defaultOptions = {
      drawOnSetTime: true,
    };
    L.GeoJSON.prototype.initialize.call(this, null, options);
    L.Util.setOptions(this, defaultOptions);
    L.Util.setOptions(this, options);
    if (this.options.getInterval) {
      this._getInterval = (...args) => this.options.getInterval(...args);
    }
    if (geojson) {
      this._process(geojson);
    }
  },

  _getInterval(feature) {
    const hasStart = 'start' in feature.properties;
    const hasEnd = 'end' in feature.properties;
    if (hasStart && hasEnd) {
      return {
        start: new Date(feature.properties.start).getTime(),
        end:   new Date(feature.properties.end).getTime(),
      };
    }
    return false;
  },

  /**
   
   * @param {Object} data 
   */
  _process(data) {
    
    let start = Infinity;
    let end = -Infinity;
    data.features.forEach((feature) => {
      const interval = this._getInterval(feature);
      if (!interval) { return; }
      this.ranges.insert(interval.start, interval.end, feature);
      this.times.push(interval.start);
      this.times.push(interval.end);
      start = Math.min(start, interval.start);
      end = Math.max(end, interval.end);
    });
    this.start = this.options.start || start;
    this.end = this.options.end || end;
    this.time = this.start;
    if (this.times.length === 0) {
      return;
    }
    
    this.times.sort((a, b) => a - b);
    
    this.times = this.times.reduce((newList, x, i) => {
      if (i === 0) {
        return newList;
      }
      const lastTime = newList[newList.length - 1];
      if (lastTime !== x) {
        newList.push(x);
      }
      return newList;
    }, [this.times[0]]);
  },

  setTime(time) {
    this.time = typeof time === 'number' ? time : new Date(time).getTime();
    if (this.options.drawOnSetTime) {
      this.updateDisplayedLayers();
    }
    this.fire('change');
  },

  updateDisplayedLayers() {
    
    const features = this.ranges.lookup(this.time);
    
    for (let i = 0; i < this.getLayers().length; i++) {
      let found = false;
      const layer = this.getLayers()[i];
      for (let j = 0; j < features.length; j++) {
        if (layer.feature === features[j]) {
          found = true;
          features.splice(j, 1);
          break;
        }
      }
      if (!found) {
        const toRemove = this.getLayers()[i--];
        this.removeLayer(toRemove);
      }
    }
    
    features.forEach(feature => this.addData(feature));
  },
});

L.timeline = (geojson, options) => new L.Timeline(geojson, options);