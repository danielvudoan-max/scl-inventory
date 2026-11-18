/* ============================================================
 * WH7 San Jose Bin Map — v1 (FLAT, no drawer)
 * ------------------------------------------------------------
 * SCL Inventory Count App — mirrors the wh1/wh2/wh4/wh11 map
 * contract so it is a drop-in for the bin picker.
 *
 * USAGE:
 *   window.WH7Map.render(containerEl, onConfirmCallback)
 *
 * CALLBACKS (same as the other maps):
 *   window.SCL_BIN_SELECT(binCode)   - fires on bin tap
 *   window.SCL_BIN_CONFIRM(binCode)  - fires on Confirm tap
 *   onConfirmCallback(binCode)       - also fires on Confirm
 *
 * DESIGN:
 *   - Every colored box is a directly-tappable bin (no drawer).
 *   - WH1 look: black background, selected bin highlights YELLOW.
 *   - Two section frames: dashed TF bay (left), solid building (right).
 *   - "Yard" is non-interactive decoration. Offices are tappable
 *     dark utility bins (per Daniel's WH11 preference).
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
// {code,label,x,y,w,h,fill, fs?, dark?}
var BINS = [
  // Left TF bay
  {code:'TF1', label:'TF1', x:25, y:297, w:115,h:760, fill:COL.pink, fs:26},
  {code:'TF4', label:'TF4', x:170,y:300, w:180,h:182, fill:COL.pink, fs:26},
  {code:'TF3', label:'TF3', x:170,y:585, w:180,h:182, fill:COL.pink, fs:26},
  {code:'TF2', label:'TF2', x:170,y:868, w:180,h:182, fill:COL.pink, fs:26},
  // Right building
  {code:'A',    label:'A',    x:432,y:295, w:155,h:92,  fill:COL.blue,   fs:26},
  {code:'D',    label:'D',    x:663,y:295, w:155,h:92,  fill:COL.amber,  fs:26},
  {code:'B',    label:'B',    x:465,y:413, w:125,h:90,  fill:COL.lime,   fs:26},
  {code:'E',    label:'E',    x:663,y:400, w:155,h:230, fill:COL.orange, fs:28},
  {code:'C',    label:'C',    x:432,y:527, w:155,h:108, fill:COL.purple, fs:26},
  {code:'Tank', label:'Tank', x:432,y:725, w:141,h:107, fill:COL.tan,    fs:22},
  {code:'F',    label:'F',    x:718,y:718, w:100,h:194, fill:COL.green,  fs:26},
  {code:'Maint/Office', label:'Maintenance/\nOffice', x:430,y:928, w:160,h:122, dark:true, fs:15},
  {code:'Office',       label:'Office',                x:598,y:1002,w:200,h:42,  dark:true, fs:15}
];

// Non-interactive decoration (labeled, not tappable)
var DECOR = [
  {label:'Yard', x:10, y:10, w:518, h:225, fs:18}
];

// Non-interactive section frames {x,y,w,h, dashed?}
var FRAMES = [
  {x:8,  y:285, w:352, h:782, dashed:true},   // TF bay
  {x:420,y:285, w:405, h:782, dashed:false}   // building
];

// ---- CSS (scoped, injected once) ----
var CSS = ''
+ '.wh7map-root{font-family:"Barlow",system-ui,sans-serif;color:#fff}'
+ '.wh7map-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}'
+ '.wh7map-hdr h3{font-size:13px;font-weight:700;color:#5DCAA5;letter-spacing:1px;margin:0}'
+ '.wh7map-badge{font-size:10px;padding:3px 10px;border-radius:12px;background:#222;border:1px solid #333;color:#888}'
+ '.wh7map-badge.on{background:#0d9e6e18;border-color:#5DCAA5;color:#5DCAA5;font-weight:700}'
+ '.wh7map-hint{font-size:11px;color:#6b7494;margin:2px 0 8px}'
+ '.wh7map-wrap{border-radius:8px;overflow:hidden;border:1px solid #333;background:#0d0d0d}'
+ '.wh7map-wrap svg{display:block;width:100%;height:auto}'
+ '.wh7map-bin{cursor:pointer;-webkit-tap-highlight-color:transparent}'
+ '.wh7map-bin:active rect{opacity:.75}'
+ '.wh7map-bin.sel>rect{fill:#FFE680 !important;stroke:#FFB800 !important;stroke-width:4 !important}'
+ '.wh7map-confirm{display:none;margin-top:8px;padding:10px 14px;border-radius:8px;background:#0d9e6e18;border:1px solid #5DCAA5;align-items:center;justify-content:space-between}'
+ '.wh7map-confirm.show{display:flex}'
+ '.wh7map-ctext{font-size:13px;font-weight:700;color:#5DCAA5}'
+ '.wh7map-cbtn{padding:8px 18px;border-radius:14px;background:#5DCAA5;color:#000;border:none;font-size:13px;font-weight:700;cursor:pointer}';

function injectCSS(){
  if(document.getElementById('wh7map-css')) return;
  var s=document.createElement('style'); s.id='wh7map-css'; s.textContent=CSS;
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
  var g='<g class="wh7map-bin" data-bin="'+esc(b.code)+'" onclick="window.__wh7mapPick(\''+q(b.code)+'\')">';
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

function frameMarkup(f){
  var dash = f.dashed ? ' stroke-dasharray="10 7"' : '';
  return '<rect x="'+f.x+'" y="'+f.y+'" width="'+f.w+'" height="'+f.h+'" rx="10" fill="none" stroke="#8a8a8a" stroke-width="2.5"'+dash+' pointer-events="none"/>';
}

function buildSVG(){
  var s='<svg viewBox="0 0 '+VB_W+' '+VB_H+'" xmlns="http://www.w3.org/2000/svg" style="display:block;background:#0d0d0d">';
  FRAMES.forEach(function(f){ s+=frameMarkup(f); });
  DECOR.forEach(function(d){ s+=decorMarkup(d); });
  // divider shelf-line under E (decoration)
  s+='<line x1="590" y1="687" x2="823" y2="687" stroke="#6a6a6a" stroke-width="3" pointer-events="none"/>';
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
    + '<div class="wh7map-root">'
    +   '<div class="wh7map-hdr"><h3>WH7 · SAN JOSE</h3>'
    +     '<span class="wh7map-badge" data-role="badge">No bin selected</span></div>'
    +   '<div class="wh7map-hint">Tap the area you are counting in, then Confirm.</div>'
    +   '<div class="wh7map-wrap">' + buildSVG() + '</div>'
    +   '<div class="wh7map-confirm" data-role="confirm">'
    +     '<span class="wh7map-ctext" data-role="confirmText">—</span>'
    +     '<button class="wh7map-cbtn" onclick="window.__wh7mapConfirm()">Confirm ✓</button>'
    +   '</div>'
    + '</div>';
  window.__wh7mapPick    = function(b){ self.pick(b); };
  window.__wh7mapConfirm = function(){  self.doConfirm(); };
};

MapInstance.prototype.pick = function(code){
  this.sel = code;
  var badge=this.root.querySelector('[data-role="badge"]');
  if(badge){ badge.textContent=code; badge.className='wh7map-badge on'; }
  this.root.querySelector('[data-role="confirmText"]').textContent='Counting in: '+code;
  this.root.querySelector('[data-role="confirm"]').className='wh7map-confirm show';
  this.root.querySelectorAll('.wh7map-bin.sel').forEach(function(x){ x.classList.remove('sel'); });
  var g=this.root.querySelector('.wh7map-bin[data-bin="'+code.replace(/"/g,'\\"')+'"]');
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
window.WH7Map = {
  render: function(containerEl, onConfirmCallback){
    if(!containerEl){ console.error('WH7Map.render: containerEl required'); return null; }
    return new MapInstance(containerEl, onConfirmCallback);
  }
};

})();
