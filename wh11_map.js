/* ============================================================
 * WH11 Vista Bin Map — v1 (FLAT, no drawer)
 * ------------------------------------------------------------
 * SCL Inventory Count App — mirrors the wh1_map.js / wh2_map.js /
 * wh4_map.js contract so it is a drop-in for the bin picker.
 *
 * USAGE:
 *   window.WH11Map.render(containerEl, onConfirmCallback)
 *
 * CALLBACKS (same as WH1/WH2/WH4):
 *   window.SCL_BIN_SELECT(binCode)   - fires on bin tap
 *   window.SCL_BIN_CONFIRM(binCode)  - fires on Confirm tap
 *   onConfirmCallback(binCode)       - also fires on Confirm
 *
 * DESIGN:
 *   - Every colored box is a directly-tappable bin (no zones/drawer).
 *   - WH1 look: black background, selected bin highlights YELLOW.
 *   - Codes are unique. "Empty Space" is non-interactive decoration.
 *   - Office boxes render as dark utility bins.
 * ============================================================ */
(function(){
'use strict';

// ---- COLOR PALETTE (matched to the supplied floor plan) ----
var COL = {
  pink:'#F0BBD8', salmon:'#F6A9AB', blue:'#9EC8F0', lime:'#B8E86B',
  amber:'#FAC775', purple:'#C49FE0', tan:'#C9A87E', green:'#7DC87D',
  orange:'#F4A030', dark:'#161616'
};
var TXT = '#241a24';        // dark label on colored boxes
var TXT_DK = '#cbd5e1';     // light label on dark utility boxes
var VB_W = 840, VB_H = 1080;

// ---- BIN BOXES (all directly tappable) ----
// {code,label,x,y,w,h,fill, fs?, dark?}
var BINS = [
  {code:'Zone A',    label:'Zone A',   x:42, y:160, w:588,h:102, fill:COL.pink,   fs:30},
  {code:'TF',        label:'TF',       x:225,y:300, w:235,h:195, fill:COL.tan,    fs:28},
  {code:'Dock',      label:'Dock',     x:42, y:410, w:166,h:275, fill:COL.amber,  fs:26},
  {code:'Office',    label:'Office',   x:500,y:482, w:133,h:92,  dark:true, fs:16},
  {code:'Zone D',    label:'Zone\nD',  x:675,y:580, w:145,h:238, fill:COL.blue,   fs:26},
  {code:'Drum Rack', label:'Drum\nRack',x:42, y:705,w:166,h:220, fill:COL.green,  fs:22},
  {code:'Overflow',  label:'Over\nflow',x:222,y:705,w:166,h:220, fill:COL.purple, fs:22},
  {code:'Rack A',    label:'Rack\nA',  x:402,y:705, w:93, h:220, fill:COL.lime,   fs:20},
  {code:'Rack B',    label:'Rack\nB',  x:508,y:705, w:93, h:220, fill:COL.lime,   fs:20},
  {code:'Zone B',    label:'Zone B',   x:42, y:945, w:166,h:105, fill:COL.orange, fs:24},
  {code:'Zone C',    label:'Zone C',   x:222,y:945, w:166,h:105, fill:COL.salmon, fs:24},
  {code:'Office 2',  label:'Office',   x:513,y:975, w:307,h:60,  dark:true, fs:16}
];

// Non-interactive decoration (labeled, not tappable)
var DECOR = [
  {label:'Empty Space', x:42, y:15, w:588, h:100, fs:16}
];

// ---- CSS (scoped, injected once) ----
var CSS = ''
+ '.wh11map-root{font-family:"Barlow",system-ui,sans-serif;color:#fff}'
+ '.wh11map-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}'
+ '.wh11map-hdr h3{font-size:13px;font-weight:700;color:#5DCAA5;letter-spacing:1px;margin:0}'
+ '.wh11map-badge{font-size:10px;padding:3px 10px;border-radius:12px;background:#222;border:1px solid #333;color:#888}'
+ '.wh11map-badge.on{background:#0d9e6e18;border-color:#5DCAA5;color:#5DCAA5;font-weight:700}'
+ '.wh11map-hint{font-size:11px;color:#6b7494;margin:2px 0 8px}'
+ '.wh11map-wrap{border-radius:8px;overflow:hidden;border:1px solid #333;background:#0d0d0d}'
+ '.wh11map-wrap svg{display:block;width:100%;height:auto}'
+ '.wh11map-bin{cursor:pointer;-webkit-tap-highlight-color:transparent}'
+ '.wh11map-bin:active rect{opacity:.75}'
+ '.wh11map-bin.sel>rect{fill:#FFE680 !important;stroke:#FFB800 !important;stroke-width:4 !important}'
+ '.wh11map-confirm{display:none;margin-top:8px;padding:10px 14px;border-radius:8px;background:#0d9e6e18;border:1px solid #5DCAA5;align-items:center;justify-content:space-between}'
+ '.wh11map-confirm.show{display:flex}'
+ '.wh11map-ctext{font-size:13px;font-weight:700;color:#5DCAA5}'
+ '.wh11map-cbtn{padding:8px 18px;border-radius:14px;background:#5DCAA5;color:#000;border:none;font-size:13px;font-weight:700;cursor:pointer}';

function injectCSS(){
  if(document.getElementById('wh11map-css')) return;
  var s=document.createElement('style'); s.id='wh11map-css'; s.textContent=CSS;
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
  var tc = b.dark ? TXT_DK : TXT;
  var g='<g class="wh11map-bin" data-bin="'+esc(b.code)+'" onclick="window.__wh11mapPick(\''+q(b.code)+'\')">';
  if(b.dark){
    g+='<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="6" fill="'+COL.dark+'" stroke="#8a8a8a" stroke-width="2"/>';
  } else {
    g+='<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="8" fill="'+b.fill+'" stroke="#5a6b78" stroke-width="1.2"/>';
  }
  g+='<text text-anchor="middle" dominant-baseline="central" font-weight="700" font-size="'+fs+'" fill="'+tc+'" pointer-events="none">'+tspans(b.label, cx, cy, fs)+'</text>';
  g+='</g>';
  return g;
}

function decorMarkup(d){
  var cx=d.x+d.w/2, cy=d.y+d.h/2, fs=d.fs||16;
  var g='<g pointer-events="none">';
  g+='<rect x="'+d.x+'" y="'+d.y+'" width="'+d.w+'" height="'+d.h+'" rx="8" fill="#1e1e1e" stroke="#3a3a3a" stroke-width="2"/>';
  g+='<text x="'+cx+'" y="'+cy+'" text-anchor="middle" dominant-baseline="central" font-weight="700" font-size="'+fs+'" fill="#777">'+esc(d.label)+'</text>';
  g+='</g>';
  return g;
}

function buildSVG(){
  var s='<svg viewBox="0 0 '+VB_W+' '+VB_H+'" xmlns="http://www.w3.org/2000/svg" style="display:block;background:#0d0d0d">';
  // building wall — dashed border
  s+='<rect x="8" y="8" width="'+(VB_W-16)+'" height="'+(VB_H-16)+'" rx="4" fill="none" stroke="#4a4a4a" stroke-width="3" stroke-dasharray="12 8"/>';
  DECOR.forEach(function(d){ s+=decorMarkup(d); });
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
    + '<div class="wh11map-root">'
    +   '<div class="wh11map-hdr"><h3>WH11 · VISTA</h3>'
    +     '<span class="wh11map-badge" data-role="badge">No bin selected</span></div>'
    +   '<div class="wh11map-hint">Tap the area you are counting in, then Confirm.</div>'
    +   '<div class="wh11map-wrap">' + buildSVG() + '</div>'
    +   '<div class="wh11map-confirm" data-role="confirm">'
    +     '<span class="wh11map-ctext" data-role="confirmText">—</span>'
    +     '<button class="wh11map-cbtn" onclick="window.__wh11mapConfirm()">Confirm ✓</button>'
    +   '</div>'
    + '</div>';
  window.__wh11mapPick    = function(b){ self.pick(b); };
  window.__wh11mapConfirm = function(){  self.doConfirm(); };
};

MapInstance.prototype.pick = function(code){
  this.sel = code;
  var badge=this.root.querySelector('[data-role="badge"]');
  if(badge){ badge.textContent=code; badge.className='wh11map-badge on'; }
  this.root.querySelector('[data-role="confirmText"]').textContent='Counting in: '+code;
  this.root.querySelector('[data-role="confirm"]').className='wh11map-confirm show';
  this.root.querySelectorAll('.wh11map-bin.sel').forEach(function(x){ x.classList.remove('sel'); });
  var g=this.root.querySelector('.wh11map-bin[data-bin="'+code.replace(/"/g,'\\"')+'"]');
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
window.WH11Map = {
  render: function(containerEl, onConfirmCallback){
    if(!containerEl){ console.error('WH11Map.render: containerEl required'); return null; }
    return new MapInstance(containerEl, onConfirmCallback);
  }
};

})();
