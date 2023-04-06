const { describe, test, expect, jest, beforeEach } = require('@jest/globals');
const { promisify } = require('util');
const SubscribableMap = require('../index.js');
const commonTests = require('./_common.js');

const INITIAL_VALUE = [
	['initial', 'value']
];

const wait = promisify(setTimeout);

var handleEvent = jest.fn((e) => e);

function init(map) {
	beforeEach(() => {
		jest.clearAllMocks();
		map.getSubscribers().forEach((s) => {
			map.unsubscribe(s.fn);
		});
	});
}

describe('Initializing without initial value', () => {
	let map = new SubscribableMap();
	init(map);

	commonTests.pre(map);

	commonTests.defaults.noInitialValue(map);
	commonTests.defaults.cooldown0(map);
	commonTests.defaults.deleteBypassesCooldownTrue(map);
	commonTests.defaults.defaultInitialValueBlank(map);

	commonTests.common(map);
	commonTests.events.noEmitIfFalse(map);
	commonTests.events.delete(map);
	commonTests.settings.noCooldown(map);
});

describe('Initializing with initial value', () => {
	let iv = INITIAL_VALUE.slice();
	let map = new SubscribableMap({
		initialValue: iv
	});
	init(map);

	commonTests.pre(map);

	test('initial value is stored', () => {
		expect(map.size).toBe(1);
		expect(map.serialize()).toMatchObject(iv);
	});

	commonTests.defaults.cooldown0(map);
	commonTests.defaults.deleteBypassesCooldownTrue(map);
	commonTests.defaults.defaultInitialValueBlank(map);

	commonTests.common(map);
	commonTests.events.noEmitIfFalse(map);
	commonTests.events.delete(map);
	commonTests.settings.noCooldown(map);
});

describe('Initializing with cooldown set', () => {
	let map = new SubscribableMap({
		cooldown: 1000
	});
	init(map);

	commonTests.pre(map);

	test('cooldown is set', () => {
		expect(map.getOpts().cooldown).toBe(1000);
	});

	commonTests.defaults.noInitialValue(map);
	commonTests.defaults.deleteBypassesCooldownTrue(map);
	commonTests.defaults.defaultInitialValueBlank(map);

	commonTests.common(map);
	commonTests.events.noEmitIfFalse(map);
	commonTests.settings.cooldown(map);
	commonTests.settings.deleteBypassesCooldown(map);
	commonTests.settings.clearBypassesCooldown(map);
});

describe('Initializing with cooldown set, but deletes do not bypass cooldown', () => {
	let map = new SubscribableMap({
		cooldown: 1000,
		deleteBypassesCooldown: false
	});
	init(map);

	commonTests.pre(map);

	test('cooldown is set', () => {
		expect(map.getOpts().cooldown).toBe(1000);
	});

	test('deleteBypassesCooldown is set', () => {
		expect(map.getOpts().deleteBypassesCooldown).toBe(false);
	});

	commonTests.defaults.noInitialValue(map);
	commonTests.defaults.defaultInitialValueBlank(map);

	commonTests.common(map);
	commonTests.events.noEmitIfFalse(map);
	commonTests.settings.cooldown(map);

	test('delete does not bypass cooldown', async() => {
		map.subscribe(handleEvent);
		map.set('delete-test', '1234');
		map.set('delete-test', '5678');
		map.delete('delete-test');

		expect(handleEvent).toHaveBeenCalledTimes(1);
		expect(handleEvent.mock.lastCall[0].event).toBe(SubscribableMap.enum.SET);
	});

	commonTests.settings.clearBypassesCooldown(map);
});

describe('Initializing with cooldown set, and data will be forcefully emitted after cooldown if changed', () => {
	let map = new SubscribableMap({
		cooldown: 1000,
		forceEmitAfterCooldownIfChanged: true
	});
	init(map);

	commonTests.pre(map);

	test('cooldown is set', () => {
		expect(map.getOpts().cooldown).toBe(1000);
	});

	test('forceEmitAfterCooldownIfChanged is set', () => {
		expect(map.getOpts().forceEmitAfterCooldownIfChanged).toBe(true);
	})

	commonTests.defaults.deleteBypassesCooldownTrue(map);
	commonTests.defaults.noInitialValue(map);
	commonTests.defaults.defaultInitialValueBlank(map);

	commonTests.common(map);
	commonTests.settings.cooldown(map);
	commonTests.settings.deleteBypassesCooldown(map);
	commonTests.settings.clearBypassesCooldown(map);

	test('data will be forcefully emitted after cooldown if data is changed', async () => {
		// This test requires a more controlled test environment to ensure
		// that the other tests do not affect this one.
		let testMap = new SubscribableMap({
			cooldown: 1000,
			forceEmitAfterCooldownIfChanged: true
		});

		testMap.subscribe(handleEvent);
		testMap.set('force-emit-changed', 'test');
		testMap.set('force-emit-changed', 'testing');

		expect(handleEvent).toHaveBeenCalledTimes(1);
		// Sync events can be up to 100ms late
		await wait(1100);
		expect(handleEvent).toHaveBeenCalledTimes(2);
		expect(handleEvent.mock.lastCall[0].event).toBe(SubscribableMap.enum.SYNC);
	});
});