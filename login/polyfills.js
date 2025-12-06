(function() {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.ResizeObserver === 'undefined') {
    const resizeObservers = new Set();
    const triggerResizeObservers = () => {
      resizeObservers.forEach(observer => observer._check());
    };

    window.addEventListener('resize', () => {
      window.requestAnimationFrame(triggerResizeObservers);
    });
    window.addEventListener('orientationchange', () => {
      window.requestAnimationFrame(triggerResizeObservers);
    });

    class ResizeObserverPolyfill {
      constructor(callback) {
        this.callback = typeof callback === 'function' ? callback : function() {};
        this.elements = new Set();
        resizeObservers.add(this);
      }
      observe(element) {
        if (!element) {
          return;
        }
        this.elements.add(element);
        this._dispatch([element]);
      }
      unobserve(element) {
        this.elements.delete(element);
      }
      disconnect() {
        this.elements.clear();
        resizeObservers.delete(this);
      }
      _dispatch(targets) {
        const entries = targets.map(target => ({
          target,
          contentRect: target.getBoundingClientRect()
        }));
        if (entries.length) {
          this.callback(entries, this);
        }
      }
      _check() {
        if (!this.elements.size) {
          return;
        }
        this._dispatch(Array.from(this.elements));
      }
    }

    window.ResizeObserver = ResizeObserverPolyfill;
  }

  if (typeof window.IntersectionObserver === 'undefined') {
    const intersectionObservers = new Set();
    const triggerIntersectionObservers = () => {
      intersectionObservers.forEach(observer => observer._check());
    };

    window.addEventListener('scroll', () => {
      window.requestAnimationFrame(triggerIntersectionObservers);
    }, true);
    window.addEventListener('resize', () => {
      window.requestAnimationFrame(triggerIntersectionObservers);
    }, true);

    class IntersectionObserverPolyfill {
      constructor(callback, options = {}) {
        this.callback = typeof callback === 'function' ? callback : function() {};
        this.threshold = Array.isArray(options.threshold) ? options.threshold : [options.threshold || 0];
        this.rootMargin = options.rootMargin || '0px';
        this.targets = new Set();
        intersectionObservers.add(this);
      }
      observe(element) {
        if (!element) {
          return;
        }
        this.targets.add(element);
        this._checkSingle(element);
      }
      unobserve(element) {
        this.targets.delete(element);
      }
      disconnect() {
        this.targets.clear();
        intersectionObservers.delete(this);
      }
      _checkSingle(element) {
        const rect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const isIntersecting =
          rect.bottom >= 0 &&
          rect.right >= 0 &&
          rect.top <= viewportHeight &&
          rect.left <= viewportWidth;
        const entry = {
          target: element,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0
        };
        this.callback([entry], this);
      }
      _check() {
        if (!this.targets.size) {
          return;
        }
        this.targets.forEach(target => this._checkSingle(target));
      }
    }

    window.IntersectionObserver = IntersectionObserverPolyfill;
  }
})();
