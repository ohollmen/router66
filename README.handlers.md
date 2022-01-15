# About Routed-app ("rapp") Handlers

The `lib/` directory of router66 contains rapp.js, which contains
a small framework to create applications that implement certain
simple often-encountered functionalities like:

- Creating Pages with Grids
- Creating single views
- Creating Charts
- ...

## Built in handlers


### rapp.fetchgrid

- url (str) - Data URL
- tmpl (str) - Template for the view (with grid element in it)
- gridid (str) - Grid id (for div-element) to create grid into.
  Note: Templating can use this action parameter to create element with correct id.
- fsetid (str) - fieldset id for fetching gridfields definition from global
  grid definition index. If not give, it is assumed to be found by key given
  in `gridid`.
- gridmod (function) - Grid fields modification callback function called with `(griddef)` (Name should have a hint of griddef?)

rapp tries to discover a grid definition from response

### rapp.showchart

Creates a chart.js (2.*.*) view with datqa coming from server (or datasets ?).

Extended action pops:

- url (str) - Chart (JSON) data URL
- tmpl (str) - Template element id or datasets (cache) data-id for templates
  (both are looked up in order cache, eleme)
- canvasid (str) - The HTML canvas element id, where chart should be
  rendered
- chmod (function) - Chart modification callback called with `(data, copts)`
  and assigned back to caller copts to modify chart options.
  - This can be used for actually changing opts or to e.g. debug both `data`
    and `copts`.
  - Because `data` is passed, data can be also modified
  - Note: The chart options in `copts` is already cloned from
    global template config held in rapp.chartcfg, so there is no need to
    create a yet another clone here.
  - **Note on possible API change**: eliminate returning "new" config, as there
    is no need to have a new config created.
- uisetup (function) - Like general uisetup, but here the data
  parameter is the chartjs data object (with labels, datasets).

### rapp.showtmpl

Show (Mustache) templated view with data coming from an url

- url (str) - Data URL for templating data
- tmpl (str) - Template elem. id or datasets cache id
- TODO: datakey - The key in datasets to get already cached data from

TODO: Allow fetch-once and cache case (must have url and datakey).

## Cross Cutting Concerns

- Templating to app "main view" (view element id should come from event/pre-handler
   for maximum flexibility, e.g. treating main view or (Jquery UI) tab as equals)
- Data loading "wait" spinner (starting and stopping)
- Finding appropriate data from response (heuristically, flexibly,
  either array or object particularly, by action type)
- Being able to deal with already cached data (sync) or http fetched data
  (async)
- Being able to execute the same action (w/o refreshing view) by a
  sub-navigation menu (use same styling as for main navigation)
  - Usually involves adding/appending someting to server side URL to
    differentiate the data URL. url-generator / url-parametrizer
    plays a big part here
- Uisetup: Every action (of any action type) should be able to hook a
  "uisetup" function (called with `(act, data)`) so that this view can
  trigger operations, actions on the GUI, which change state of GUI, etc
  (load more data, replace existing data, etc).
