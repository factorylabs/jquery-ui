/*!
 * jQuery UI Mouse @VERSION
 *
 * Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Mouse
 *
 * Depends:
 *	jquery.ui.widget.js
 */
(function( $, undefined ) {

$.widget("ui.mouse", {
	options: {
		cancel: ':input,option',
		distance: 1,
		delay: 0
	},

	_isTouchDevice: function() {
    try {
      document.createEvent("TouchEvent");
      return true;
    } catch (e) {
      return false;
    }
	},

	_downType: function() {
		if(this._isTouchDevice()) {
			return 'touchstart';
    } else {
			return 'mousedown';
    }
	},

	_upType: function() {
		if(this._isTouchDevice()) {
			return 'touchend';
    } else {
			return 'mouseup';
    }
	},

	_moveType: function() {
		if(this._isTouchDevice()) {
			return 'touchmove';
    } else {
			return 'mousemove';
    }
	},

	_mouseInit: function() {
		var self = this;
		this.element
      .bind(this._downType()+"."+this.widgetName, function(event) {
				return self._mouseDown(event);
			})
			.bind('click.'+this.widgetName, function(event) {
				if (true === $.data(event.target, self.widgetName + '.preventClickEvent')) {
          $.removeData(event.target, self.widgetName + '.preventClickEvent');
          console.log('...stopping propagation');
					event.stopImmediatePropagation();
					return false;
				}
			});
		this.started = false;
	},

	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
	_mouseDestroy: function() {
		this.element.unbind('.'+this.widgetName);
	},

  _createInteractiveEvent: function(event) {
    var evt = {};
    var original = (event.originalEvent instanceof MouseEvent) ? event : event.originalEvent.touches[0];
    for( var it in original) {
        if(typeof original[it] !== 'function') {
            evt[it] = original[it];
        }
    }
    evt.type = event.type;
    evt.originalEvent = event.originalEvent;
    evt.preventDefault = function() { event.preventDefault(); };
    evt.stopPropagation = function() { event.stopPropagation(); };
    evt.stopImmediatePropagation = function() { event.stopImmediatePropagation(); };
    evt.isDefaultPrevented = function() { event.isDefaultPrevented(); };
    evt.isImmediatePropagationStopped = function() { event.isImmediatePropagationStopped(); };
    evt.isPropagationStopped = function() { event.isPropagationStopped(); };
    return evt;
  },

	_mouseDown: function(event) {
		// don't let more than one widget handle mouseStart
		// TODO: figure out why we have to use originalEvent
		event.originalEvent = event.originalEvent || {};
		if (event.originalEvent.mouseHandled) { return; }

    // create a generic interactive event to replace specific MouseEvents and TouchEvents
    event = this._createInteractiveEvent(event);

		// we may have missed mouseup (out of window)
		(this._mouseStarted && this._mouseUp(event));

		this._mouseDownEvent = event;

		var self = this,
			btnIsLeft = (event.which == 1),
			elIsCancel = (typeof this.options.cancel == "string" ? $(event.target).parents().add(event.target).filter(this.options.cancel).length : false);
		if ((!btnIsLeft && !this._isTouchDevice()) || elIsCancel || !this._mouseCapture(event)) {
			return true;
		}

		this.mouseDelayMet = !this.options.delay;
		if (!this.mouseDelayMet) {
			this._mouseDelayTimer = setTimeout(function() {
				self.mouseDelayMet = true;
			}, this.options.delay);
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted = (this._mouseStart(event) !== false);
			if (!this._mouseStarted) {
				event.preventDefault();
				return true;
			}
		}

		// these delegates are required to keep context
		this._mouseMoveDelegate = function(event) {
			return self._mouseMove(event);
		};
		this._mouseUpDelegate = function(event) {
			return self._mouseUp(event);
		};
		$(document)
      .bind(this._moveType()+"."+this.widgetName, this._mouseMoveDelegate)
			.bind(this._upType()+"."+this.widgetName, this._mouseUpDelegate);

    if(this._isTouchDevice()) {
        $(document).bind('touchcancel.'+this.widgetName, this._mouseUpDelegate);
    }

    event.preventDefault();
    event.originalEvent.mouseHandled = true;
		return true;
	},

	_mouseMove: function(event) {
    event = this._createInteractiveEvent(event);

		// IE mouseup check - mouseup happened when mouse was out of window
		if ($.browser.msie && !(document.documentMode >= 9) && !event.button) {
			this._mouseUp(event);
			return this._mouseUp(event);
		}

		if (this._mouseStarted) {
			this._mouseDrag(event);
			return event.preventDefault();
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted = (this._mouseStart(this._mouseDownEvent, event) !== false);
			(this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event));
		}

		return !this._mouseStarted;
	},

	_mouseUp: function(event) {
    event = this._createInteractiveEvent(event);

		$(document)
      .unbind(this._moveType()+"."+this.widgetName, this._mouseMoveDelegate)
			.unbind(this._upType()+"."+this.widgetName, this._mouseUpDelegate);

    if(this._isTouchDevice()) {
        $(document).unbind('touchcancel.'+this.widgetName, this._mouseUpDelegate);
    }

		if (this._mouseStarted) {
			this._mouseStarted = false;

			if (event.target == this._mouseDownEvent.target) {
			    $.data(event.target, this.widgetName + '.preventClickEvent', true);
			}

			this._mouseStop(event);
		}

		return false;
	},

	_mouseDistanceMet: function(event) {
		return (Math.max(
				Math.abs(this._mouseDownEvent.pageX - event.pageX),
				Math.abs(this._mouseDownEvent.pageY - event.pageY)
			) >= this.options.distance
		);
	},

	_mouseDelayMet: function(event) {
		return this.mouseDelayMet;
	},

	// These are placeholder methods, to be overriden by extending plugin
	_mouseStart: function(event) {},
	_mouseDrag: function(event) {},
	_mouseStop: function(event) {},
	_mouseCapture: function(event) { return true; }
});

})(jQuery);
