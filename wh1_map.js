/* ============================================================
 * WH1 Collins Bin Map — v12
 * ------------------------------------------------------------
 * SCL Inventory Count App — p4.0 Stage 1 Locations Feature
 *
 * USAGE:
 *   window.WH1Map.render(containerEl, onConfirmCallback)
 *
 * CALLBACKS:
 *   window.SCL_BIN_SELECT(binCode)   - fires on bin tap (drawer or direct-select)
 *   window.SCL_BIN_CONFIRM(binCode)  - fires when user taps the Confirm button
 *   onConfirmCallback(binCode)       - also fires on confirm (passed to render)
 *
 * STRUCTURE:
 *   - Self-injects scoped CSS (prefix .wh1map-)
 *   - Builds outer SVG map + standalone bin buttons (8A/8B/8C/8D/9TF-A/9TF-B)
 *   - Zones open a bottom drawer with bin grid
 *   - Selecting a bin shows the Confirm bar
 * ============================================================ */
(function(){
'use strict';

// ---- COLORS ----
var C = {
  '9A':'#FFC5E2','9B':'#FFC5E2','9C':'#FFC5E2','9D':'#FFC5E2','9E':'#FFC5E2','9F':'#FFC5E2',
  '9G':'#FFC5E2','9H':'#FFC5E2','9I':'#FFC5E2','9J':'#FFC5E2','9K':'#FFC5E2','9L':'#FFC5E2','9M':'#FFC5E2',
  '15A':'#C8A882','15B':'#C8A882','15C':'#C8A882','15D':'#C8A882',
  '12A':'#5BD4FF','12B':'#5BD4FF','12C':'#5BD4FF','12D':'#5BD4FF','12E':'#5BD4FF','12F':'#5BD4FF',
  '7E':'#FFFFAB','7F':'#FFFFAB','7G':'#FFFFAB','9Q':'#EEB8D4',
  '9N':'#EEB8D4','9O':'#EEB8D4','5E':'#B8E86B',
  '7A':'#FFFFAB','7B':'#FFFFAB','7C':'#FFFFAB','7D':'#FFFFAB',
  '5A':'#B8E86B','5B':'#B8E86B','5C':'#B8E86B','5D':'#B8E86B',
  '6A':'#C49FE0','6B':'#C49FE0','9P':'#EEB8D4',
  '1':'#7DC87D','4A':'#F4A030','4B':'#F4A030','4C':'#F4A030',
  '10A':'#FFAAAA','10B':'#FFAAAA','10C':'#FFAAAA','10D':'#FFAAAA','10E':'#FFAAAA',
  '3A1':'#99FFCC','3A2':'#99FFCC',
  '3B':'#7DC87D','3C':'#7DC87D','3D':'#7DC87D','3E':'#7DC87D',
  '3F':'#7DC87D','3G':'#7DC87D','3H':'#7DC87D',
  '10F':'#FFAAAA','10G':'#FFAAAA','10H':'#FFAAAA'
};

var WK_BG = 'repeating-linear-gradient(45deg,#2a2a2a,#2a2a2a 3px,#1a1a1a 3px,#1a1a1a 6px)';

// ---- CSS (scoped, injected once) ----
var CSS = ''
+ '.wh1map-root{font-family:"Courier New",monospace;color:#fff}'
+ '.wh1map-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}'
+ '.wh1map-hdr h3{font-size:13px;font-weight:700;color:#5DCAA5;letter-spacing:1px;margin:0}'
+ '.wh1map-badge{font-size:10px;padding:3px 10px;border-radius:12px;background:#222;border:1px solid #333;color:#666}'
+ '.wh1map-badge.on{background:#0d9e6e18;border-color:#5DCAA5;color:#5DCAA5;font-weight:700}'
+ '.wh1map-outer{display:grid;grid-template-columns:24px 1fr 24px;gap:3px;align-items:stretch}'
+ '.wh1map-side{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:3px;padding-top:32px}'
+ '.wh1map-sbtn{background:#FAC775;color:#3d1a00;font-size:9px;font-weight:700;border:none;border-radius:5px;cursor:pointer;writing-mode:vertical-rl;text-orientation:mixed;letter-spacing:1px;padding:4px 0}'
+ '.wh1map-sbtn:active{opacity:.7}'
+ '.wh1map-sbtn.half{height:160px}'
+ '.wh1map-wrap{border-radius:8px;overflow:hidden;border:1px solid #333}'
+ '.wh1map-confirm{display:none;margin-top:8px;padding:10px 14px;border-radius:8px;background:#0d9e6e18;border:1px solid #5DCAA5;align-items:center;justify-content:space-between}'
+ '.wh1map-confirm.show{display:flex}'
+ '.wh1map-ctext{font-size:12px;font-weight:700;color:#5DCAA5}'
+ '.wh1map-cbtn{padding:6px 14px;border-radius:14px;background:#5DCAA5;color:#000;border:none;font-size:11px;font-weight:700;cursor:pointer}'
+ '.wh1map-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9000;align-items:flex-end;justify-content:center}'
+ '.wh1map-ov.open{display:flex}'
+ '.wh1map-drawer{background:#111;border-radius:16px 16px 0 0;width:100%;max-width:480px;padding:14px 14px 32px;max-height:82vh;overflow-y:auto;border-top:1px solid #333}'
+ '.wh1map-grip{width:32px;height:3px;background:#333;border-radius:2px;margin:0 auto 12px}'
+ '.wh1map-dtitle{font-size:13px;font-weight:700;color:#5DCAA5;margin-bottom:2px}'
+ '.wh1map-dsub{font-size:11px;color:#555;margin-bottom:12px}'
+ '.wh1map-dcancel{width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:transparent;font-size:12px;color:#555;cursor:pointer;margin-top:4px}'
+ '.wh1map-tbl{width:100%;border-collapse:separate;border-spacing:3px;margin-bottom:10px;table-layout:fixed}'
+ '.wh1map-tbl td{border-radius:6px;text-align:center;font-size:11px;font-weight:700;cursor:pointer;padding:0;height:40px;vertical-align:middle;color:#111;border:2px solid transparent}'
+ '.wh1map-tbl td.sel{border-color:#5DCAA5!important;box-shadow:0 0 0 2px #5DCAA544}'
+ '.wh1map-tbl td.emp{background:transparent;cursor:default;border:none}'
+ '.wh1map-tbl td.wk{background:'+WK_BG+';cursor:default;border:none}'
+ '.wh1map-tbl td.grey{background:#2a2a2a;cursor:default;border:none}';

function injectCSS(){
  if(document.getElementById('wh1map-style')) return;
  var s = document.createElement('style');
  s.id = 'wh1map-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ---- OUTER MAP SVG ----
var SVG_MARKUP = ''
+ '<svg viewBox="0 0 280 360" width="100%" style="display:block;background:#111">'
+ '<defs><pattern id="wh1-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">'
+ '<line x1="0" y1="0" x2="0" y2="6" stroke="#333" stroke-width="2"/></pattern></defs>'
// Top row: Zone 5 | Zone 4A | 8B | Zone 4B
+ '<g style="cursor:pointer" data-zone="z5"><rect x="2" y="2" width="62" height="50" rx="4" fill="#C8A882"/>'
+ '<text x="33" y="21" font-family="Courier New" font-size="8" font-weight="700" fill="#3d2a10" text-anchor="middle">Zone 5</text>'
+ '<text x="33" y="33" font-family="Courier New" font-size="7" fill="#3d2a10" text-anchor="middle">15A·15B</text>'
+ '<text x="33" y="43" font-family="Courier New" font-size="7" fill="#3d2a10" text-anchor="middle">15C·15D</text></g>'
+ '<g style="cursor:pointer" data-zone="z4a"><rect x="66" y="2" width="62" height="50" rx="4" fill="#E8D5F2"/>'
+ '<text x="97" y="21" font-family="Courier New" font-size="8" font-weight="700" fill="#3a1f5a" text-anchor="middle">Zone 4A</text>'
+ '<text x="97" y="33" font-family="Courier New" font-size="7" fill="#3a1f5a" text-anchor="middle">9A·9B·9C</text>'
+ '<text x="97" y="43" font-family="Courier New" font-size="7" fill="#3a1f5a" text-anchor="middle">9D·9E·9F</text></g>'
+ '<g style="cursor:pointer" data-bin="8B"><rect x="130" y="2" width="16" height="50" rx="3" fill="#FAC775"/>'
+ '<text x="138" y="29" font-family="Courier New" font-size="7" font-weight="700" fill="#3d1a00" text-anchor="middle" dominant-baseline="central" transform="rotate(90,138,29)">8B</text></g>'
+ '<g style="cursor:pointer" data-zone="z4b"><rect x="148" y="2" width="130" height="50" rx="4" fill="#E8D5F2"/>'
+ '<text x="213" y="21" font-family="Courier New" font-size="8" font-weight="700" fill="#3a1f5a" text-anchor="middle">Zone 4B</text>'
+ '<text x="213" y="33" font-family="Courier New" font-size="7" fill="#3a1f5a" text-anchor="middle">9G·9H·9I·9J</text>'
+ '<text x="213" y="43" font-family="Courier New" font-size="7" fill="#3a1f5a" text-anchor="middle">9K·9L·9M</text></g>'
// Horizontal walkway
+ '<rect x="2" y="54" width="276" height="7" fill="url(#wh1-hatch)"/>'
// Middle row: Zone 2 | 9TF-A / 9TF-B
+ '<g style="cursor:pointer" data-zone="z2"><rect x="2" y="63" width="146" height="66" rx="4" fill="#9EC8F0"/>'
+ '<text x="75" y="86" font-family="Courier New" font-size="9" font-weight="700" fill="#0a2a42" text-anchor="middle">Zone 2</text>'
+ '<text x="75" y="99" font-family="Courier New" font-size="7" fill="#0a2a42" text-anchor="middle">9Q·7E·7F·7G·12A–12F</text></g>'
+ '<g style="cursor:pointer" data-bin="9TF-A"><rect x="150" y="63" width="128" height="31" rx="4" fill="#EEB8D4"/>'
+ '<text x="214" y="79" font-family="Courier New" font-size="8" font-weight="700" fill="#4a0f28" text-anchor="middle">9TF-A</text></g>'
+ '<g style="cursor:pointer" data-bin="9TF-B"><rect x="150" y="97" width="128" height="32" rx="4" fill="#EEB8D4"/>'
+ '<text x="214" y="113" font-family="Courier New" font-size="8" font-weight="700" fill="#4a0f28" text-anchor="middle">9TF-B</text></g>'
// Bottom-of-middle row: Zone 7 | wk | Zone 8 | spacer | Zone 6
+ '<g style="cursor:pointer" data-zone="z7"><rect x="2" y="133" width="64" height="56" rx="4" fill="#B8E86B"/>'
+ '<text x="34" y="156" font-family="Courier New" font-size="8" font-weight="700" fill="#2a4400" text-anchor="middle">Zone 7</text>'
+ '<text x="34" y="168" font-family="Courier New" font-size="7" fill="#2a4400" text-anchor="middle">5A-D·7A-D</text></g>'
+ '<rect x="68" y="133" width="7" height="56" rx="2" fill="url(#wh1-hatch)"/>'
+ '<g style="cursor:pointer" data-zone="z8"><rect x="77" y="133" width="52" height="56" rx="4" fill="#FFF2A8"/>'
+ '<text x="103" y="156" font-family="Courier New" font-size="8" font-weight="700" fill="#4a3f0a" text-anchor="middle">Zone 8</text>'
+ '<text x="103" y="168" font-family="Courier New" font-size="7" fill="#4a3f0a" text-anchor="middle">9N·5E·9O</text></g>'
+ '<rect x="131" y="133" width="17" height="56" fill="#111"/>'
+ '<g style="cursor:pointer" data-zone="z6"><rect x="150" y="133" width="128" height="56" rx="4" fill="#C49FE0"/>'
+ '<text x="214" y="156" font-family="Courier New" font-size="8" font-weight="700" fill="#3a0f5a" text-anchor="middle">Zone 6</text>'
+ '<text x="214" y="168" font-family="Courier New" font-size="7" fill="#3a0f5a" text-anchor="middle">6A · 6B · 9P</text></g>'
// Horizontal walkway
+ '<rect x="2" y="193" width="276" height="7" fill="url(#wh1-hatch)"/>'
// Bottom row: Zone 1 | Zone 3
+ '<g style="cursor:pointer" data-zone="z1"><rect x="2" y="203" width="136" height="90" rx="4" fill="#F4A030"/>'
+ '<text x="70" y="240" font-family="Courier New" font-size="10" font-weight="700" fill="#3d1a00" text-anchor="middle">Zone 1</text>'
+ '<text x="70" y="254" font-family="Courier New" font-size="7" fill="#3d1a00" text-anchor="middle">1·4A·4B·4C·10A–10E</text></g>'
+ '<g style="cursor:pointer" data-zone="z3"><rect x="142" y="203" width="136" height="90" rx="4" fill="#7DC87D"/>'
+ '<text x="210" y="240" font-family="Courier New" font-size="10" font-weight="700" fill="#0f2e0f" text-anchor="middle">Zone 3</text>'
+ '<text x="210" y="254" font-family="Courier New" font-size="7" fill="#0f2e0f" text-anchor="middle">3A1·3A2·3B–3G·10F-10H</text></g>'
// Office / Breakroom strip
+ '<rect x="2" y="297" width="276" height="14" rx="3" fill="#222"/>'
+ '<text x="140" y="304" font-family="Courier New" font-size="6.5" fill="#555" text-anchor="middle" dominant-baseline="central">Office · Breakroom · Restrooms</text>'
+ '<text x="275" y="320" font-family="Courier New" font-size="8" fill="#444" text-anchor="end">N ▲</text>'
+ '</svg>';

// ---- STATE (per-instance) ----
function MapInstance(containerEl, onConfirmCb){
  this.root = containerEl;
  this.onConfirmCb = onConfirmCb;
  this.sel = null;
  this.build();
}

MapInstance.prototype.build = function(){
  var self = this;
  injectCSS();
  this.root.innerHTML = ''
    + '<div class="wh1map-root">'
    +   '<div class="wh1map-hdr">'
    +     '<h3>WH1 · COLLINS</h3>'
    +     '<span class="wh1map-badge" data-role="badge">No bin selected</span>'
    +   '</div>'
    +   '<div class="wh1map-outer">'
    +     '<div class="wh1map-side"><button class="wh1map-sbtn half" data-bin="8A">8A</button></div>'
    +     '<div class="wh1map-wrap" data-role="svg-wrap">' + SVG_MARKUP + '</div>'
    +     '<div class="wh1map-side">'
    +       '<button class="wh1map-sbtn" data-bin="8C" style="height:78px">8C</button>'
    +       '<button class="wh1map-sbtn" data-bin="8D" style="height:78px">8D</button>'
    +     '</div>'
    +   '</div>'
    +   '<div class="wh1map-confirm" data-role="confirm">'
    +     '<span class="wh1map-ctext" data-role="confirmText">—</span>'
    +     '<button class="wh1map-cbtn" data-role="confirmBtn">Confirm ✓</button>'
    +   '</div>'
    + '</div>';

  // Drawer overlay is appended to <body> so it can render above other UI
  if(!document.getElementById('wh1map-ov')){
    var ov = document.createElement('div');
    ov.id = 'wh1map-ov';
    ov.className = 'wh1map-ov';
    ov.innerHTML = ''
      + '<div class="wh1map-drawer">'
      +   '<div class="wh1map-grip"></div>'
      +   '<div class="wh1map-dtitle" data-role="dtitle">Select bin</div>'
      +   '<div class="wh1map-dsub">Tap the exact bin you are counting in</div>'
      +   '<div data-role="dcontent"></div>'
      +   '<button class="wh1map-dcancel" data-role="dcancel">Cancel</button>'
      + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if(e.target === ov) self.closeDrawer(); });
    ov.querySelector('[data-role="dcancel"]').addEventListener('click', function(){ self.closeDrawer(); });
  }
  this.ov = document.getElementById('wh1map-ov');

  // Wire up zone clicks and direct-bin clicks in SVG
  var svg = this.root.querySelector('[data-role="svg-wrap"] svg');
  svg.querySelectorAll('g[data-zone]').forEach(function(g){
    g.addEventListener('click', function(){ self.openZone(g.getAttribute('data-zone')); });
    g.addEventListener('touchstart', function(){ g.style.opacity='.72'; }, {passive:true});
    g.addEventListener('touchend',   function(){ g.style.opacity='1'; });
  });
  svg.querySelectorAll('g[data-bin]').forEach(function(g){
    g.addEventListener('click', function(){ self.pick(g.getAttribute('data-bin')); });
    g.addEventListener('touchstart', function(){ g.style.opacity='.72'; }, {passive:true});
    g.addEventListener('touchend',   function(){ g.style.opacity='1'; });
  });

  // Wire up side buttons (8A/8C/8D)
  this.root.querySelectorAll('button[data-bin]').forEach(function(b){
    b.addEventListener('click', function(){ self.pick(b.getAttribute('data-bin')); });
  });

  // Wire up Confirm button
  this.root.querySelector('[data-role="confirmBtn"]').addEventListener('click', function(){ self.doConfirm(); });
};

// ---- HELPERS FOR BUILDING DRAWER GRIDS ----
var _self;  // current MapInstance for builder callbacks (set on openZone)

function mkB(bin, rs, cs, opts){
  var e = document.createElement('td');
  e.style.background = C[bin] || '#eee';
  e.style.color = '#111';
  e.textContent = bin;
  if(rs) e.rowSpan = rs;
  if(cs) e.colSpan = cs;
  if(opts){
    if(opts.h)  e.style.height   = opts.h;
    if(opts.fs) e.style.fontSize = opts.fs;
  }
  if(_self && _self.sel === bin) e.classList.add('sel');
  e.onclick = function(){
    document.querySelectorAll('[data-role="dcontent"] td').forEach(function(x){ x.classList.remove('sel'); });
    e.classList.add('sel');
    _self.pick(bin);
    setTimeout(function(){ _self.closeDrawer(); }, 200);
  };
  return e;
}

function mkW(rs, cs){
  var e = document.createElement('td');
  e.className = 'wk';
  if(rs) e.rowSpan = rs;
  if(cs){ e.colSpan = cs; e.style.height = '10px'; }
  return e;
}
function mkG(rs, cs){ var e=document.createElement('td'); e.className='grey'; if(rs)e.rowSpan=rs; if(cs)e.colSpan=cs; return e; }
function mkE(rs, cs){ var e=document.createElement('td'); e.className='emp';  if(rs)e.rowSpan=rs; if(cs)e.colSpan=cs; return e; }
function row(){ return document.createElement('tr'); }
function tbl(){ var t=document.createElement('table'); t.className='wh1map-tbl'; return t; }

// Grid-based builders for zones needing precise width control (Zone 1, 3, 7, 8)
function gridBin(wrap, bin, opts){
  opts = opts || {};
  var d = document.createElement('div');
  d.style.background = C[bin];
  d.style.color = '#111';
  d.style.borderRadius = '6px';
  d.style.fontWeight = '700';
  d.style.fontSize = '11px';
  d.style.display = 'flex';
  d.style.alignItems = 'center';
  d.style.justifyContent = 'center';
  d.style.cursor = 'pointer';
  d.style.border = '2px solid transparent';
  d.style.height = opts.h || '40px';
  if(opts.gridRow) d.style.gridRow = opts.gridRow;
  if(opts.gridCol) d.style.gridColumn = opts.gridCol;
  d.textContent = bin;
  d.setAttribute('data-bin', bin);
  if(_self && _self.sel === bin){
    d.style.borderColor = '#5DCAA5';
    d.style.boxShadow = '0 0 0 2px #5DCAA544';
  }
  d.onclick = function(){
    wrap.querySelectorAll('div[data-bin]').forEach(function(x){
      x.style.borderColor = 'transparent';
      x.style.boxShadow = '';
    });
    d.style.borderColor = '#5DCAA5';
    d.style.boxShadow = '0 0 0 2px #5DCAA544';
    _self.pick(bin);
    setTimeout(function(){ _self.closeDrawer(); }, 200);
  };
  return d;
}
function gridWk(opts){
  opts = opts || {};
  var d = document.createElement('div');
  d.style.background = WK_BG;
  d.style.borderRadius = '2px';
  if(opts.h)       d.style.height     = opts.h;
  if(opts.gridRow) d.style.gridRow    = opts.gridRow;
  if(opts.gridCol) d.style.gridColumn = opts.gridCol;
  return d;
}
function gridEmp(opts){
  opts = opts || {};
  var d = document.createElement('div');
  if(opts.gridRow) d.style.gridRow    = opts.gridRow;
  if(opts.gridCol) d.style.gridColumn = opts.gridCol;
  return d;
}

// ---- ZONE BUILDERS ----
var BUILDERS = {
  z5: function(){
    var t = tbl(), r = row();
    ['15A','15B','15C','15D'].forEach(function(b){ r.appendChild(mkB(b)); });
    t.appendChild(r); return t;
  },
  z4a: function(){
    var t = tbl(), r = row();
    ['9A','9B','9C','9D','9E','9F'].forEach(function(b){ r.appendChild(mkB(b)); });
    t.appendChild(r); return t;
  },
  z4b: function(){
    var t = tbl(), r = row();
    ['9G','9H','9I','9J','9K','9L','9M'].forEach(function(b){ r.appendChild(mkB(b)); });
    t.appendChild(r); return t;
  },

  // Zone 2: two-table stack (top section + bottom section)
  // Top: 9Q top-right + 12B/12C side-by-side (no internal walkway)
  // Bottom: vertical walkway column down through 12A/12D, 7F/12E, 7E/12F, grey/7G
  z2: function(){
    var wrap = document.createElement('div');

    var topT = tbl();
    topT.style.marginBottom = '0';
    var rA = row();
    rA.appendChild(mkE(null, 3));
    rA.appendChild(mkB('9Q', null, null, {h:'30px', fs:'11px'}));
    topT.appendChild(rA);
    var rB = row();
    rB.appendChild(mkB('12B', null, 2, {h:'56px'}));
    rB.appendChild(mkB('12C', null, 2, {h:'56px'}));
    topT.appendChild(rB);
    wrap.appendChild(topT);

    var hw = document.createElement('div');
    hw.style.background    = WK_BG;
    hw.style.height        = '10px';
    hw.style.borderRadius  = '2px';
    hw.style.margin        = '3px 0';
    wrap.appendChild(hw);

    var botT = tbl();
    // Row 1: 12A | wk(rs=5) | 12D
    var rc1 = row();
    rc1.appendChild(mkB('12A'));
    rc1.appendChild(mkW(5));
    rc1.appendChild(mkB('12D'));
    botT.appendChild(rc1);
    // Row 2: 7F | (wk cont) | 12E
    var rc2 = row();
    rc2.appendChild(mkB('7F'));
    rc2.appendChild(mkB('12E'));
    botT.appendChild(rc2);
    // Row 3: horizontal walkway split by vertical wk col
    var rc3 = row();
    rc3.appendChild(mkW(null, 1));
    rc3.appendChild(mkW(null, 1));
    botT.appendChild(rc3);
    // Row 4: 7E | (wk cont) | 12F
    var rc4 = row();
    rc4.appendChild(mkB('7E'));
    rc4.appendChild(mkB('12F'));
    botT.appendChild(rc4);
    // Row 5: grey | (wk cont) | 7G
    var rc5 = row();
    rc5.appendChild(mkG());
    rc5.appendChild(mkB('7G'));
    botT.appendChild(rc5);
    wrap.appendChild(botT);

    return wrap;
  },

  // Zone 7: grid with narrow 7A/7B strips on the right
  z7: function(){
    var wrap = document.createElement('div');
    wrap.style.display = 'grid';
    wrap.style.gridTemplateColumns = '1fr 50px';
    wrap.style.gap = '3px';
    wrap.style.marginBottom = '10px';

    wrap.appendChild(gridBin(wrap, '7D', {gridRow:'1', gridCol:'1'}));
    wrap.appendChild(gridEmp({gridRow:'1', gridCol:'2'}));
    wrap.appendChild(gridWk({gridRow:'2', gridCol:'1 / span 2', h:'10px'}));
    wrap.appendChild(gridBin(wrap, '7C', {gridRow:'3', gridCol:'1'}));
    wrap.appendChild(gridBin(wrap, '7B', {gridRow:'3 / span 2', gridCol:'2', h:'auto'}));
    wrap.appendChild(gridBin(wrap, '5D', {gridRow:'4', gridCol:'1'}));
    wrap.appendChild(gridWk({gridRow:'5', gridCol:'1 / span 2', h:'10px'}));
    wrap.appendChild(gridBin(wrap, '5C', {gridRow:'6', gridCol:'1'}));
    wrap.appendChild(gridBin(wrap, '7A', {gridRow:'6 / span 2', gridCol:'2', h:'auto'}));
    wrap.appendChild(gridBin(wrap, '5B', {gridRow:'7', gridCol:'1'}));
    wrap.appendChild(gridWk({gridRow:'8', gridCol:'1 / span 2', h:'10px'}));
    wrap.appendChild(gridBin(wrap, '5A', {gridRow:'9', gridCol:'1'}));
    wrap.appendChild(gridEmp({gridRow:'9', gridCol:'2'}));
    return wrap;
  },

  // Zone 8: narrow bins (55px wide × 260px tall), left-aligned
  z8: function(){
    var wrap = document.createElement('div');
    wrap.style.display      = 'flex';
    wrap.style.gap          = '3px';
    wrap.style.marginBottom = '10px';
    ['9N','5E','9O'].forEach(function(bin){
      var b = document.createElement('div');
      b.style.background     = C[bin];
      b.style.color          = '#111';
      b.style.width          = '55px';
      b.style.height         = '260px';
      b.style.borderRadius   = '6px';
      b.style.fontWeight     = '700';
      b.style.fontSize       = '12px';
      b.style.display        = 'flex';
      b.style.alignItems     = 'center';
      b.style.justifyContent = 'center';
      b.style.cursor         = 'pointer';
      b.style.border         = '2px solid transparent';
      b.textContent          = bin;
      if(_self && _self.sel === bin){
        b.style.borderColor = '#5DCAA5';
        b.style.boxShadow   = '0 0 0 2px #5DCAA544';
      }
      b.onclick = function(){
        wrap.querySelectorAll('div').forEach(function(x){
          x.style.borderColor = 'transparent';
          x.style.boxShadow   = '';
        });
        b.style.borderColor = '#5DCAA5';
        b.style.boxShadow   = '0 0 0 2px #5DCAA544';
        _self.pick(bin);
        setTimeout(function(){ _self.closeDrawer(); }, 200);
      };
      wrap.appendChild(b);
    });
    return wrap;
  },

  z6: function(){
    var t = tbl();
    var r1 = row(); r1.appendChild(mkB('6B')); t.appendChild(r1);
    var rw = row(); rw.appendChild(mkW(null, 1)); t.appendChild(rw);
    var r2 = row(); r2.appendChild(mkB('6A')); t.appendChild(r2);
    var r3 = row(); r3.appendChild(mkB('9P')); t.appendChild(r3);
    return t;
  },

  // Zone 1: grid with tall columns (1, 4B, 4C, 10C, 10D) and short bars (10A, 10B, 10E)
  // 10A = 10B = 10E (short bars, span 2 cols of bin width)
  // 10D = 10C (single col, 112px tall)
  // 10E spans 2 cols, extends 1 col past 10D right edge
  z1: function(){
    var wrap = document.createElement('div');
    wrap.style.display = 'grid';
    wrap.style.gridTemplateColumns = '1fr 1fr 12px 1fr 1fr 12px 1fr 1fr';
    wrap.style.gap = '3px';
    wrap.style.marginBottom = '10px';

    wrap.appendChild(gridBin(wrap, '1',   {gridRow:'1 / span 3', gridCol:'1', h:'auto'}));
    wrap.appendChild(gridBin(wrap, '4B',  {gridRow:'1 / span 3', gridCol:'2', h:'auto'}));
    wrap.appendChild(gridWk({gridRow:'1 / span 3', gridCol:'3'}));
    wrap.appendChild(gridBin(wrap, '10B', {gridRow:'1', gridCol:'4 / span 2', h:'30px'}));
    wrap.appendChild(gridWk({gridRow:'1 / span 3', gridCol:'6'}));
    wrap.appendChild(gridBin(wrap, '10D', {gridRow:'1 / span 2', gridCol:'7', h:'auto'}));
    wrap.appendChild(gridEmp({gridRow:'1 / span 2', gridCol:'8'}));

    wrap.appendChild(gridBin(wrap, '4C',  {gridRow:'2', gridCol:'4', h:'112px'}));
    wrap.appendChild(gridBin(wrap, '10C', {gridRow:'2', gridCol:'5', h:'112px'}));

    wrap.appendChild(gridBin(wrap, '10A', {gridRow:'3', gridCol:'4 / span 2', h:'30px'}));
    wrap.appendChild(gridBin(wrap, '10E', {gridRow:'3', gridCol:'7 / span 2', h:'30px'}));

    wrap.appendChild(gridWk({gridRow:'4', gridCol:'1 / span 8', h:'10px'}));

    wrap.appendChild(gridBin(wrap, '4A',  {gridRow:'5', gridCol:'1 / span 2', h:'40px'}));

    return wrap;
  },

  // Zone 3: grid with 9 cols, L-shaped walkway, tall 3C-3G columns, 3B aligned with 3G
  z3: function(){
    var wrap = document.createElement('div');
    wrap.style.display = 'grid';
    wrap.style.gridTemplateColumns = '1fr 12px 1fr 1fr 12px 1fr 1fr 12px 1fr';
    wrap.style.gap = '3px';
    wrap.style.marginBottom = '10px';

    // Row 1: 3H tall (spans r1-r2), L-walkway vertical leg (rs=3), 10F/10G/10H short bars
    wrap.appendChild(gridBin(wrap, '3H',  {gridRow:'1 / span 2', gridCol:'1', h:'auto'}));
    wrap.appendChild(gridWk({gridRow:'1 / span 3', gridCol:'2'}));  // L-walkway vertical leg
    wrap.appendChild(gridBin(wrap, '10F', {gridRow:'1', gridCol:'3 / span 2', h:'30px'}));
    wrap.appendChild(gridWk({gridRow:'1 / span 2', gridCol:'5'}));
    wrap.appendChild(gridBin(wrap, '10G', {gridRow:'1', gridCol:'6 / span 2', h:'30px'}));
    wrap.appendChild(gridWk({gridRow:'1 / span 2', gridCol:'8'}));
    wrap.appendChild(gridBin(wrap, '10H', {gridRow:'1', gridCol:'9', h:'30px'}));

    // Row 2: 3C-3G tall columns
    wrap.appendChild(gridBin(wrap, '3C', {gridRow:'2', gridCol:'3', h:'100px'}));
    wrap.appendChild(gridBin(wrap, '3D', {gridRow:'2', gridCol:'4', h:'100px'}));
    wrap.appendChild(gridBin(wrap, '3E', {gridRow:'2', gridCol:'6', h:'100px'}));
    wrap.appendChild(gridBin(wrap, '3F', {gridRow:'2', gridCol:'7', h:'100px'}));
    wrap.appendChild(gridBin(wrap, '3G', {gridRow:'2', gridCol:'9', h:'100px'}));

    // Row 3: 3B spans cols 3-9 (right of vertical walkway, end-flush with 3G)
    wrap.appendChild(gridBin(wrap, '3B', {gridRow:'3', gridCol:'3 / span 7', h:'40px'}));

    // Row 4: horizontal walkway full width
    wrap.appendChild(gridWk({gridRow:'4', gridCol:'1 / span 9', h:'10px'}));

    // Rows 5-6: 3A1 and 3A2 on right side
    wrap.appendChild(gridBin(wrap, '3A1', {gridRow:'5', gridCol:'6 / span 4', h:'40px'}));
    wrap.appendChild(gridBin(wrap, '3A2', {gridRow:'6', gridCol:'6 / span 4', h:'40px'}));

    return wrap;
  }
};

var LABELS = {
  z5:  'Zone 5 — 15A–15D',
  z4a: 'Zone 4A — 9A–9F',
  z4b: 'Zone 4B — 9G–9M',
  z2:  'Zone 2 — 9Q·7E·7F·7G·12A–12F',
  z8:  'Zone 8 — 9N·5E·9O',
  z7:  'Zone 7 — 5A–5D·7A–7D',
  z6:  'Zone 6 — 6A·6B·9P',
  z1:  'Zone 1 — 1·4A–4C·10A–10E',
  z3:  'Zone 3 — 3A1·3A2·3B–3G·10F–10H'
};

// ---- MapInstance methods ----
MapInstance.prototype.openZone = function(zid){
  _self = this;
  this.ov.querySelector('[data-role="dtitle"]').textContent = LABELS[zid] || 'Select bin';
  var dc = this.ov.querySelector('[data-role="dcontent"]');
  dc.innerHTML = '';
  if(BUILDERS[zid]) dc.appendChild(BUILDERS[zid]());
  this.ov.classList.add('open');
  document.body.style.overflow = 'hidden';
};

MapInstance.prototype.closeDrawer = function(){
  this.ov.classList.remove('open');
  document.body.style.overflow = '';
};

MapInstance.prototype.pick = function(code){
  this.sel = code;
  var b = this.root.querySelector('[data-role="badge"]');
  b.textContent = 'Bin: ' + code;
  b.className   = 'wh1map-badge on';
  this.root.querySelector('[data-role="confirmText"]').textContent = 'Counting in: ' + code;
  this.root.querySelector('[data-role="confirm"]').className = 'wh1map-confirm show';
  if(typeof window.SCL_BIN_SELECT === 'function') window.SCL_BIN_SELECT(code);
};

MapInstance.prototype.doConfirm = function(){
  if(!this.sel) return;
  if(typeof window.SCL_BIN_CONFIRM === 'function') window.SCL_BIN_CONFIRM(this.sel);
  if(typeof this.onConfirmCb === 'function')      this.onConfirmCb(this.sel);
  var bar = this.root.querySelector('[data-role="confirm"]');
  bar.style.background = '#5DCAA530';
  setTimeout(function(){ bar.style.background = ''; }, 500);
};

// ---- PUBLIC API ----
window.WH1Map = {
  render: function(containerEl, onConfirmCallback){
    if(!containerEl){ console.error('WH1Map.render: containerEl required'); return null; }
    return new MapInstance(containerEl, onConfirmCallback);
  }
};

})();
