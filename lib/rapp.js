/**
 * 
 * TODO:
 * - Facilitate configs (e.g. grid, chart) and decide how / from where they sould come
 *   (e.g. from par. app or data cache, by symname, )
 * - Consider app (parentable) and some "global" settings coming from there (e.g. grid,chart).
 * - Allow pre-loading templates to cache, search key *first* from there (recommend t_ prefix).
 * ## Notes
 * Every handler must re-generate all they need in "main view div"
 * It's likely other handlers will wipe everything out in "main view div"
 * With collaboration scheme between handlers OR prehdlr you maye be able to circumvent above.
 * ## TODO
 * - Determine a more definitive de-facto (variable) location for cached data (datasets) and
 *   modify associated lookups (e.g. in rapp.showtmpl)
 * - Create an error message wrapper that will choose best error popup
 *   strategy from runtime ... toastr, alert()
 */
var rapp = {}; // TODO: { cfg: {} } include runtime detection for certain comps.
var Mustache;
var Chart;
var docIndex;
var window;
var XMLHttpRequest;
var async;

var fi; // Field Index
var charts; // Charts created
/**** Utils ********/
rapp.dclone = function(d) { return JSON.parse(JSON.stringify(d)); };
var contbytemplate = function (tmplid, p, tgtid) {
  var cont;
  var dcache = rapp.dcache; // Alternative data cache to lookup from (Not DOM)
  // Having hash-mark should imply HTML element, not k-v cache and
  // thus avoid cache lookup (see: "else if" below)
  if (tmplid.match(/^#/)) { tmplid = tmplid.substr(1); }
  else if (dcache && dcache[tmplid]) {
    cont = dcache[tmplid];
    // .. by key "+tmplid+ ...
    if (typeof cont != 'string') { return alert("Cached template is not a string ( a must for a template)"); }
    // Skip to render or return cont
  }
  if (!cont) {
    var el = document.getElementById(tmplid);
    console.log("contbytemplate "+tmplid+" => el:" + el);
    if (!el) { return alert("No template by " + tmplid); }
    cont = el.innerHTML;
  }
  // Common check
  if (!cont) { return alert("No content for template from dcache or DOM elem. (by: '" + tmplid + "')"); }
  // Look for multiple template engines (in order ?)
  // OR: register universal rapp.render func, which is from one of the
  // template engines render function with sign: (tmplstr, paramdata)
  // Do NOT reqire parameters ?
  // p && 
  if (Mustache) { cont = Mustache.render(cont, p); }
  if (tgtid) {
    // Tolerate '#"
    if (tgtid.match(/^#/)) { tgtid = tgtid.substr(1); }
    let el = document.getElementById(tgtid);
    if (!el) { alert("No element found for target "+ tgtid); }
    else { el.innerHTML = cont; } // Set content
  }
  return cont;
};
rapp.contbytemplate = contbytemplate;
rapp.templated = contbytemplate;
/*
function contbytemplate(tmplid, p, tgtid) {
  console.error("DISCONTINUED: contbytemplate. Use rapp.templated()");
  return rapp.templated(tmplid, p, tgtid);
}
*/
// Detect valid callable function
rapp.isfunc = function (cb) {
  if (!cb) { return 0; }
  if (typeof cb != 'function') {return 0; }
  return cb;
};
rapp.findact = function (acts, aid) {
  var act = acts.filter((a) => { return a.path == aid; })[0];
  if (!act) { alert("No act:" + aid); return null; }
  return act;
};
/***** Cfg Data */
rapp.chartcfg = {
  responsive: true,
  legend: {position: 'top', display: true }, // display: false
  scales: { // yAxes stacked
    XXxAxes: [{ stacked: true, }],
    yAxes: [{ stacked: true }]
  }
};
rapp.gridcfg = { // "#jsGrid"
    // TODO: Eliminating 100% makes 2 latter tabs out of 3 not show !
    width: "100%",
    //height: "400px",
    pageSize: 100,
    //inserting: true,
    //editing: true,
    sorting: true,
    paging: true,
    filtering: true,
    
    data: null, // griddata,
 
    //controller: db,
    // rowClass: function (item,itemidx) { return "redhat"; },
    // rowClick: function (evpara) { alert("Row Click !"); },
    fields: null // fields
  };

// Access data from within resp
// TODO: Make another accessor (or overload this) to allow
// finding chart data that is NOT array ? OR Keep this to
// array-only. Finding object is much trickier. One option is to
// pass set of object keys as "object signature" (e.g. "labels","datasets")
// to find appropriate object.
rapp.respdata = function (resp) {
  var d = resp.data;
  if (!d) { alert("No data in response"); return null; }
  // Assume array to always be the data
  if (Array.isArray(d)) { return d; }
  // Look "standard" response with member "data".
  if (d.status && d.data) { return d.data; }
  // Probably just d
  return d;
};
// Try to find grid definition from the response data.
rapp.find_griddef = function (respdata) {
  // Must find in object, not Array
  if (Array.isArray(respdata)) { return null; }
  var gd = respdata.fdef || respdata.flddef || respdata.fields;
  // Must be Array
  if (Array.isArray(gd)) { return gd; }
  // if (gd) { return gd; }
  return null;
};
/***** Handlers *********/
rapp.nop = function (ev, act) { console.log("Running NON-OP handler"); };

rapp.fetchgrid = function (ev, act) {
  
  var tgtid = ev.viewtgtid || 'content';
  // Pre-template here ? Or enough if in axios().then() before $().jsGrid()
  
  var initurl = act.dataurl || act.url;
  var url = act.genurl ? act.genurl(act) : initurl; // urlpara ?
  console.log("fetchgrid URL:", url);
  axios.get(url).then( function (resp) {
    //var arr = resp.data; // AoO
    var arr = rapp.respdata(resp);
    if (!arr || !Array.isArray(arr)) { return alert("No data for "+act.name+" ... or not an Array"); }
    // showgrid("content", arr, fi.builds); // fi.change
    rapp.templated(act.tmpl, act, tgtid);
    
    var cfg = rapp.dclone(rapp.gridcfg);
    cfg.data = arr;
    // Let Register fsets w. rapp (rapp.fsets ?. Provide accessor to get set.
    // See what fallback options we need here ?
    var fi = window.fi || window.fldinfo; // Alt fields "cache" ? || rapp.fi || 
    if (!fi) { return alert("No field configuration (index) for grid"); }
    /////////////// NEW
    
    // Griddef in response ?
    var gd = rapp.find_griddef(resp.data);
    if (gd) { cfg.fields = gd; }
    else {
      var fid = act.fsetid || act.gridid; // NOTE: act.fsetid not necessarily same as act.gridid
      cfg.fields = fi[fid];
    }
    if (!cfg.fields) { return alert("No field configuration for grid"); }
    // Gridmod - after fields are discovered
    if (act.gridmod) { act.gridmod(cfg.fields); console.log("MODDED:", cfg.fields); }
    //showgrid(act.gridid, arr,  fi[fid]); // 
    $("#" + act.gridid).jsGrid(cfg);
    //console.log(JSON.stringify(arr, null, 2));
    var us = act.setupui || act.uisetup;
    // NO yet another pass of templating here
    if (us && (typeof us == 'function')) { us(act, arr); }
  })
  .catch(function (error) { console.log(error); })
  .finally(() => {  });
};

// Route time handler
// TODO: Check naming for "genurl" vs "urlpara"
rapp.showchart = function (ev, act) {
  var tgtid = ev.viewtgtid || 'content';
  // Spin: 
  //rapp.templated("t_wait", null, tgtid); // TODO: eliminate
  var ctx;
  var initurl = act.dataurl || act.url;
  var url = initurl; // Good default
  // var gen = act.genurl || act.urlgen || act.urlpara;
  // OLD: (act) NEW: (ev, act)
  if (act.genurl) { url = act.genurl(ev, act); } // old ternary : initurl;
  if (ev.urlpara) { url += "?"+ev.urlpara; }
  console.log("showchart url: "+url);
  //if (Spinner && rapp.spinopts) { spinner = new Spinner(spinopts).spin(spel); } // 
  //console.log(act);
  // url+"?proj="+v
  axios.get(url).then( function (resp) {
    //var data = resp.data;
    var data = rapp.respdata(resp);
    if (!data) { alert("No data"); return; }
    if (Array.isArray(data)) { return alert("Array data is no good for Chart (must have chart object)"); }
    // Orig loc for setting template. Late for many things. Try earlier
    rapp.templated(act.tmpl, act, tgtid); // NEW: null => act
    // Moved later !!
    //var us = act.setupui || act.uisetup;
    //if (us) { us(act, data); } // && isfunc // //makechartsui(act);
    var cid = ev.chartid || act.chartid  || 'chart1'; // TODO: Elim. chart1
    if (!cid) { return alert("No chart element id found from event or action"); }
    console.log("Look for chart elem: "+cid);
    try { ctx = document.getElementById(cid).getContext('2d'); }
    catch (ex) { console.log("Error getting chart graphics context: "+ex); return; }
    // Should be part of uisetup ??? YES.
    // if (data.title && ev.vtitleid) { $('#'+ev.vtitleid).html(data.title); } // Overr
    // TODO: get rid of this logic but ensure refresing charts behave correctly
    // Use act.???
    if (charts["global"]) { charts["global"].destroy(); }
    
    var chtype = act.chtype || data.typehint || 'line';
    var copts2 = rapp.dclone(rapp.chartcfg); // copts
    if (act.ns) { copts2.scales.yAxes = []; } // yAxes delete(copts2.scales);
    // NOTE: act.cmod() may make yet another clone. Document copts2 as cloned ... discourage cloning
    if (act.cmod) { copts2 = act.cmod(data, copts2); } // Chart opts mod
    
    console.log("Chart type: "+chtype+ ", Data(as): "+data+", copts: "+copts2);
    // Use cloned options
    charts["global"] = new Chart(ctx, { type: chtype, data: data, options: copts2 });
    // UI setup ?
    var us = act.setupui || act.uisetup;
    // NO yet another pass of templating here before uisetup.
    if (us && (typeof us == 'function')) { us(act, data); }
  });
};

rapp.showdocindex = function (ev, act) {
  var tgtid = ev.viewtgtid || 'content';
  rapp.templated(act.tmpl, act, tgtid);
  if (!docIndex) { return alert("No docIndex module loaded"); }
  // Mimick flow from docindex_main.js
  var cfg = new docIndex({acc: 0, linkproc: "post", pagetitleid: "dummy", debug: 1, nosidebarhide: 1});
  docIndex.ondocchange = function (docurl) { console.log("DOC-CHANGE: "+docurl);  }; // location.hash = '#nop';
  var url = act.idxurl || act.url || "docindex.json";
  // TODO: Use dataloader impl ?
  $.getJSON(url, function (d) {
    console.log(d);
    cfg.initdocs(d);
  });
  /**
  axios.get(url).then(function (resp) {
     var d = rapp.respdata(resp);
     cfg.initdocs(d);
  }.catch((ex) => { console.error("Error loading docindex: "+ex);});)
  */

};
// Only show template, with data (async) or w/o data (sync)
rapp.showtmpl = function (ev, act) {
  var tgtid = ev.viewtgtid || 'content';
  var data = act.data || null; // TODO: cache / datasets
  var url = act.dataurl || act.url;
  // TODO: simulate reponse:
  var simresp = {data: {data: data}}; // OR just {data: data} 
  // Synchronous case
  if (!url && data) { return runtempl(simresp); } // NONEED: null => data ?
  axios.get(url).then( runtempl )
  .catch((ex) => { console.log("Error loading data for "+act.name+": "+ex); });
  function runtempl (resp) {
    
    if (resp && resp.data) {
      //data = resp.data.data; 
      data = rapp.respdata(resp);
    }
    rapp.templated(act.tmpl, data, tgtid);
    // UI Setup
    var us = act.setupui || act.uisetup;
    if (us && (typeof us == 'function')) { us(act, data); }
  }
};

////////////// Dataloader ///////////////
var axios; var $;
/** Create dataloader for a set of web app assets.
 * 
 * TODO: Ensure uniqueness of items by id
 */
function DataLoader(ditems, opts) {
  opts = opts || {};
  if (!async) { console.log("DataLoader: No async available"); throw "No async !"; }
  if (!Array.isArray(ditems)) { throw "Data items not in an array"; }
  // Check id and url
  //ditems.forEach(function (ditem) { if (!ditem.url) { throw "No url for item"; }});
  this.ditems = ditems;
  if (opts.dstore) {
    if (typeof opts.dstore == 'string') { this.useitemkey = opts.dstore; }
    // Allow Array ?
    //else if (Array.isArray(opts.dstore)) { this.dstore = opts.dstore; this.arr = 1; }
    // TODO: Very specifically {}-object (not null, boolean, ...)
    else if (typeof opts.dstore == 'object') { this.dstore = opts.dstore; }
    
    else { throw("No info on where to store data (cache object or key name in ditems)"); }
  }
  else { opts.dstore = {}; }
  // TODO: Allow custom cb to get data from axios response.
  if (opts.respdata) { this.respdata = opts.respdata; }
  // Detect early the AJAX/HTTP toolkit we'll use (hgcb = HTTP GET callback, hgc = http get client)
  this.respisdata = 0;
  if (axios && axios.get) { this.hgc = 'ax'; } // Prefer axios as "more special"
  else if ($ && $.get) { this.hgc = 'jq';  this.respisdata = 1; }
  else                 { this.hgc = 'xhr'; this.respisdata = 1; }
  // else { throw "No HTTP Client detected "; } // TODO: Embedded client ?
  console.log("DataLoader construction complete for client: "+this.hgc);
}
/** 
 */
DataLoader.prototype.load = function (cb) {
  if (!cb) { throw "No callback (to call after loading)"; }
  var dl = this;
  var dstore =  this.dstore;
  if (!dstore) {}
  var respdata = function (resp) {
    console.log("respdata: client " + dl.hgc);
    // NOTE (new): Simulate axios structure for others as we do valuable detection checks below (i.e. share them).
    if (dl.respisdata) { resp = {data: resp}; } // For Jquery (others ?) OLD: return resp;
    if (!resp.data) { throw "No data in response (client: "+dl.hgc+")"; }
    // Support auto-detect special case - a member "data" in resp.data OR mandate custom this.respdata for this ?
    if (resp.data && resp.data.data && resp.data.status) { return resp.data.data; }
    return resp.data;
  };
  if (this.respdata) { respdata = this.respdata; }
  
  var loaditem = function(ditem, cb) {
    axios.get(ditem.url).then(function (resp) {
      // Allow storing in results array ?
      if (this.arr) { dstore.push(respdata(resp)); }
      else if (dl.useitemkey) { ditem[this.useitemkey] = respdata(resp); }
      else { dstore[ditem.id] = respdata(resp); }
      cb(null, 1);
    })
    .catch(function (err) { cb("Failed to load item: "+err, null); }); // throw ...
  };
  // As of jQuery 3.0 .success() and .error() are depreciated. use .done() and .fail() instead
  var loaditem_jq = function(ditem, cb) {
    $.get(ditem.url).done(function (resp) { // .success() / .done ?
      // Allow storing in results array ?
      if (this.arr) { dstore.push(respdata(resp)); }
      else if (dl.useitemkey) { ditem[this.useitemkey] = respdata(resp); }
      else { dstore[ditem.id] = respdata(resp); }
      cb(null, 1);
    })
    // .error() .fail ?
    .fail(function (jqXHR, textStatus, errorThrown) { cb( "Failed to load item: "+textStatus, null); }); // throw
  };
  // Use "raw" XHR w/o external dependencies.
  var loaditem_xhr = function (ditem, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', ditem.url);
    //xhr.setRequestheader(name, val); // No special headers ?
    var onrsc = function () {
      var rs = xhr.readyState;
      console.log("rs: " + rs);
      // Every request should go through state 4
      if (rs == 4) {
        var ct = xhr.getResponseHeader("Content-Type");
        // Completion-only status analysis
        if (xhr.status == 200) {
	  // TODO: Catch errors from parsing
          if (ct.match(/\bjson\b/)) {
	    var j;
	    try { j = JSON.parse(xhr.responseText); } catch(ex) { return cb(ex.toString(), null); }
	    return cb(null, j);
	  }
          else { cb(null, xhr.responseText); }
        }
        // Any non-200 status is NOT okay.
        else { cb("Error: non-200 response: "+xhr.status, null); }
      }
      
    };
    xhr.onreadystatechange = onrsc;
    xhr.send(); // No body on GET
    
  };
  if (this.hgc == 'jq')  { loaditem = loaditem_jq; }
  if (this.hgc == 'xhr') { loaditem = loaditem_xhr; }
  async.map(this.ditems, loaditem, function (err, results) {
    if (err) { var errstr = "load(): Loading (of some items) Failed: " + err; console.log(errstr); return cb(errstr, null); }
    cb(null, results);
  });
};

//DataLoader.load = 
