# SubscribableMap

SubscribableMap, as the name suggests, extends the Map class and calls a function when a value is changed.

# Installation

```sh
npm i -S subscribablemap
```

# Usage

SubscribableMap extends the Map class, so the same API is available. However, overridden methods may work slightly differently to the Map API. The following methods have also been added:
- subscribe(fn, [bypassCooldown]): Subscribes to changes. By default, the cooldown is respected when emitting events. This can be changed by setting `bypassCooldown` to false.
- unsubscribe(fn): Unsubscribes from change events.
- getSubscribers(): Gets the subscriber Set
- getOpts(): Gets the options passed in the constructor
- serialize(): Returns a key-value array (`[ ['key', 'value'] ]`) from the data in the Map

The constructor takes the following options object:
- cooldown: By setting this option, you can restrict SubscribableMap to only sending one event per key per time specified (in milliseconds) here.
- deleteBypassesCooldown: By default, delete()/clear() bypass the cooldown. You can change this option so that delete() does not bypass the cooldown.
- initialValue: If you'd like to initialize the Map with values, you can pass them here as a key-value array.

```js
const SubscribableMap = require('subscribablemap');

let map = new SubscribableMap();

map.subscribe((s) => {
	// Returns: { event: 'set', key: 'test', value: 'ing' }
	// Key will be undefined if this is a clear event.
	// Value will be undefined if this is a clear/delete event.

	// If you have different code for different events, it is
	// advisable to check if the event equals an enum in
	// SubscribableMap.enum (e.g. s.event === SubscribableMap.enum.SET).

	console.log(s);
});

map.set('test', 'ing');
```

**Important:** Only the `set()`, `delete()`, `clear()` methods will dispatch events. You can pass a boolean set to false as the last parameter to these methods to suppress the event for that update.