/* Router66 -
Scenic routing for your web views
Simple Routing for your scenic web app views
Scenic SPA web router
*/


/** @file


*/

/** Create new router.

Options in opts:
- **defpath** - default route path to route to when application starts. Should be exactly one of paths added later (by add() method).
- **debug** - Produce verbose output in console (for development and learning purposes)
@todo Add possibility to resolve handlers from a "namespace object" with string names mapped to functions (possibly several or dot.notation ?).
*/
function Router66(opts) {
  
  var defopts = {pathattr: "path", hdlrattr: "hdlr", nameattr: "name", defpath: "/", "debug": 0};
  opts = opts || defopts;
  var debug = opts.debug || 0;
  var coreprops = ["pathattr","hdlrattr", "nameattr", "defpath", "noactcopy"];
  coreprops.forEach(function (p) { if (!opts[p]) { opts[p] = defopts[p]; } });
  
  debug && console.log("Options after merge w. defaults: "+JSON.stringify(opts));
  Object.keys(opts).forEach(function (p) { this[p] = opts[p]; }, this);
  this.routes = {};
  this.routesarr = [];
  // this.debug = 0;
  debug && console.log("Router66 (v. "+Router66.VERSION+") instance:", this);
}

Router66.parapatt = /(:(\w+))/g; // Parameter pattern
Router66.pprepl = '([^\/]+)'; // Not used ??
Router66.VERSION = "0.0.1";

/** Add route path and handler to router routing table.
* Can alternatively accept a set of actions describing routes.
* Create regexp and pre-cache it in action for fastest possible routing.
* Whether action is added as-is or deep copied to not alter original action
* depends on option "noactcopy" in construction options.
* 
* @param path - Route path as RegExp string or fixed path
* @param hdlr - Route handler callback
* @param name - Optional Displayable (short) name for route
*/
Router66.prototype.add = function (path, hdlr, name) {
  var debug = this.debug;
  if ((arguments.length == 1) && Array.isArray(path)) {
    this.debug && console.log("add: Got Array to add (" + path.length + " items)");
    // var self = this; // Not needed
    path.forEach(function (it) {
      if (this.noactcopy) { this.addact(it); return; }
      this.add(it[this.pathattr], it[this.hdlrattr], it[this.nameattr]);
    }, this);
    debug && console.log("add(batch): ", this.routesarr);
    return;
  }
  //console.log("Add path:" + path);
  // this.debug && console.log(JSON.stringify([arguments[0], arguments[1], arguments[2]]));
  var act = { path: path, hdlr: hdlr }; // name: (name ? name : "Route for " + path)
  if (name) { act.name = name; }
  debug && console.log("add: Action node created: ", act);
  ////////////// TODO: Extracted addact() to separate method ... ///////////////
  this.addact(act);
  
};


/** Add ready-to-go action (or action set) to router.
* Stores path-match Regexp to action node ("pathre" member)
* Updates Router path index (with non-parametric route paths)
* @param act {object} - Routable action object with path, handler callback and optional name.
*/
Router66.prototype.addact = function (act) {
  var debug = this.debug;
  if (typeof act !== 'object') { throw "Action is not an object !"; }
  if (typeof act.hdlr !== 'function') { throw "Action handler is not an callable function !"; }
  if (act.path.match(/\^/)) { throw "Do not include caret (^) in path"; }
  if (act.path.match(/\$/)) { throw "Do not include sigil ($) in path"; }
  // TODO: Replace parameter notation
  try {
    var ppmatch = act.path.match(Router66.parapatt); // All by 'g'
    let path = act.path;
    if (ppmatch) {
      act.pnames = [];
      debug && console.log("add: Has "+ ppmatch.length +" params in path: " + path);
      path = path.replace(Router66.parapatt, function(match, p1, p2, off) { // TODO: path vs. act.path
        var arr = [match, p1, p2, off]; // p2 is the param tag. arr is wasted (!?)
        debug && console.log("add: replace: Got: " + arr);
	act.pnames.push(p2);
        return '([^\/]+)';
      });
      debug && console.log("add: Converted orig path to parametric: " + path);
    }
    // Treat even static paths as RE-matchable (?). This makes dispatching simplier.
    act.pathre = new RegExp("^"+path+"$");
    debug && console.log("add: Created and added static path RegExp (pathre): " + act.pathre);
  } catch (ex) { console.log(ex.message + " in " + path); }
  // Add path to routes table
  if (this.routes[act.path]) { console.error("Routing for path '"+act.path+"' already exists, not adding "); return; }
  this.routes[act.path] = act; // OLD: hdlr, NEW: act
  this.routesarr.push(act);
}; // addact

/** Handle dispatch routing event.
 * As the nature of event is "hashchange" on browser URL line, the target
 * of event is (always?) Window, which is not useful info. Unfortunately,
 * the element that (... dictated the routing is often not meaningful as ...)
 * @todo Call handler in a try/catch block ?
 * @todo Use path-action-index and divide path matching to 2 parts: lookup in static path index and RE-match for parametric routes ?
 */
Router66.prototype.route =  function (ev) { // ev
  //console.error("Route ev:", ev);
  var path = (location.hash || '#').substr(1);
  var def = 0;
  if (!path) { path = this.defpath; def = 1; }
  this.debug && console.log("route: Execute routing for '"+path+"' (def:"+def+")");
  //var act = acts.filter(function (act) {
  //  return act.path == path;
  //})[0];
  //if (!act) { alert("Act not found"); return; }
  //act.hdlr(ev);
  // Match path
  var routes = this.routes;
  var routesarr = this.routesarr;
  var hdlr;
  //for (rpath in routes) {
  //  var re = new RegExp("^"+rpath+"$");
  //  console.log("Got re:" + re);
  //  //if (path === rpath) { hdlr = routes[rpath]; break; } // Literal comp
  //  if (path.match(re)) { hdlr = routes[rpath]; break; }
  //}
  var act;
  var marr;
  // 
  for (var i =0; i < routesarr.length; i++) {
    act = routesarr[i];
    //(debug > 1) && console.log("route: Try match: " + act.pathre);
    if ( marr = path.match(act.pathre) ) { hdlr = act.hdlr; marr.shift(); break; }
  }
  if (hdlr) {
    this.debug && console.log("Routing using: " + act.pathre + " X-Params: " + marr + " names: " + act.pnames);
    var params;
    // AND 
    if (act.pnames) { params = this.mkparams(act, marr); }
    ev.params = params;
    hdlr(ev, act);
    return; // false
  }
  // No matching path or no handler present
  console.error("route: Could not do routing properly for path (missing path or hdlr ?): " + path);
  // TODO: (Based on config ?) Allow default route or routing error handler to take over.
  //if (this.errhdlr) { this.errhdlr(ev, act); }
  // if (this.errusedefault) { location.hash = '#' + this.defpath; }
}
/** Make routing url derived parameters combining the parameter names from actions
* and values extracted from URL.
*/
Router66.prototype.mkparams = function (act, marr) {
  var params = {};
  if (act.pnames.length != marr.length) { throw "mkparams: Param k-v count mismatch."; }
  for (var i = 0;i < act.pnames.length;i++) { params[act.pnames[i]] = marr[i]; }
  this.debug && console.log("Route params: ", params);
  return params;
};
/** Start Routing on URL line hash changes.
* Routing can be started after setting up all 
*/
Router66.prototype.start = function () {
  // Check / Validate default path
  location.hash = '#'; // Safe to change / set, no listener yet
  
  var act = this.routes[this.defpath];
  if (!act) { throw "start: Could not lookup action for default route path ("+this.defpath+")!"; }
  var hdlr = act.hdlr;
  if (!hdlr) { throw "start: Default Route Not Properly Configured (" + this.defpath + ")"; }
  var self = this; // For onchange
  // 
  var onchange = function (ev) {
    // if (self.pre) { self.pre(); } // In route() ?
    self.route(ev);
    // Similar post
  }; // return false ?
  window.addEventListener("hashchange", onchange, false);
  // Change to default ?
  this.debug && console.log("start: Set default path/route: "+this.defpath);
  location.hash = this.defpath; // Auto-dispatches (as ev. listener is set)
  this.debug && console.log("start: START Routing (by UI events) !!!");
};
/** */
Router66.prototype.generate = function (what, acts, opts) {
  var what_opts = {
    "handlers": function () {
      cont = "/* JS route Handlers */\n";
      function replacer(path) { return path.replace(/\W/g, "_"); }
      acts.forEach(function (it) {
        // Parse something or check actid
	var id = (typeof it.hdlr == 'string') ? it.hdlr : replacer(it.path);
        cont += "function hdl_"+id+"(ev, act) {\n\n}\n";
	
      });
      return cont;
    },
    "menu": function () {
      var cont = "<ul id=\"menu\">\n";
      // TODO: Should not generate for parametrized routes
      acts.forEach(function (it) {
        //if (it.path.match(/:\w+/)) { return; }
        cont += "<ul><a href=\"#"+it.path+"\">"+it.name+"</a></ul>\n";
      });
      cont += "</ul>"; return cont; }
  };
  var gencb = what_opts[what];
  if (gencb) { return gencb(); }
  console.error("Don't know how to generate: "+ what);
  return null;
};
