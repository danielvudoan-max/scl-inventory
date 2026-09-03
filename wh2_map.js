/* ============================================================
 * WH2 Richmond Bin Map — v3 (FLAT, no drawer)
 * ------------------------------------------------------------
 * SCL Inventory Count App — mirrors the wh1_map.js contract so it
 * is a drop-in for the bin picker.
 *
 * USAGE:
 *   window.WH2Map.render(containerEl, onConfirmCallback)
 *
 * CALLBACKS (same as WH1):
 *   window.SCL_BIN_SELECT(binCode)   - fires on bin tap
 *   window.SCL_BIN_CONFIRM(binCode)  - fires on Confirm tap
 *   onConfirmCallback(binCode)       - also fires on Confirm
 *
 * DESIGN:
 *   - Every labelled box is a directly-tappable bin (no zones/drawer —
 *     the layout fits at phone width without grouping).
 *   - WH1 look: black background, selected bin highlights YELLOW.
 *   - Duplicate-named areas are NUMBERED (Drums 1..7, PKG 1..3, ...)
 *     so the tapped label == the recorded bin code.
 *   - Pails / PKG-Equip frames are kept as non-interactive decoration.
 * ============================================================ */
(function(){
'use strict';

// ---- COLOR PALETTE (matched to the supplied floor plan) ----
var COL = {
  grey:'#B4B4B4', greyLt:'#CFCFCF', tan:'#C9A87E', purple:'#D5C3E8',
  pink:'#F5C9DE', pinkD:'#F3B9D3', orange:'#F4C08A', teal:'#BBDEDA',
  blue:'#8FC0E2', oil:'#CBE1EC', iso:'#CBE1EC'
};
var TXT = '#12303f';
var VB_W = 1120, VB_H = 1440;

// ---- BIN BOXES (all directly tappable) ----
// {code, label, x,y,w,h, fill, sub?, hatch?}  label may contain \n for wrapping;
// code is the single-line string sent to the app (== label without line breaks).
var BINS = [
  {code:'Office',            label:'Office',                x:193,y:52,  w:135,h:158, fill:COL.grey},
  {code:'Extra Stocked Products', label:'Extra Stocked\nProducts', x:333,y:62, w:88, h:130, fill:COL.tan},
  {code:'PKG / Mobil',       label:'PKG /\nMobil',          x:426,y:62,  w:82, h:130,  fill:COL.purple},

  // former "Pails" group — now direct bins
  {code:'Pails Pack',        label:'Pails\nPack',           x:520,y:95,  w:80, h:95,   fill:COL.pink},
  {code:'Pails / Legs',      label:'Pails /\nLegs',         x:604,y:95,  w:82, h:95,   fill:COL.pink},
  {code:'Pails',             label:'Pails',                 x:690,y:95,  w:82, h:95,   fill:COL.pinkD},
  // former "PKG / Equip" group — now direct bins
  {code:'PKG / Honda',       label:'PKG /\nHonda',          x:792,y:95,  w:78, h:95,   fill:COL.purple},
  {code:'Cases PKG',         label:'Cases\nPKG',            x:874,y:95,  w:78, h:95,   fill:COL.purple},
  {code:'Equip',             label:'Equip',                 x:956,y:95,  w:74, h:95,   fill:COL.orange},

  {code:'PKG 1',             label:'PKG 1',                 x:193,y:215, w:98, h:70,   fill:COL.purple},
  {code:'Cases to Pull',     label:'Cases to Pull',         x:500,y:215, w:280,h:70,   fill:COL.pinkD},
  {code:'PKG 2',             label:'PKG 2',                 x:792,y:215, w:96, h:70,   fill:COL.purple},
  {code:'PKG 3',             label:'PKG 3',                 x:940,y:215, w:96, h:70,   fill:COL.purple},

  {code:'Extra PKG 1',       label:'Extra PKG 1',           x:850,y:300, w:186,h:68,   fill:COL.purple},
  {code:'Extra PKG 2',       label:'Extra PKG 2',           x:850,y:380, w:186,h:68,   fill:COL.purple},

  {code:'Drums 1',           label:'Drums 1',               x:193,y:388, w:122,h:66,   fill:COL.tan},
  {code:'Drums 2',           label:'Drums 2',               x:193,y:470, w:122,h:66,   fill:COL.tan},
  {code:'Drums 3',           label:'Drums 3',               x:193,y:552, w:122,h:66,   fill:COL.tan},
  {code:'Drums 4',           label:'Drums 4',               x:193,y:634, w:122,h:66,   fill:COL.tan},
  {code:'TOTES 1',           label:'TOTES 1',               x:193,y:855, w:122,h:88,   fill:COL.blue},
  {code:'TOTES 2',           label:'TOTES 2',               x:193,y:955, w:122,h:88,   fill:COL.blue},
  {code:'Mix Totes 1',       label:'MIX\nTOTES 1',          x:193,y:1055,w:122,h:88,   fill:COL.blue},

  {code:'Drums 5',           label:'Drums 5',               x:433,y:413, w:186,h:44,   fill:COL.tan},
  {code:'Drums 6',           label:'Drums 6',               x:648,y:413, w:172,h:44,   fill:COL.tan},
  {code:'Rack 1',            label:'Rack 1',                x:433,y:468, w:88, h:610,  fill:COL.blue},
  {code:'Rack 2',            label:'Rack 2',                x:530,y:468, w:88, h:610,  fill:COL.blue},
  {code:'Oil Totes Rack',    label:'Oil Totes\nRack',       x:648,y:468, w:172,h:438,  fill:COL.oil, sub:'\u2014 Low Volume \u2014'},
  {code:'Oil Totes',         label:'Oil Totes',             x:848,y:468, w:188,h:610,  fill:COL.oil, sub:'\u2014 High Volume \u2014'},
  {code:'Drums 7',           label:'Drums 7',               x:433,y:1058,w:186,h:44,   fill:COL.tan},
  {code:'Mix Totes 2',       label:'Mix Totes 2',           x:648,y:912, w:172,h:128,  fill:COL.blue, sub:'Full Drum Storage'},

  {code:'Waste',             label:'Waste',                 x:193,y:1165,w:135,h:135,  fill:COL.grey},
  {code:'Bulk Off Load Area',label:'Bulk\nOff Load\nArea',  x:333,y:1165,w:142,h:135,  fill:COL.orange},
  {code:'Mix Totes 3',       label:'Mix\nTotes 3',          x:480,y:1165,w:140,h:135,  fill:COL.blue},
  {code:'Full Drum Storage', label:'Full\nDrum\nStorage',   x:625,y:1165,w:140,h:135,  fill:COL.tan},
  {code:'ISO Clean Corner',  label:'ISO Clean\nCorner',     x:770,y:1165,w:266,h:135,  fill:COL.iso, hatch:true},

  {code:'Storage Trailer 1', label:'Storage\nTrailer 1',    x:30, y:380, w:120,h:165,  fill:COL.teal},
  {code:'Storage Trailer 2', label:'Storage\nTrailer 2',    x:30, y:548, w:120,h:165,  fill:COL.teal},
  {code:'Empty Drums 1',     label:'Empty\nDrums 1',        x:30, y:920, w:120,h:95,   fill:COL.greyLt},
  {code:'Empty Drums 2',     label:'Empty\nDrums 2',        x:30, y:1018,w:120,h:95,   fill:COL.greyLt},
  {code:'Pails Equipment Storage', label:'Pails\nEquipment\nStorage', x:30,y:1130,w:120,h:100, fill:COL.orange}
];

// Non-interactive group frames (decoration only — the children above are the bins)
var GROUPS = [
  {label:'Pails',       x:512,y:55, w:268,h:140, stroke:'#c98bb0'},
  {label:'PKG / Equip', x:786,y:55, w:250,h:140, stroke:'#d0a15f'}
];

// Static text labels (rooms / doors)
var LABELS = [
  {text:'Pail Room', x:560, y:30,  size:22, anchor:'middle'},
  {text:'Back Room', x:1058,y:250, size:20, anchor:'middle', rotate:90},
  {text:'Roller',    x:92,  y:224, size:15, anchor:'middle'},
  {text:'Truck Door',x:92,  y:242, size:15, anchor:'middle'},
  {text:'Truck',     x:92,  y:312, size:15, anchor:'middle'},
  {text:'Door',      x:92,  y:330, size:15, anchor:'middle'}
];

// ---- CSS (scoped, injected once) ----
var CSS = ''
+ '.wh2map-root{font-family:"Barlow",system-ui,sans-serif;color:#fff}'
+ '.wh2map-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}'
+ '.wh2map-hdr h3{font-size:13px;font-weight:700;color:#5DCAA5;letter-spacing:1px;margin:0}'
+ '.wh2map-badge{font-size:10px;padding:3px 10px;border-radius:12px;background:#222;border:1px solid #333;color:#888}'
+ '.wh2map-badge.on{background:#0d9e6e18;border-color:#5DCAA5;color:#5DCAA5;font-weight:700}'
+ '.wh2map-hint{font-size:11px;color:#6b7494;margin:2px 0 8px}'
+ '.wh2map-wrap{border-radius:8px;overflow:hidden;border:1px solid #333;background:#111}'
+ '.wh2map-wrap svg{display:block;width:100%;height:auto}'
+ '.wh2map-bin{cursor:pointer;-webkit-tap-highlight-color:transparent}'
+ '.wh2map-bin:active rect{opacity:.75}'
+ '.wh2map-bin.sel>rect{fill:#FFE680 !important;stroke:#FFB800 !important;stroke-width:4 !important}'
+ '.wh2map-confirm{display:none;margin-top:8px;padding:10px 14px;border-radius:8px;background:#0d9e6e18;border:1px solid #5DCAA5;align-items:center;justify-content:space-between}'
+ '.wh2map-confirm.show{display:flex}'
+ '.wh2map-ctext{font-size:13px;font-weight:700;color:#5DCAA5}'
+ '.wh2map-cbtn{padding:8px 18px;border-radius:14px;background:#5DCAA5;color:#000;border:none;font-size:13px;font-weight:700;cursor:pointer}';

function injectCSS(){
  if(document.getElementById('wh2map-css')) return;
  var s=document.createElement('style'); s.id='wh2map-css'; s.textContent=CSS;
  document.head.appendChild(s);
}

// ---- SVG BUILDERS ----
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function q(s){ return String(s).replace(/'/g,"\\'"); }

function tspans(label, cx, cy, size){
  var lines = label.split('\n'), lh = size + 3, startY = cy - (lines.length-1)*lh/2, out='';
  for(var i=0;i<lines.length;i++) out += '<tspan x="'+cx+'" y="'+(startY + i*lh)+'">'+esc(lines[i])+'</tspan>';
  return out;
}

function boxText(b, cx, cy, fs){
  if(b.sub){
    var top = '<text text-anchor="middle" font-weight="700" font-size="'+fs+'" fill="'+TXT+'">'+tspans(b.label, cx, cy-10, fs)+'</text>';
    var subY = cy + (b.label.split('\n').length*(fs+3))/2 + 4;
    return top + '<text text-anchor="middle" font-weight="600" font-size="11" fill="'+TXT+'"><tspan x="'+cx+'" y="'+subY+'">'+esc(b.sub)+'</tspan></text>';
  }
  return '<text text-anchor="middle" font-weight="700" font-size="'+fs+'" fill="'+TXT+'">'+tspans(b.label, cx, cy, fs)+'</text>';
}

function binMarkup(b){
  var cx=b.x+b.w/2, cy=b.y+b.h/2, fs=b.w<90?13:15, fill=b.hatch?'url(#wh2hatch)':b.fill;
  return '<g class="wh2map-bin" data-bin="'+esc(b.code)+'" onclick="window.__wh2mapPick(\''+q(b.code)+'\')">'
    + '<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="6" fill="'+fill+'" stroke="#5a6b78" stroke-width="1.2"/>'
    + boxText(b, cx, cy, fs) + '</g>';
}

function groupMarkup(gp){
  return '<rect x="'+gp.x+'" y="'+gp.y+'" width="'+gp.w+'" height="'+gp.h+'" rx="6" fill="none" stroke="'+gp.stroke+'" stroke-width="1.6" pointer-events="none"/>'
    + '<text x="'+(gp.x+gp.w/2)+'" y="'+(gp.y+18)+'" text-anchor="middle" font-size="14" font-weight="700" fill="#d6deea" pointer-events="none">'+esc(gp.label)+'</text>';
}

function labelMarkup(l){
  var rot = l.rotate ? ' transform="rotate('+l.rotate+' '+l.x+' '+l.y+')"' : '';
  return '<text x="'+l.x+'" y="'+l.y+'"'+rot+' text-anchor="'+(l.anchor||'start')+'" font-size="'+(l.size||14)+'" font-weight="700" fill="#d6deea">'+esc(l.text)+'</text>';
}

function buildSVG(){
  var s = '<svg viewBox="0 0 '+VB_W+' '+VB_H+'" xmlns="http://www.w3.org/2000/svg" style="display:block;background:#111">';
  s += '<defs><pattern id="wh2hatch" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">'
     + '<rect width="10" height="10" fill="'+COL.iso+'"/><line x1="0" y1="0" x2="0" y2="10" stroke="#8fb9cc" stroke-width="3"/></pattern></defs>';
  s += '<rect x="185" y="45" width="855" height="1345" rx="4" fill="none" stroke="#cbd5e1" stroke-width="5"/>';
  s += '<line x1="185" y1="232" x2="167" y2="232" stroke="#3fa79f" stroke-width="4"/>';
  s += '<line x1="185" y1="320" x2="167" y2="320" stroke="#3fa79f" stroke-width="4"/>';
  GROUPS.forEach(function(g){ s += groupMarkup(g); });
  BINS.forEach(function(b){ s += binMarkup(b); });
  LABELS.forEach(function(l){ s += labelMarkup(l); });
  s += '</svg>';
  return s;
}

// ---- MAP INSTANCE ----
function MapInstance(containerEl, onConfirmCb){
  this.root = containerEl;
  this.onConfirmCb = onConfirmCb;
  this.sel = null;
  this.build();
}

MapInstance.prototype.build = function(){
  injectCSS();
  var self=this;
  this.root.innerHTML = ''
    + '<div class="wh2map-root">'
    +   '<div class="wh2map-hdr"><h3>WH2 \u00b7 RICHMOND</h3>'
    +     '<span class="wh2map-badge" data-role="badge">No bin selected</span></div>'
    +   '<div class="wh2map-hint">Tap the area you are counting in, then Confirm.</div>'
    +   '<div class="wh2map-wrap">' + buildSVG() + '</div>'
    +   '<div class="wh2map-confirm" data-role="confirm">'
    +     '<span class="wh2map-ctext" data-role="confirmText">\u2014</span>'
    +     '<button class="wh2map-cbtn" onclick="window.__wh2mapConfirm()">Confirm \u2713</button>'
    +   '</div>'
    + '</div>';
  window.__wh2mapPick    = function(b){ self.pick(b); };
  window.__wh2mapConfirm = function(){  self.doConfirm(); };
};

MapInstance.prototype.pick = function(code){
  this.sel = code;
  var badge=this.root.querySelector('[data-role="badge"]');
  if(badge){ badge.textContent=code; badge.className='wh2map-badge on'; }
  this.root.querySelector('[data-role="confirmText"]').textContent='Counting in: '+code;
  this.root.querySelector('[data-role="confirm"]').className='wh2map-confirm show';
  this.root.querySelectorAll('.wh2map-bin.sel').forEach(function(x){ x.classList.remove('sel'); });
  var g=this.root.querySelector('.wh2map-bin[data-bin="'+code.replace(/"/g,'\\"')+'"]');
  if(g) g.classList.add('sel');
  if(typeof window.SCL_BIN_SELECT==='function') window.SCL_BIN_SELECT(code);
};

MapInstance.prototype.doConfirm = function(){
  if(!this.sel) return;
  var bar=this.root.querySelector('[data-role="confirm"]');
  if(bar){ bar.style.background='#5DCAA530'; setTimeout(function(){ bar.style.background=''; },500); }
  if(typeof window.SCL_BIN_CONFIRM==='function') window.SCL_BIN_CONFIRM(this.sel);
  if(typeof this.onConfirmCb==='function')       this.onConfirmCb(this.sel);
};

// ---- PUBLIC API ----
window.WH2Map = {
  render: function(containerEl, onConfirmCallback){
    if(!containerEl){ console.error('WH2Map.render: containerEl required'); return null; }
    return new MapInstance(containerEl, onConfirmCallback);
  }
};

})();
