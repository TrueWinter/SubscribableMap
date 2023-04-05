/* eslint-disable jest/no-export */
const { describe, test, expect, jest } = require('@jest/globals');
const SubscribableMap = require('../index.js');

/**
 * @param {SubscribableMap} map 
 */
module.exports.pre = (map) => {
	test('no initial subscribers', () => {
		expect(map.getSubscribers().size).toBe(0);
	});
};

/**
 * @param {SubscribableMap} map 
 */
module.exports.common = (map) => {
	/**
	 * @param {SubscribableMap.SubscribeCallbackData} e
	 */
	var handleEvent = jest.fn();

	test('subscribing adds callback to the subscription set', () => {
		map.subscribe(handleEvent);

		expect(map.getSubscribers().size).toBe(1);
		expect([...map.getSubscribers().values()].filter((m) => m.fn === handleEvent)[0].fn).toBe(handleEvent);
		expect([...map.getSubscribers().values()].filter((m) => m.fn === handleEvent)[0].bypassCooldown).toBe(false);
	});

	test('unsubscribing removes callback from subscription set', () => {
		map.unsubscribe(handleEvent);

		expect(map.getSubscribers().size).toBe(0);
		expect([...map.getSubscribers().values()].filter((m) => m.fn === handleEvent)).toHaveLength(0);
	});

	test('set() sets the value', () => {
		map.set('set-test', 'it works');

		expect(map.get('set-test')).toBe('it works');
	});

	test('get() returns the correct value', () => {
		map.set('get-test', 'it works');

		expect(map.get('get-test')).toBe('it works');
	});

	test('has() returns true only if the map has the key', () => {
		map.set('has-test', 'it works');

		expect(map.has('has-test')).toBe(true);
		expect(map.has('has-test-fail')).toBe(false);
	});

	test('delete() deletes from map', () => {
		map.set('delete-test', 'test');
		map.delete('delete-test');

		expect(map.has('delete-test')).toBe(false);
	});

	test('subscribers receive callbacks', () => {
		map.subscribe(handleEvent);
		map.set('test', 'ing');

		expect(handleEvent).toHaveBeenCalled();
	});
};

module.exports.defaults = {
	/**
	 * @param {SubscribableMap} map
	 */
	noInitialValue: (map) => {
		test('no initial value is stored', () => {
			expect(map.size).toBe(0);
		});
	},
	/**
	 * @param {SubscribableMap} map
	 */
	cooldown0: (map) => {
		test('default cooldown is 0', () => {
			expect(map.getOpts().cooldown).toBe(0);
		});
	},
	/**
	 * @param {SubscribableMap} map
	 */
	deleteBypassesCooldownTrue: (map) => {
		test('default deleteBypassesCooldown is true', () => {
			expect(map.getOpts().deleteBypassesCooldown).toBe(true);
		});
	},
	/**
	 * @param {SubscribableMap} map
	 */
	defaultInitialValueBlank: (map) => {
		test('default initialValue is [] or undefined', () => {
			expect([[], undefined]).toContain(map.getOpts().initialValue);
		});
	}
};