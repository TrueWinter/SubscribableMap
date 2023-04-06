/* eslint-disable jest/no-export */
const { describe, test, expect, jest, beforeEach } = require('@jest/globals');
const { promisify } = require('util');
const SubscribableMap = require('../index.js');

const wait = promisify(setTimeout);

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
	let handleEvent = jest.fn();

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

		expect(handleEvent).toHaveBeenCalledTimes(1);
	});

	test('subscribers receive callbacks for clear()', () => {
		map.subscribe(handleEvent);
		map.clear();

		expect(handleEvent).toHaveBeenCalledTimes(1);
	});

	test('set() event is not emitted if emit is false', async () => {
		map.subscribe(handleEvent);
		// To ensure that the non-emitting behaviour isn't being caused by a cooldown
		await wait(1000);
		map.set('test', '1234', false);

		expect(handleEvent).toHaveBeenCalledTimes(0);
	});
	
	test('delete() event is not emitted if emit is false', async () => {
		map.subscribe(handleEvent);
		// To ensure that the non-emitting behaviour isn't being caused by a cooldown
		await wait(1000);
		map.delete('test', false);

		expect(handleEvent).toHaveBeenCalledTimes(0);
	});

	test('clear() event is not emitted if emit is false', async () => {
		map.subscribe(handleEvent);
		// To ensure that the non-emitting behaviour isn't being caused by a cooldown
		await wait(1000);
		map.clear(false);

		expect(handleEvent).toHaveBeenCalledTimes(0);
	});
};

// set() and clear() are already tested in common.
// But delete is subject to cooldowns, which have different
// settings in different tests so it's been moved to it's
// own test object so it can be called only by the tests
// that don't already have more specific delete() tests.
module.exports.events = {
	/**
	 * @param {SubscribableMap} map 
	 */
	delete: (map) => {
		/**
		 * @param {SubscribableMap.SubscribeCallbackData} e
		 */
		let handleEvent = jest.fn();
		test('subscribers receive callbacks for delete()', () => {
			map.subscribe(handleEvent);
			map.delete('test');

			expect(handleEvent).toHaveBeenCalledTimes(1);
		});
	}
}

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