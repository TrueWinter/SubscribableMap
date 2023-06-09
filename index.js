/**
 * @typedef {'set' | 'delete' | 'clear' | 'sync'} SubscribableMapEnum
 */
/**
 * @typedef {Object} SubscribeCallbackData
 * @property {SubscribableMapEnum} event The event
 * @property {*} [key] The key, or undefined for the clear() method
 * @property {*} [value] The value, or undefined for the delete()/clear() methods
 */

module.exports = class SubscribableMap extends Map {
	static enum = Object.freeze({
		SET: 'set', // set()
		DELETE: 'delete', // delete()
		CLEAR: 'clear', // clear()
		SYNC: 'sync' // if the data is out of sync when the cooldown passes
	});

	/**
	 * @typedef {Object} Options
	 * @property {number} [cooldown=0]
	 * @property {boolean} [deleteBypassesCooldown=true]
	 * @property {boolean} [forceEmitAfterCooldownIfChanged=false]
	 * @property {Array} [initialValue=[]]
	 */
	/**
	 * Creates a new SubscribableMap
	 * @param {Options} options The options
	 */
	constructor({
		cooldown = 0,
		deleteBypassesCooldown = true,
		forceEmitAfterCooldownIfChanged = false,
		initialValue = []
	} = {}) {
		super();

		// Attempting to pass the initial value in the super() call results in an error.
		if (initialValue && Array.isArray(initialValue) && initialValue.length > 0) {
			for (let i = 0; i < initialValue.length; i++) {
				super.set(initialValue[i][0], initialValue[i][1], false);
			}
		}

		/** @private */
		this._opts = {
			cooldown,
			deleteBypassesCooldown,
			forceEmitAfterCooldownIfChanged
		};

		/**
		 * @type {Map<string, {time: number, data: *>}
		 * @private
		 */
		this._previousDispatchTimes = new Map();

		/**
		 * @type {Set<{fn: function, bypassCooldown: boolean}>}
		 * @private
		 */
		this._subscribers = new Set();

		if (cooldown > 0 && forceEmitAfterCooldownIfChanged) {
			setInterval(() => {
				this._previousDispatchTimes.forEach((pv, pk) => {
					if (Date.now() > pv.time + cooldown && this.get(pk) !== pv.data) {
						this._emit(pk, this.get(pk), SubscribableMap.enum.SYNC, true);
					}
				});
			}, 100).unref();
		}
	}

	/**
	 * @callback SubscribeCallback
	 * @param {SubscribeCallbackData} fn
	 */
	/**
	 * Subscribe to changes in this SubscribableMap
	 * @param {SubscribeCallback} fn Callback
	 * @param {boolean} bypassCooldown Whether this subscription should receive events even during a cooldown
	 */
	subscribe(fn, bypassCooldown = false) {
		this._subscribers.add({
			fn,
			bypassCooldown
		});
	}

	/**
	 * Unsubscribe from changes in this SubscribableMap
	 * @param {SubscribeCallback} fn Callback
	 */
	unsubscribe(fn) {
		this._subscribers.forEach((s) => {
			if (s.fn === fn) {
				this._subscribers.delete(s);
			}
		});
	}

	/**
	 * Returns all subscribers
	 * @returns {Set<{fn: Function, bypassCooldown: boolean}>}
	 */
	getSubscribers() {
		return this._subscribers;
	}

	/**
	 * Returns a frozen options object
	 * @returns {Options}
	 */
	getOpts() {
		return Object.freeze(this._opts);
	}

	/**
	 * Returns a key-value array of the map
	 * @returns {Array}
	 */
	serialize() {
		return [...super.entries()];
	}

	/**
	 * @private
	 * @param {*} key Key
	 * @param {*} value Value
	 * @param {SubscribableMapEnum} event Event
	 * @param {boolean} [bypassCooldown=false] Whether the cooldown should be bypassed
	 */
	_emit(key, value, event, bypassCooldown = false) {
		if (this._subscribers.size === 0) return;

		let shouldDispatch = true;
		// Doesn't make much sense having cooldown apply to clear() because there's no key passed in clear(), so skip the cooldown check
		if (!bypassCooldown && (event !== SubscribableMap.enum.CLEAR &&
				Date.now() < (this._previousDispatchTimes.has(key) ?
					this._previousDispatchTimes.get(key).time : 0) + this._opts.cooldown)) {
			if (!(event === SubscribableMap.enum.DELETE && this._opts.deleteBypassesCooldown)) {
				shouldDispatch = false;
			}
		}

		if (shouldDispatch) {
			this._previousDispatchTimes.set(key, {
				time: Date.now(),
				data: value
			});
		}

		this._subscribers.forEach(async (s) => {
			if (shouldDispatch || s.bypassCooldown) {
				s.fn({
					event,
					key,
					value
				});
			}
		});
	}

	/**
	 * Sets the value for the key provided.
	 * @param {*} key The key
	 * @param {*} value The value
	 * @param {boolean} [emit=true] Whether an event should be emitted for this change
	 */
	set(key, value, emit = true) {
		super.set(key, value);

		if (emit) {
			this._emit(key, value, SubscribableMap.enum.SET);
		}
	}

	/**
	 * Deletes a key
	 * @param {*} key The key to delete
	 * @param {boolean} [emit=true] Whether an event should be emitted for this change
	 */
	delete(key, emit = true) {
		super.delete(key);

		if (emit) {
			this._emit(key, undefined, SubscribableMap.enum.DELETE);
		}
	}

	/**
	 * Clears the map
	 * @param {boolean} [emit=true] Whether an event should be emitted for this change
	 */
	clear(emit = true) {
		super.clear();

		if (emit) {
			this._emit(undefined, undefined, SubscribableMap.enum.CLEAR);
		}
	}
};