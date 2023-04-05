const { describe, test, expect, jest, beforeEach } = require('@jest/globals');
const { promisify } = require('util');
const SubscribableMap = require('../index.js');
const commonTests = require('./_common.js');

const INITIAL_VALUE = [
	['initial', 'value']
];

const wait = promisify(setTimeout);

var handleEvent = jest.fn((e) => e);
beforeEach(() => {
	jest.clearAllMocks();
});

describe('Initializing without initial value', () => {
	let map = new SubscribableMap();

	commonTests.pre(map);

	commonTests.defaults.noInitialValue(map);
	commonTests.defaults.cooldown0(map);
	commonTests.defaults.deleteBypassesCooldownTrue(map);
	commonTests.defaults.defaultInitialValueBlank(map);

	commonTests.common(map);

	test('no cooldown', async () => {
		map.subscribe(handleEvent);
		map.set('testing', '1234');
		map.set('testing', '5678');
		map.set('testing', '1234');

		expect(handleEvent).toHaveBeenCalledTimes(3);
		expect(handleEvent.mock.lastCall[0].event).toBe(SubscribableMap.enum.SET);
	});
});

describe('Initializing with initial value', () => {
	let iv = INITIAL_VALUE.slice();
	let map = new SubscribableMap({
		initialValue: iv
	});

	commonTests.pre(map);

	test('initial value is stored', () => {
		expect(map.size).toBe(1);
		expect(map.serialize()).toMatchObject(iv);
	});

	commonTests.defaults.cooldown0(map);
	commonTests.defaults.deleteBypassesCooldownTrue(map);
	commonTests.defaults.defaultInitialValueBlank(map);

	commonTests.common(map);


	test('no cooldown', async () => {
		map.subscribe(handleEvent);
		map.set('testing', '1234');
		map.set('testing', '5678');
		map.set('testing', '1234');

		expect(handleEvent).toHaveBeenCalledTimes(3);
		expect(handleEvent.mock.lastCall[0].event).toBe(SubscribableMap.enum.SET);
	});
});

describe('Initializing with cooldown set', () => {
	let map = new SubscribableMap({
		cooldown: 1000
	});

	commonTests.pre(map);

	test('cooldown is set', () => {
		expect(map.getOpts().cooldown).toBe(1000);
	});

	commonTests.defaults.noInitialValue(map);
	commonTests.defaults.deleteBypassesCooldownTrue(map);
	commonTests.defaults.defaultInitialValueBlank(map);

	commonTests.common(map);

	test('has cooldown', async () => {
		map.subscribe(handleEvent);
		map.set('testing', '1234');
		map.set('testing', '5678');
		await wait(1000);
		map.set('testing', '1234');

		expect(handleEvent).toHaveBeenCalledTimes(2);
		expect(handleEvent.mock.lastCall[0].event).toBe(SubscribableMap.enum.SET);
	});

	test('delete bypasses cooldown', async() => {
		map.set('delete-test', '1234');
		map.set('delete-test', '5678');
		map.delete('delete-test');

		expect(handleEvent).toHaveBeenCalledTimes(2);
		expect(handleEvent.mock.lastCall[0].event).toBe(SubscribableMap.enum.DELETE);
	});

	test('clear bypasses cooldown', async() => {
		map.set('clear-test', '1234');
		map.set('clear-test', '5678');
		map.clear();

		expect(handleEvent).toHaveBeenCalledTimes(2);
		expect(handleEvent.mock.lastCall[0].event).toBe(SubscribableMap.enum.CLEAR);
	});
});

describe('Initializing with cooldown set, but deletes do not bypass cooldown', () => {
	let map = new SubscribableMap({
		cooldown: 1000,
		deleteBypassesCooldown: false
	});

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

	test('has cooldown', async () => {
		map.subscribe(handleEvent);
		map.set('testing', '1234');
		map.set('testing', '5678');
		await wait(1000);
		map.set('testing', '1234');

		expect(handleEvent).toHaveBeenCalledTimes(2);
		expect(handleEvent.mock.lastCall[0].event).toBe(SubscribableMap.enum.SET);
	});

	test('delete does not bypass cooldown', async() => {
		map.set('delete-test', '1234');
		map.set('delete-test', '5678');
		map.delete('delete-test');

		expect(handleEvent).toHaveBeenCalledTimes(1);
		expect(handleEvent.mock.lastCall[0].event).toBe(SubscribableMap.enum.SET);
	});

	test('clear does not bypass cooldown', async() => {
		map.set('clear-test', '1234');
		map.set('clear-test', '5678');
		map.clear();

		expect(handleEvent).toHaveBeenCalledTimes(2);
		expect(handleEvent.mock.lastCall[0].event).toBe(SubscribableMap.enum.CLEAR);
	});
});