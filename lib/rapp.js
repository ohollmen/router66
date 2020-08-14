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
var fi;
/**** Utils ********/
rapp.dclone = function(d) { return JSON.parse(JSON.stringify(d)); };
rapp.contbytemplate = function (tmplid, p) {
  if (tmplid.match(/^#/)) { tmplid = tmplid.substr(1); }
  var el = document.getElementById(tmplid);
  console.log("contbytemplate el:" + el);
  if (!el) { return alert("No template by " + tmplid); }
  var cont = el.innerHTML;
  if (!cont) { return alert("No content for elem " + tmplid); }
  // Look for multiple template engines (in order ?)
  if (p && Mustache) { cont = Mustache.render(cont, p); }
  return cont;
};
/***** Handlers *********/
rapp.nop = function (ev, act) { console.log("Running NON-OP handler"); };

rapp.fetchgrid = function (ev, act) {
  console.log("fetchgrid URL:", act.dataurl);
  $('#vtitle').html(act.name);
  // 
  axios.get(act.dataurl).then( function (response) { // "/"
    var arr = response.data; // AoOoAoO...
    if (!arr || !Array.isArray(arr)) { return alert("No data"); }
    // showgrid("content", arr, fi.builds); // fi.change
    document.getElementById('content').innerHTML = contbytemplate(act.tmpl, act);
    showgrid(act.gridid, arr,  fi[act.gridid]); // 
    //console.log(JSON.stringify(arr, null, 2));
  })
  .catch(function (error) { console.log(error); });
};

// Route time handler
rapp.showchart = function (ev, act) {
  //var title = act.name;
  $('#vtitle').html(act.name);
  // Make this into 
  document.getElementById('content').innerHTML = contbytemplate("t_wait", null);
  //showchart2(act, null);
  var ctx;
  var url = act.genurl ? act.genurl(act) : act.dataurl;
  console.log("Use url: "+url);
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
    var copts2 = dclone(copts);
    if (act.ns) { copts2.scales.yAxes = []; } // yAxes delete(copts2.scales);
    if (act.cmod) { copts2 = act.cmod(data, copts2); } // Chart opts mod
    
    console.log("Chart type: "+chtype);
    charts["btimes"] = new Chart(ctx, { type: chtype, data: data, options: copts2 });
  });
};

rapp.showdocindex = function (ev, act) {
  //$('#content').html("Hello:"+act.idxurl);
  //return;
  document.getElementById('content').innerHTML = contbytemplate(act.tmpl, act);
  $('#vtitle').html(act.name); // $('#vtitle').html(contbytemplate("wait", null));
  // Mimick flow from docindex_main.js
  var cfg = new docIndex({acc: 0, linkproc: "post", pagetitleid: "dummy", debug: 1});
  docIndex.ondocchange = function (docurl) { console.log("DOC-CHANGE: "+docurl); location.hash = '#nop'; };
  $.getJSON("docindex.json", function (d) { // act.idxurl
    console.log(d);
    cfg.initdocs(d);
  });

};

rapp.showtmpl = function (ev, act) {
  $('#vtitle').html(act.name); // Move...
  if (!act.dataurl) { return runtempl(null); }
  axios.get(act.dataurl).then( runtempl );
  function runtempl (resp) {
    var data = null;
    if (resp) { data = resp.data.data; }
    document.getElementById('content').innerHTML = contbytemplate(act.tmpl, data);
    if (act.setupui && typeof act.setupui == 'function') { act.setupui(); }
  }
};
