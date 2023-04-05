const util = require('util');
const SubscribableMap = require('./index.js');

let map = new SubscribableMap({
	cooldown: 5000,
	initialValue: [
		['initial', 'value']
	]
});

console.log('initial value', map.serialize());

map.subscribe((s) => {
	console.log('normal', s);
});

map.subscribe((s) => {
	console.log('bypass', s);
}, true);

async function wait(ms) {
	return util.promisify(setTimeout)(ms);
}

async function example() {
	map.set('test', 'ing');
	map.set('no', false);
	map.set('no', 'you shouldn\'t see this in normal subscriptions');
	await wait(5000);

	map.set('test', '1234');
	map.set('nope', 'this is a string');
	map.set('nope', 'you shouldn\'t see this in normal subscriptions');
	await wait(5000);

	map.set('testing', '5678');
	map.set('test', 'ing');
	map.set('test', '1234');
	map.delete('test');
	await wait(5000);

	map.delete('testing');

	console.log(map.serialize());
}

example();