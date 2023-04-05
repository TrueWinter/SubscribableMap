/**
 * @typedef {'set' | 'delete'} SubscribableMapEnum
 */
/**
 * @typedef {Object} SubscribeCallbackData
 * @property {SubscribableMapEnum} event
 * @property {*} key
 * @property {*} value
 */

module.exports = class SubscribableMap extends Map {
	static enum = Object.freeze({
		SET: 'set',
		DELETE: 'delete'
	});

	/**
	 * @typedef {Object} Options
	 * @property {number} [cooldown=0]
	 * @property {boolean} [deleteBypassesCooldown=true]
	 * @property {Array} [initialValue=[]]
	 */
	/**
	 * Creates a new SubscribableMap
	 * @param {Options} options The options
	 */
	constructor({
		cooldown = 0,
		deleteBypassesCooldown = true,
		initialValue = []
	} = {}) {
		super();

		// Attempting to pass the initial value in the super() call results in an error.
		if (initialValue && Array.isArray(initialValue) && initialValue.length > 0) {
			for (let i = 0; i < initialValue.length; i++) {
				super.set(initialValue[i][0], initialValue[i][1]);
			}
		}

		this._opts = {
			cooldown,
			deleteBypassesCooldown
		};

		/** @type {Map<string, number>} */
		this._previousDispatchTimes = new Map();

		/** @type {Set<{fn: function, bypassCooldown: boolean}>} */
		this._subscribers = new Set();
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
	 */
	_emit(key, value, event) {
		if (this._subscribers.size === 0) return;

		let shouldDispatch = true;
		if (Date.now() < (this._previousDispatchTimes.get(key) || 0) + this._opts.cooldown) {
			if (!(event === SubscribableMap.enum.DELETE && this._opts.deleteBypassesCooldown)) {
				shouldDispatch = false;
			}
		}

		if (shouldDispatch) {
			this._previousDispatchTimes.set(key, Date.now());
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
	 */
	set(key, value) {
		this._emit(key, value, SubscribableMap.enum.SET);
		super.set(key, value);
	}

	/**
	 * Deletes a key
	 * @param {*} key The key to delete
	 */
	delete(key) {
		this._emit(key, undefined, SubscribableMap.enum.DELETE);
		super.delete(key);
	}
};