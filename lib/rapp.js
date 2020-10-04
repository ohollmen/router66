/**
 * 
 * TODO:
 * - Facilitate configs (e.g. grid, chart) and decide how / from where they sould come
 *   (e.g. from par. app or data cache, by symname, )
 * - Consider app (parentable) and some "global" settings coming from there (e.g. grid,chart).
 * - Allow pre-loading templates to cache, search key *first* from there (recommend t_ prefix).
 */
var rapp = {};
var Mustache;
var docIndex;
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
  if (p && Mustache) { cont = Mustache.render(cont, p); }
  if (tgtid) {
    // TODO: Tolerate '#"
    var el = document.getElementById("#"+tgtid);
    if (!el) { alert("No element found for target "+ tgtid); }
    else { el.innerHTML = cont; } // Set content
  }
  return cont;
};
rapp.contbytemplate = contbytemplate;
rapp.templated = contbytemplate;
// Detect valid callable function
rapp.isfunc = function (cb) {
  if (!cb) { return 0; }
  if (typeof cb != 'function') {return 0; }
  return cb;
}
/***** Cfg Data */
rapp.chartcfg = { responsive: true, legend: {position: 'top', display: true },
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
/***** Handlers *********/
rapp.nop = function (ev, act) { console.log("Running NON-OP handler"); };

rapp.fetchgrid = function (ev, act) {
  console.log("fetchgrid URL:", act.dataurl);
  //$('#vtitle').html(act.name);
  var url = act.genurl ? act.genurl(act) : act.dataurl;
  axios.get(url).then( function (response) {
    var arr = response.data; // AoO
    if (!arr || !Array.isArray(arr)) { return alert("No data"); }
    // showgrid("content", arr, fi.builds); // fi.change
    document.getElementById('content').innerHTML = contbytemplate(act.tmpl, act);
    //showgrid(act.gridid, arr,  fi[act.gridid]); // 
    var cfg = rapp.dclone(rapp.gridcfg);
    var fi = window.fi; // Alt fields "cache" ? || rapp.fi || 
    cfg.data = arr; cfg.fields = fi[act.gridid];
    $("#" + act.gridid).jsGrid(cfg);
    //console.log(JSON.stringify(arr, null, 2));
  })
  .catch(function (error) { console.log(error); });
};

// Route time handler
rapp.showchart = function (ev, act) {
  //var title = act.name;
  //$('#vtitle').html(act.name);
  // Make this into 
  document.getElementById('content').innerHTML = contbytemplate("t_wait", null);
  //showchart2(act, null);
  var ctx;
  var url = act.genurl ? act.genurl(act) : act.dataurl;
  console.log("showchart url: "+url);
  //console.log(act);
  // act.dataurl+"?proj="+v
  axios.get(url).then( function (resp) {
    var data = resp.data;
    if (!data) { alert("No data"); return; }
    // Orig loc for setting template. Late for many things. Try earlier
    document.getElementById('content').innerHTML = contbytemplate(act.tmpl, null);
    if (act.setupui && 1) { act.setupui(act); } // && isfunc // //makechartsui(act);

    try { ctx = document.getElementById("chart1").getContext('2d'); } catch (ex) {}

    if (data.title) { $('#vtitle').html(data.title); } // Overr
    if (charts["btimes"]) { charts["btimes"].destroy(); }
    var chtype = act.chtype || data.typehint || 'line';
    var copts2 = rapp.dclone(rapp.chartcfg); // copts
    if (act.ns) { copts2.scales.yAxes = []; } // yAxes delete(copts2.scales);
    if (act.cmod) { copts2 = act.cmod(data, copts2); } // Chart opts mod
    
    console.log("Chart type: "+chtype);
    charts["btimes"] = new Chart(ctx, { type: chtype, data: data, options: copts2 });
  });
};

rapp.showdocindex = function (ev, act) {
  document.getElementById('content').innerHTML = contbytemplate(act.tmpl, act);
  //$('#vtitle').html(act.name);
  if (!docIndex) { return alert("No docIndex module loaded"); }
  // Mimick flow from docindex_main.js
  var cfg = new docIndex({acc: 0, linkproc: "post", pagetitleid: "dummy", debug: 1});
  docIndex.ondocchange = function (docurl) { console.log("DOC-CHANGE: "+docurl); location.hash = '#nop'; };
  var url = act.idxurl || act.url || "docindex.json";
  //if () {}
  $.getJSON(url, function (d) {
    console.log(d);
    cfg.initdocs(d);
  });

};

rapp.showtmpl = function (ev, act) {
  //$('#vtitle').html(act.name); // Move...
  if (!act.dataurl) { return runtempl(null); }
  axios.get(act.dataurl).then( runtempl );
  function runtempl (resp) {
    var data = null;
    if (resp) { data = resp.data.data; }
    document.getElementById('content').innerHTML = contbytemplate(act.tmpl, data);
    if (act.setupui && typeof act.setupui == 'function') { act.setupui(); }
  }
};


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
    if (dl.respisdata) { return resp; } // For Jquery (others ?)
    if (!resp.data) { throw "No data in response (client: "+dl.hgc+")"; }
    // Support auto-detect special case - a member "data" in resp.data OR mandate custom this.respdata for this ?
    //if (resp.data.data) { return resp.data.data; }
    return resp.data;
  }
  if (this.respdata) { respdata = this.respdata; }
  var loaditem = function(ditem, cb) {
    axios.get(ditem.url).then(function (resp) {
      // Allow storing in results array ?
      if (this.arr) { dstore.push(respdata(resp)); }
      else if (dl.useitemkey) { ditem[this.useitemkey] = respdata(resp); }
      else { dstore[ditem.id] = respdata(resp); }
      cb(null, 1);
    })
    .catch(function (err) { throw "Failed to load item: "+err; });
  }
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
    .fail(function (jqXHR, textStatus, errorThrown) { throw "Failed to load item: "+textStatus; });
  }
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
        var ct = xhr.getResponseheader("Content-Type");
        // Completion-only status analysis
        if (xhr.status == 200) {
          if (ct.match(/\bjson\b/)) { cb(JSON.parse(xhr.responseText)); }
          else { cb(xhr.responseText); }
        }
        // Any non-200 status is not okay.
        else { cb(null); }
      }
      
    };
    xhr.onreadystatechange = onrsc;
    xhr.send(); // No body on GET
    
  };
  if (this.hgc == 'jq')  { loaditem = loaditem_jq; }
  if (this.hgc == 'xhr') { loaditem = loaditem_xhr; }
  async.map(this.ditems, loaditem, function (err, results) {
    if (err) { var errstr = "load(): Loading Failed: " + err; console.log(errstr); return cb(errstr, null); }
    cb(null, results);
  });
}

//DataLoader.load = 
