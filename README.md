# Router66 - Simple Routing for Your Scenic Web App Views

Handle Client side routing in a SPA application in a toolkit / framework independent manner.
The router itself does not have any dependencies and does not carry any inter-relationships
to any particular web frameworks or toolkits.

Example of routing setup sequence for a SPA App:
```
window.onload = function () {
  // Actions to be routed
  var acts = [
    {path: "proclist",  name: "Process List",  hdlr: proclist},
    {path: "procgraph", name: "Process Graph", hdlr: procgraph},
    {path: "hostgrps",  name: "Host Groups Graph",   hdlr: hostgrps},
    // "hostgrps_listing"
    {path: "hostgrps_\\w+",  name: "Host Groups List",   hdlr: hostgrps_listing},
    // TEST Items for paramsters
    {path: "proclist/:proc",  name: "Process List EXTRA",  hdlr: proclist},
    {path: "proclist/:proc/:proc2",  name: "Process List EXTRA",  hdlr: proclist},
  ];
  var router = new Router66({defpath: "hostgrps", debug: 1});
  router.add(acts);
  $.getJSON("/resource.json", function (data) {
    app_setup(data); // Something that must be done before allowing user to navigate meaningfully
    // Only now enable routing (navigating around the app)
    router.start();
    toastr.clear(); /// ... or close spinner
  });
  // Distract user with popup during above data loading
  toastr.info('Welcome to THE App !'); // ... or start spinner
  
};
```

You can setup routes also in a more imperative (one-by-one) / non data-driven way:
```
var router = new Router66({defpath: "hostgrps", debug: 1});
router.add("search", handle_search);
router.add("request/:id", handle_details);
...
router.add("proclist", handle_proclist);
router.start();
```

## Instantiation and API Methods

API aims to impose minimal learning burden on user.

### new Router66(opts) - Constructing Router

Construction accepts router options:

    var opts = {...};
    var router = new Router66(opts);

Routing (responding to hashchange events) does not happen yet at this point and none of the routes (with
paths and handlers) are setup yet.

Constructor options:

- **defpath** - Default path for routing. This path is routed-to when routing is activated with router.start().
- **noactcopy** - When an array of action nodes with "extended/additional properties" is passed, set this to make sure
  that properties beyond path and hdlr are included.

## router.add(path, hdlr) - Adding Routes

Two or more routes should be added by add method. add() method is overloaded to accept:

     router.add(path, hdrlr); // Path and handler
     router.add(path, hdrlr, name); // ... additional (descriptive) name
     router.add([{...}, {...}, {...}]); // Add a set of action nodes (with props "path", "hdlr", "name")

## router.start() - Activate routing

router.start() activates router to start reponding to hashchange events.
You should consider what activating means and when to activate routing in the light of following questions:

- Should I hide navigation before stating routing if there is some time consuming initialization activities done
  for the app (loading data, initializing UI, computational activities) ?
- Should I load some initial data into SPA runtime that app (and thus meaningful routing) depends on or just speeds up application
by loading this (shared?) data later?
- Before starting routing, should I put up a iconic symbol or notify impatient, "eager-to-navigate" user some other way ?

## Action properties

These properties appear as parameters of `router.add(path, hdlr)` method or are used as member names in
in objects of action array in call form `router.add(array_of_actions)`.

- **path** - URL path to route (e.g. "#/adm/remove")
- **hdlr** - Event Handler callback for action (called at routing event)
- **name** - Optional name for the action (3rd param, not directly used by router). May be useful for generating
  navigational HTML elements through which routing often happens (this would happen outside this routing toolkit).

You can also use action nodes that have custom properties with names that do not overlap with router built-in
properties ("path","hdlr","name").
These may greatly help with parametrization of route / action handlers and allow you to create reusable route handlers.
To use this feature pass an option `noactcopy: 1` to router constructor.

## Route Handler interface

All routing action handlers have signature:

    hdlr(ev, act);

where the parameters are:
- **ev** - the very native/traditional JS Client side event complemented with "params" member for route url/path extracted params
  - For JS events see: [Events](https://developer.mozilla.org/en-US/docs/Web/Events) => [Mouse Events](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
  - **ev.params** - Parameters for route URL (*if* route was parameterized route). params member is absent for non-parameteric routes.
- **act** - the action node originally matched for route (And added during initialization of routing with add() method).

###  Imperative routing

Not available via API at this time as router.route(ev) gets called by hashchange events.
Use browser-native construct (e.g.) `location.hash = '#deals';` to trigger hashchange event.
<!-- TODO: router.route_to("/path") with simulated (or modded) event. -->

## Author and License

(C) Olli Hollmen 1998-2020
License: MIT

## References

- https://stackoverflow.com/questions/5367369/named-capturing-groups-in-javascript-regex
- Google: javascript router
