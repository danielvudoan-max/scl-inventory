/* ============================================================
 * WH4 Lancaster Bin Map — v1 (FLAT, no drawer)
 * ------------------------------------------------------------
 * SCL Inventory Count App — mirrors the wh1_map.js / wh2_map.js
 * contract so it is a drop-in for the bin picker.
 *
 * USAGE:
 *   window.WH4Map.render(containerEl, onConfirmCallback)
 *
 * CALLBACKS (same as WH1/WH2):
 *   window.SCL_BIN_SELECT(binCode)   - fires on bin tap
 *   window.SCL_BIN_CONFIRM(binCode)  - fires on Confirm tap
 *   onConfirmCallback(binCode)       - also fires on Confirm
 *
 * DESIGN:
 *   - Every box is a directly-tappable bin (no zones/drawer).
 *   - WH1 look: black background, selected bin highlights YELLOW.
 *   - Codes are unique (TF1/TF2/A..G/DEF/Garage/Office) — no numbering.
 *   - Garage/Office render as dark utility boxes; DEF as a circle.
 * ============================================================ */
(function(){
'use strict';

// ---- COLOR PALETTE (matched to the supplied floor plan) ----
var COL = {
  pink:'#F0BBD8', blue:'#9EC8F0', lime:'#B8E86B', amber:'#FAC775',
  purple:'#C49FE0', tan:'#C9A87E', green:'#7DC87D', orange:'#F4A030',
  dark:'#161616'
};
var TXT = '#241a24';        // dark label on colored boxes
var TXT_DK = '#cbd5e1';     // light label on dark utility boxes
var VB_W = 840, VB_H = 1080;

// ---- BIN BOXES (all directly tappable) ----
// {code,label,x,y,w,h,fill, fs?, dark?, circle?}
var BINS = [
  {code:'TF2',    label:'TF2',    x:25, y:15,  w:365,h:185, fill:COL.pink,   fs:26},
  {code:'TF1',    label:'TF1',    x:455,y:95,  w:365,h:165, fill:COL.pink,   fs:26},
  {code:'Zone D', label:'Zone\nD', x:25, y:222, w:170,h:130, fill:COL.blue,   fs:24},
  {code:'Zone C', label:'Zone\nC', x:220,y:222, w:165,h:130, fill:COL.lime,   fs:24},
  {code:'Zone E', label:'Zone\nE', x:25, y:380, w:75, h:175, fill:COL.amber,  fs:20},
  {code:'Zone F', label:'Zone\nF', x:115,y:380, w:80, h:175, fill:COL.purple, fs:20},
  {code:'Zone G', label:'Zone\nG', x:205,y:380, w:70, h:175, fill:COL.tan,    fs:20},
  {code:'Zone B', label:'Zone\nB', x:42, y:767, w:152,h:268, fill:COL.green,  fs:28},
  {code:'Zone A', label:'Zone\nA', x:200,y:767, w:280,h:268, fill:COL.orange, fs:34},
  {code:'DEF',    label:'DEF',    x:668,y:300, w:74, h:74,  fill:'none', circle:true, fs:15},
  {code:'Garage', label:'Garage', x:655,y:440, w:165,h:192, dark:true, fs:16},
  {code:'Office', label:'Office', x:650,y:665, w:175,h:257, dark:true, fs:16}
];

// Non-interactive decoration frames (A + B sit in a bay)
var GROUPS = [
  {x:32,y:757,w:455,h:288, stroke:'#8a8a8a'}
];

// ---- CSS (scoped, injected once) ----
var CSS = ''
+ '.wh4map-root{font-family:"Barlow",system-ui,sans-serif;color:#fff}'
+ '.wh4map-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}'
+ '.wh4map-hdr h3{font-size:13px;font-weight:700;color:#5DCAA5;letter-spacing:1px;margin:0}'
+ '.wh4map-badge{font-size:10px;padding:3px 10px;border-radius:12px;background:#222;border:1px solid #333;color:#888}'
+ '.wh4map-badge.on{background:#0d9e6e18;border-color:#5DCAA5;color:#5DCAA5;font-weight:700}'
+ '.wh4map-hint{font-size:11px;color:#6b7494;margin:2px 0 8px}'
+ '.wh4map-wrap{border-radius:8px;overflow:hidden;border:1px solid #333;background:#0d0d0d}'
+ '.wh4map-wrap svg{display:block;width:100%;height:auto}'
+ '.wh4map-bin{cursor:pointer;-webkit-tap-highlight-color:transparent}'
+ '.wh4map-bin:active rect,.wh4map-bin:active circle{opacity:.75}'
+ '.wh4map-bin.sel>rect,.wh4map-bin.sel>circle{fill:#FFE680 !important;stroke:#FFB800 !important;stroke-width:4 !important}'
+ '.wh4map-confirm{display:none;margin-top:8px;padding:10px 14px;border-radius:8px;background:#0d9e6e18;border:1px solid #5DCAA5;align-items:center;justify-content:space-between}'
+ '.wh4map-confirm.show{display:flex}'
+ '.wh4map-ctext{font-size:13px;font-weight:700;color:#5DCAA5}'
+ '.wh4map-cbtn{padding:8px 18px;border-radius:14px;background:#5DCAA5;color:#000;border:none;font-size:13px;font-weight:700;cursor:pointer}';

function injectCSS(){
  if(document.getElementById('wh4map-css')) return;
  var s=document.createElement('style'); s.id='wh4map-css'; s.textContent=CSS;
  document.head.appendChild(s);
}

// ---- SVG BUILDERS ----
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function q(s){ return String(s).replace(/'/g,"\\'"); }

function tspans(label, cx, cy, size){
  var lines=label.split('\n'), lh=size+4, startY=cy-(lines.length-1)*lh/2, out='';
  for(var i=0;i<lines.length;i++) out+='<tspan x="'+cx+'" y="'+(startY+i*lh)+'">'+esc(lines[i])+'</tspan>';
  return out;
}

function binMarkup(b){
  var cx=b.x+b.w/2, cy=b.y+b.h/2, fs=b.fs||18;
  var tc = b.dark ? TXT_DK : (b.circle ? '#ffffff' : TXT);
  var g='<g class="wh4map-bin" data-bin="'+esc(b.code)+'" onclick="window.__wh4mapPick(\''+q(b.code)+'\')">';
  if(b.circle){
    g+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(b.w/2)+'" fill="none" stroke="#ffffff" stroke-width="2.5"/>';
  } else if(b.dark){
    g+='<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="6" fill="'+COL.dark+'" stroke="#8a8a8a" stroke-width="2"/>';
  } else {
    g+='<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="8" fill="'+b.fill+'" stroke="#5a6b78" stroke-width="1.2"/>';
  }
  g+='<text text-anchor="middle" dominant-baseline="central" font-weight="700" font-size="'+fs+'" fill="'+tc+'" pointer-events="none">'+tspans(b.label, cx, cy, fs)+'</text>';
  g+='</g>';
  return g;
}

function groupMarkup(gp){
  return '<rect x="'+gp.x+'" y="'+gp.y+'" width="'+gp.w+'" height="'+gp.h+'" rx="12" fill="none" stroke="'+gp.stroke+'" stroke-width="3" pointer-events="none"/>';
}

function buildSVG(){
  var s='<svg viewBox="0 0 '+VB_W+' '+VB_H+'" xmlns="http://www.w3.org/2000/svg" style="display:block;background:#0d0d0d">';
  // building wall — dashed border
  s+='<rect x="8" y="8" width="'+(VB_W-16)+'" height="'+(VB_H-16)+'" rx="4" fill="none" stroke="#4a4a4a" stroke-width="3" stroke-dasharray="12 8"/>';
  GROUPS.forEach(function(g){ s+=groupMarkup(g); });
  BINS.forEach(function(b){ s+=binMarkup(b); });
  // compass (bottom-right)
  s+='<text x="'+(VB_W-40)+'" y="'+(VB_H-22)+'" text-anchor="middle" font-size="18" font-weight="700" fill="#9aa3bd" pointer-events="none">N ▲</text>';
  s+='</svg>';
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
    + '<div class="wh4map-root">'
    +   '<div class="wh4map-hdr"><h3>WH4 · LANCASTER</h3>'
    +     '<span class="wh4map-badge" data-role="badge">No bin selected</span></div>'
    +   '<div class="wh4map-hint">Tap the area you are counting in, then Confirm.</div>'
    +   '<div class="wh4map-wrap">' + buildSVG() + '</div>'
    +   '<div class="wh4map-confirm" data-role="confirm">'
    +     '<span class="wh4map-ctext" data-role="confirmText">—</span>'
    +     '<button class="wh4map-cbtn" onclick="window.__wh4mapConfirm()">Confirm ✓</button>'
    +   '</div>'
    + '</div>';
  window.__wh4mapPick    = function(b){ self.pick(b); };
  window.__wh4mapConfirm = function(){  self.doConfirm(); };
};

MapInstance.prototype.pick = function(code){
  this.sel = code;
  var badge=this.root.querySelector('[data-role="badge"]');
  if(badge){ badge.textContent=code; badge.className='wh4map-badge on'; }
  this.root.querySelector('[data-role="confirmText"]').textContent='Counting in: '+code;
  this.root.querySelector('[data-role="confirm"]').className='wh4map-confirm show';
  this.root.querySelectorAll('.wh4map-bin.sel').forEach(function(x){ x.classList.remove('sel'); });
  var g=this.root.querySelector('.wh4map-bin[data-bin="'+code.replace(/"/g,'\\"')+'"]');
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
window.WH4Map = {
  render: function(containerEl, onConfirmCallback){
    if(!containerEl){ console.error('WH4Map.render: containerEl required'); return null; }
    return new MapInstance(containerEl, onConfirmCallback);
  }
};

})();
