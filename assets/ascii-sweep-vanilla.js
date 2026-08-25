/*! Canvas UI AsciiSweep (Vanilla), DavidHDev/canvas-ui, MIT. Compiled from the official registry source. */
var CanvasUIAsciiSweep=(()=>{var se=Object.defineProperty;var Fe=Object.getOwnPropertyDescriptor;var De=Object.getOwnPropertyNames;var Pe=Object.prototype.hasOwnProperty;var Ie=(i,a)=>{for(var n in a)se(i,n,{get:a[n],enumerable:!0})},Be=(i,a,n,u)=>{if(a&&typeof a=="object"||typeof a=="function")for(let f of De(a))!Pe.call(i,f)&&f!==n&&se(i,f,{get:()=>a[f],enumerable:!(u=Fe(a,f))||u.enumerable});return i};var Ue=i=>Be(se({},"__esModule",{value:!0}),i);var Je={};Ie(Je,{createAsciiSweep:()=>Ke,supportsHtmlInCanvas:()=>We});var Te={ascii:[0,128,131200,14336,459200,469440,4357252,18157905,11512810,15724526],blocks:[0,328e3,22041621,22369621,11512810,33554431],binary:[0,4591758,15324974]},_e=.45,ue=16,He=500,Oe={angle:0,duration:2,band:.28,softness:.45,turbulence:.5,trail:.75,progress:-1,scale:2,spacing:1,charset:"ascii",glyphs:[],color:"#4ade80",tint:.75,glow:2,aberration:5,flicker:.35,density:.9,displace:14,contrast:1.2,brightness:0,invert:0,threshold:.1,fade:.75,blend:"auto",background:"auto",onSweepStart:()=>{},onSweepEnd:()=>{}},Ne=`#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,Ge=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform vec2 uResolution;
uniform float uProgress;
uniform vec2 uDir;
uniform float uBand;
uniform float uSoftness;
uniform float uTurbulence;
uniform float uTrail;
uniform float uGlyphPx;
uniform float uSpacing;
uniform uint uGlyphs[${ue}];
uniform int uGlyphCount;
uniform vec3 uInk;
uniform float uTint;
uniform float uGlow;
uniform float uAberration;
uniform float uFlicker;
uniform float uDensity;
uniform float uDisplace;
uniform float uContrast;
uniform float uBrightness;
uniform float uInvert;
uniform float uThreshold;
uniform float uFade;
uniform float uAdditive;
uniform vec3 uBg;
uniform float uBgLum;
uniform float uTime;
uniform float uLod;
uniform float uActive;
uniform float uMaxX;

#define S(a, b, t) smoothstep(a, b, t)

float glyphBit (int index, ivec2 p) {
  if (p.x < 0 || p.x > 4 || p.y < 0 || p.y > 4) return 0.0;
  uint bits = uGlyphs[index];
  return float((bits >> uint((4 - p.x) + 5 * p.y)) & 1u);
}

float hash21 (vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash31 (vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

vec4 panel (sampler2D tex, vec2 uv, float lod, vec2 fringe) {
  vec4 c = textureLod(tex, uv, lod);
  if (uAberration > 0.001) {
    c.r = textureLod(tex, uv + fringe, lod).r;
    c.b = textureLod(tex, uv - fringe, lod).b;
  }
  return c;
}

void main () {
  if (uActive < 0.001) {
    outColor = vec4(0.0);
    return;
  }

  vec2 uv = vUv;
  // Leave the panel's scrollbar alone. The output canvas spans the whole
  // container, but the captured content stops where the scrollbar begins.
  if (uv.x > uMaxX) {
    outColor = vec4(0.0);
    return;
  }
  float cellPx = max((5.0 + 2.0 * uSpacing) * uGlyphPx, 1.0);
  vec2 frag = uv * uResolution;
  vec2 cell = floor(frag / cellPx);
  vec2 cellUv = (cell + 0.5) * cellPx / uResolution;

  // Normalized coordinate along the sweep axis: 0 where the band enters, 1 where it leaves.
  float extent = max(0.5 * (abs(uDir.x) + abs(uDir.y)), 1e-4);
  float axis = dot(cellUv - 0.5, uDir) / (2.0 * extent) + 0.5;

  float band = max(uBand, 1e-3);

  // Tear the edge apart per text row so the boundary eats lines instead of
  // cutting straight. Seeds are time independent so the edge does not crawl.
  float rowSeed = hash21(vec2(floor(cell.y * 0.5), 19.7)) - 0.5;
  float cellSeed = hash21(cell * 0.37 + 3.1) - 0.5;
  float jitter = (rowSeed * 0.8 + cellSeed * 0.4) * uTurbulence * band;
  axis += jitter;

  float feather = max(clamp(uSoftness, 0.0, 1.0) * band, 1e-4);

  // The head travels just past the far edge, far enough for the character band
  // and its jittered edge to clear. Any glow still lingering past that is
  // dissolved by the fade out, rather than by stretching the travel further,
  // which would race the band across and leave the tail playing offscreen.
  float glowSpan = band * (1.0 + uTrail) + feather;
  float travel = 1.0 + band * (1.0 + uTrail) + uTurbulence * band;
  float head = uProgress * travel;
  float behind = head - axis;
  // Swap inside the band, where the characters are densest, so the change is
  // hidden. A wide crossfade would show both panels at once and read as ghosting.
  float swap = S(band * 0.30, band * 0.62, behind);
  float enter = S(0.0, feather, behind);
  float leave = 1.0 - S(band, band + max(uTrail, 0.001) * band, behind);
  float ascii = clamp(enter * leave, 0.0, 1.0);

  // A wider, softer envelope than the character band itself, used for bloom so
  // the glow reaches past the glyphs the way a phosphor tube does.
  float aura = (1.0 - S(0.0, glowSpan, abs(behind - band * 0.5)))
    * S(-feather * 2.0, feather, behind);

  vec2 fringe = (uDir * uAberration * max(ascii, aura * 0.5))
    / max(uResolution, vec2(1.0));

  vec2 texUv = vec2(uv.x, 1.0 - uv.y);
  if (uDisplace > 0.001) {
    // Displace in coarse horizontal slices that hold for a few frames, which
    // reads as tape tearing rather than per-frame noise.
    float sliceH = max(cellPx * 1.6, 2.0);
    float slice = floor(frag.y / sliceH);
    float tick = floor(uTime * 12.0);
    float pick = hash21(vec2(slice, tick));
    float tear = (hash21(vec2(slice * 1.7, tick * 0.31)) - 0.5)
      * step(0.45, pick);
    texUv.x += (tear * 2.0 * uDisplace * ascii) / max(uResolution.x, 1.0);
  }

  vec4 rawFrom = panel(uFrom, texUv, 0.0, fringe);
  vec4 rawTo = panel(uTo, texUv, 0.0, fringe);

  vec3 base = mix(
    mix(uBg, rawFrom.rgb, rawFrom.a),
    mix(uBg, rawTo.rgb, rawTo.a),
    swap);
  // Cover wherever either panel has ink, so the live DOM never shows through
  // mid-sweep and the two panels never appear stacked.
  float alpha = max(rawFrom.a, rawTo.a);

  vec2 cellTexUv = vec2(cellUv.x, 1.0 - cellUv.y);

  if (aura > 0.002) {
    // Bloom follows the edges the characters land on, not raw brightness.
    // Gating on absolute contrast would light up every filled region, so a
    // photo or a dark panel would bloom as one solid block. Comparing a sharp
    // sample against a broad one leaves only text, icons and real detail.
    vec2 spread = vec2(cellPx) / max(uResolution, vec2(1.0));
    float edge = 0.0;
    for (int i = 0; i < 5; i++) {
      vec2 tap = vec2(
        float(i == 1) - float(i == 2),
        float(i == 3) - float(i == 4)) * spread;
      vec4 sFrom = textureLod(uFrom, texUv + tap, uLod);
      vec4 sTo = textureLod(uTo, texUv + tap, uLod);
      vec4 bFrom = textureLod(uFrom, texUv + tap, uLod + 2.5);
      vec4 bTo = textureLod(uTo, texUv + tap, uLod + 2.5);
      vec3 sharpRgb = mix(
        mix(uBg, sFrom.rgb, sFrom.a), mix(uBg, sTo.rgb, sTo.a), swap);
      vec3 broadRgb = mix(
        mix(uBg, bFrom.rgb, bFrom.a), mix(uBg, bTo.rgb, bTo.a), swap);
      edge += abs(
        dot(sharpRgb, vec3(0.299, 0.587, 0.114)) -
        dot(broadRgb, vec3(0.299, 0.587, 0.114)));
    }
    edge = clamp(edge / (5.0 * 0.16), 0.0, 1.0);
    float haze = edge * aura * clamp(uGlow, 0.0, 2.0) * 0.5;
    base += uInk * haze * (0.55 + 0.85 * uAdditive);
    alpha = max(alpha, haze * 0.8);
  }

  if (ascii > 0.002) {
    vec4 cellFrom = panel(uFrom, cellTexUv, uLod, fringe);
    vec4 cellTo = panel(uTo, cellTexUv, uLod, fringe);
    vec3 cellRgb = mix(
      mix(uBg, cellFrom.rgb, cellFrom.a),
      mix(uBg, cellTo.rgb, cellTo.a),
      swap);

    float lum = dot(cellRgb, vec3(0.299, 0.587, 0.114));
    float ink = abs(lum - uBgLum);
    float present = S(uThreshold * 0.5, uThreshold + 0.02, ink);

    // Characters trace detail, not brightness. A broad average of the same
    // spot tells us whether this cell sits on an edge (text, icons, the fine
    // structure of a photo) or inside a flat region. Without this every cell
    // over a photo or a filled panel passes the ink test at once and the band
    // floods into a solid block of characters instead of following content.
    vec4 broadFrom = textureLod(uFrom, cellTexUv, uLod + 2.5);
    vec4 broadTo = textureLod(uTo, cellTexUv, uLod + 2.5);
    vec3 broadRgb = mix(
      mix(uBg, broadFrom.rgb, broadFrom.a),
      mix(uBg, broadTo.rgb, broadTo.a),
      swap);
    float detail = abs(lum - dot(broadRgb, vec3(0.299, 0.587, 0.114)));
    present *= mix(0.5, 1.0, S(0.01, uThreshold + 0.06, detail));

    present *= step(hash21(cell + 11.3), clamp(uDensity, 0.0, 1.0));
    if (uFlicker > 0.001) {
      float roll = hash31(vec3(cell, floor(uTime * 18.0)));
      present *= 1.0 - clamp(uFlicker, 0.0, 1.0) * step(roll, 0.4);
    }

    // A cell averaged over a glyph rarely exceeds a third of full contrast, so
    // normalize into that range before picking a character. Without this every
    // cell lands on the blank end of the ramp.
    float t = clamp(ink / 0.35, 0.0, 1.0);
    float amount = clamp((t - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0);
    amount = mix(amount, 1.0 - amount, clamp(uInvert, 0.0, 1.0));

    // Nudge the character choice per cell and per tick. Neighbouring cells then
    // land on different glyphs, which is what makes the band read as churning
    // text rather than as a regular screen of identical marks.
    float churn = hash31(vec3(cell, floor(uTime * 15.0))) - 0.5;
    float picked = clamp(amount + churn * 0.25, 0.0, 1.0);
    int index = min(int(picked * float(uGlyphCount)), uGlyphCount - 1);

    ivec2 local = ivec2(floor((frag - cell * cellPx) / max(uGlyphPx, 0.001)));
    int pad = int(uSpacing);
    float on = glyphBit(index, ivec2(local.x - pad, local.y - pad));

    // Push the sampled color away from the background so faint text still
    // reads as ink rather than fading into the page.
    vec3 contentInk = clamp(uBg + (cellRgb - uBg) / max(ink, 0.2), 0.0, 1.0);
    vec3 glyphColor = mix(contentInk, uInk, clamp(uTint, 0.0, 1.0));
    // Characters sit at their own brightness, so the band has depth instead of
    // every mark burning at one level.
    float level = 0.72 + 0.28 * hash21(cell * 0.91 + 7.7);
    glyphColor *= level;
    // The brightest characters burn toward white, like a hot phosphor core.
    glyphColor = mix(glyphColor, vec3(1.0),
      amount * amount * level * 0.55 * uAdditive);

    float strength = ascii * present;
    float lit = on * strength;

    // Dim from the continuous band envelope rather than the per-cell mask, so
    // the paper behind the characters darkens smoothly instead of in squares.
    base = mix(base, uBg, clamp(uFade, 0.0, 1.0) * ascii * (1.0 - on));
    base = mix(mix(base, glyphColor, lit), base + glyphColor * lit, uAdditive);
    alpha = max(alpha, lit);
  }

  base = clamp(base, 0.0, 1.0);
  alpha = clamp(alpha, 0.0, 1.0) * uActive;
  outColor = vec4(base * alpha, alpha);
}`;function We(){if(typeof document>"u")return!1;let i=document.createElement("canvas"),a=i.getContext("2d");return!!(a&&typeof a.drawElementImage=="function"&&typeof i.requestPaint=="function")}function Xe(i,a){return{left:Math.max(i.left,a.left),top:Math.max(i.top,a.top),right:Math.min(i.right,a.right),bottom:Math.min(i.bottom,a.bottom)}}function ze(i,a){let n=i.getBoundingClientRect(),u=Math.min(window.devicePixelRatio||1,2),f=Math.max(1,Math.round(n.width*u)),e=Math.max(1,Math.round(n.height*u));(a.width!==f||a.height!==e)&&(a.width=f,a.height=e);let s=a.getContext("2d");if(!s)throw new Error("2D canvas is unavailable");s.resetTransform(),s.clearRect(0,0,f,e),s.scale(u,u);let x={left:n.left,top:n.top,right:n.right,bottom:n.bottom},w=new WeakMap;function E(T){let c=w.get(T);if(c)return c;let o=T.parentElement,p=o&&i.contains(o)?E(o):null,v=getComputedStyle(T),S=Number.parseFloat(v.opacity),d=(p?.opacity??1)*(Number.isFinite(S)?S:1),g=(p?.visible??!0)&&v.display!=="none"&&v.visibility!=="hidden"&&v.visibility!=="collapse"&&d>0,b=p?.childrenClip??x,k=T.getBoundingClientRect(),M={...b};v.overflowX!=="visible"&&(M.left=Math.max(M.left,k.left),M.right=Math.min(M.right,k.right)),v.overflowY!=="visible"&&(M.top=Math.max(M.top,k.top),M.bottom=Math.min(M.bottom,k.bottom));let C={style:v,visible:g,opacity:d,clip:b,childrenClip:M};return w.set(T,C),C}let R=document.createTreeWalker(i,NodeFilter.SHOW_ELEMENT),y=R.currentNode;for(;y;){let T=y,c=T.getBoundingClientRect(),o=E(T),p=Xe(c,o.clip);if(o.visible&&p.right>p.left&&p.bottom>p.top){let{style:v}=o;s.save(),s.beginPath(),s.rect(o.clip.left-n.left,o.clip.top-n.top,o.clip.right-o.clip.left,o.clip.bottom-o.clip.top),s.clip(),s.globalAlpha=o.opacity;let S=c.left-n.left,d=c.top-n.top;v.backgroundColor!=="transparent"&&(s.fillStyle=v.backgroundColor,s.fillRect(S,d,c.width,c.height)),qe(s,T,v,c,n),Ye(s,T,v,n),$e(s,v,c,n),s.restore()}y=R.nextNode()}s.globalAlpha=1}function qe(i,a,n,u,f){let e=a instanceof HTMLImageElement?a.complete&&a.naturalWidth>0?a:null:a instanceof HTMLCanvasElement||a instanceof HTMLVideoElement&&a.readyState>=2?a:null;if(!e||!Ve(e))return;let s=e instanceof HTMLImageElement?e.naturalWidth:e instanceof HTMLVideoElement?e.videoWidth:e.width,x=e instanceof HTMLImageElement?e.naturalHeight:e instanceof HTMLVideoElement?e.videoHeight:e.height;if(!(s>0&&x>0))return;let w=0,E=0,R=s,y=x,T=u.left-f.left,c=u.top-f.top,o=u.width,p=u.height,[v,S]=je(n.objectPosition);if(n.objectFit==="cover"){let d=Math.max(u.width/s,u.height/x);R=u.width/d,y=u.height/d,w=(s-R)*v,E=(x-y)*S}else if(n.objectFit==="contain"||n.objectFit==="scale-down"){let d=Math.min(u.width/s,u.height/x,n.objectFit==="scale-down"?1:Number.POSITIVE_INFINITY);o=s*d,p=x*d,T+=(u.width-o)*v,c+=(u.height-p)*S}try{i.drawImage(e,w,E,R,y,T,c,o,p)}catch{}}function Ve(i){let a=document.createElement("canvas");a.width=a.height=1;let n=a.getContext("2d",{willReadFrequently:!0});if(!n)return!1;try{return n.drawImage(i,0,0,1,1),n.getImageData(0,0,1,1),!0}catch{return!1}}function je(i){let[a="50%",n="50%"]=i.split(/\s+/);return[Se(a,"left","right"),Se(n,"top","bottom")]}function Se(i,a,n){return i===a?0:i===n?1:i==="center"?.5:i.endsWith("%")?Math.min(1,Math.max(0,Number.parseFloat(i)/100)):.5}function Ye(i,a,n,u){let f=Array.from(a.childNodes).filter(c=>c.nodeType===Node.TEXT_NODE&&c.textContent?.trim());if(f.length===0)return;i.fillStyle=n.color,i.font=`${n.fontStyle} ${n.fontWeight} ${n.fontSize} ${n.fontFamily}`,i.textBaseline="alphabetic","letterSpacing"in i&&(i.letterSpacing=n.letterSpacing==="normal"?"0px":n.letterSpacing);let e=n.textAlign==="center"||n.textAlign==="right"||n.textAlign==="start"||n.textAlign==="end"?n.textAlign:"left",s=n.direction==="rtl"?"rtl":"ltr";i.textAlign=e,i.direction=s;let x=n.whiteSpace,w=x==="pre"||x==="pre-wrap"||x==="pre-line"||x==="break-spaces",E=w&&x!=="pre-line",R=e==="center"?.5:e==="right"||e==="end"&&s==="ltr"||e==="start"&&s==="rtl"?1:0;function y(c){return n.textTransform==="uppercase"?c.toUpperCase():n.textTransform==="lowercase"?c.toLowerCase():c}function T(c,o){let p=o.filter(d=>d.right>u.left&&d.left<u.right&&d.bottom>u.top&&d.top<u.bottom);if(p.length===0)return;let v=p.reduce((d,g)=>d+g.width,0),S=0;for(let d=0;d<p.length;d++){let g=p[d],b=c.length-S;if(b<=0)break;let k=d===p.length-1?b:Math.min(b,Math.max(1,Math.round(c.length*g.width/v))),M=c.slice(S,S+k);S+=k;let C=E?M:M.trim();if(!C.trim())continue;let N=g.left-u.left+g.width*R,G=i.measureText(C),U=G.fontBoundingBoxAscent??0,D=G.fontBoundingBoxDescent??0,W=U>0?g.top-u.top+(g.height-U-D)/2+U:g.bottom-u.top-g.height*.2;i.fillText(C,N,W,Math.max(g.width,1))}}for(let c of f){let o=c.textContent??"",p=document.createRange();if(w){let S=0;for(let d of o.split(`
`)){let g=S;if(S+=d.length+1,!d.trim())continue;p.setStart(c,g),p.setEnd(c,g+d.length);let b=y(E?d:d.replace(/\s+/g," ").trim());T(b,Array.from(p.getClientRects()))}continue}let v=y(o.replace(/\s+/g," ").trim());v&&(p.selectNodeContents(c),T(v,Array.from(p.getClientRects())))}}function $e(i,a,n,u){let f=n.left-u.left,e=n.top-u.top,s=Number.parseFloat(a.borderTopWidth),x=Number.parseFloat(a.borderRightWidth),w=Number.parseFloat(a.borderBottomWidth),E=Number.parseFloat(a.borderLeftWidth);s>0&&(i.fillStyle=a.borderTopColor,i.fillRect(f,e,n.width,s)),x>0&&(i.fillStyle=a.borderRightColor,i.fillRect(f+n.width-x,e,x,n.height)),w>0&&(i.fillStyle=a.borderBottomColor,i.fillRect(f,e+n.height-w,n.width,w)),E>0&&(i.fillStyle=a.borderLeftColor,i.fillRect(f,e,E,n.height))}function Ke(i,a={}){try{return Qe(i,a)}catch(n){return console.error("AsciiSweep initialization failed:",n),null}}function Qe(i,a){let n={...Oe,...a},{slots:u,output:f}=i;if(!u||u.length!==2)throw new Error("AsciiSweep needs exactly two slots");let e=f.getContext("webgl2",{alpha:!0,depth:!1,stencil:!1,antialias:!1,premultipliedAlpha:!0});if(!e||e.isContextLost())return null;let s=(()=>{let t=document.createElement("canvas");return t.width=t.height=1,t.getContext("2d",{willReadFrequently:!0})})();function x(t){if(!s||!t)return null;s.clearRect(0,0,1,1),s.fillStyle="#000",s.fillStyle=t;let r=s.fillStyle;s.clearRect(0,0,1,1),s.fillStyle=r,s.fillRect(0,0,1,1);let[l,h,m,I]=s.getImageData(0,0,1,1).data;return I===0?null:[l/255,h/255,m/255]}let w=!1,E=()=>{};function R(t,r){let l=e.createShader(t);if(e.shaderSource(l,r),e.compileShader(l),!e.getShaderParameter(l,e.COMPILE_STATUS)){let h=e.getShaderInfoLog(l)||"Unknown shader error";throw e.deleteShader(l),new Error(h)}return l}let y=R(e.VERTEX_SHADER,Ne),T=R(e.FRAGMENT_SHADER,Ge),c=e.createProgram();if(e.attachShader(c,y),e.attachShader(c,T),e.linkProgram(c),!e.getProgramParameter(c,e.LINK_STATUS)){let t=e.getProgramInfoLog(c)||"Unknown program link error";throw e.deleteProgram(c),e.deleteShader(y),e.deleteShader(T),new Error(t)}let o={},p=e.getProgramParameter(c,e.ACTIVE_UNIFORMS);for(let t=0;t<p;t++){let r=e.getActiveUniform(c,t);o[r.name]=e.getUniformLocation(c,r.name)}let v=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,v),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);function S(){let t=e.createTexture();return e.bindTexture(e.TEXTURE_2D,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([0,0,0,0])),t}let d=u[0].source.getContext("2d"),g=!!(d&&typeof d.drawElementImage=="function"&&typeof u[0].source.requestPaint=="function"),b=u.map((t,r)=>({source:t.source,content:t.content,ctx:r===0?d:t.source.getContext("2d"),paintable:t.source,texture:S(),fallbackCanvas:null,dirty:!1,stamp:0,captureTimer:0,captureDeadline:0,scrollTimer:0,capturedScrollLeft:0,capturedScrollTop:0,captureErrorLogged:!1,uploadErrorLogged:!1}));if(g)for(let t of b)t.paintable.onpaint=()=>{try{t.ctx.reset(),t.ctx.drawElementImage(t.content,0,0),t.dirty=!0,E()}catch{}};function k(t,r=!1){if(g||w)return;let l=r?0:He,h=performance.now()+l;t.captureTimer&&t.captureDeadline<=h||(window.clearTimeout(t.captureTimer),t.captureDeadline=h,t.captureTimer=window.setTimeout(()=>M(t),l))}function M(t){window.clearTimeout(t.captureTimer),window.clearTimeout(t.scrollTimer),t.captureTimer=0,t.scrollTimer=0;try{if(ze(t.content,t.source),w)return;t.fallbackCanvas=t.source,t.capturedScrollLeft=t.content.scrollLeft,t.capturedScrollTop=t.content.scrollTop,t.dirty=!0,t.captureErrorLogged=!1,E()}catch(r){!w&&!t.captureErrorLogged&&(t.captureErrorLogged=!0,console.warn("AsciiSweep could not capture its HTML fallback:",r))}}function C(t=!1){for(let r of b)g?r.paintable.requestPaint?.():k(r,t)}function N(t){b.forEach((r,l)=>{let h=l===t,m=g?r.source:r.content;m.style.zIndex=h?"1":"0",m.style.pointerEvents=h?"":"none",r.content.style.backgroundColor=fe,h?m.removeAttribute("aria-hidden"):m.setAttribute("aria-hidden","true"),m.inert=!h})}let G=1;function U(){let t=!1;G=Math.min(1,Math.max(.05,b[0].content.clientWidth/Math.max(f.clientWidth,1)));let r=Math.min(window.devicePixelRatio||1,2),l=Math.max(1,Math.round(f.clientWidth*r)),h=Math.max(1,Math.round(f.clientHeight*r));if((f.width!==l||f.height!==h)&&(f.width=l,f.height=h,t=!0),g)for(let m of b){let I=Math.max(1,Math.round(m.source.clientWidth)),_=Math.max(1,Math.round(m.source.clientHeight));(m.source.width!==I*r||m.source.height!==_*r)&&(m.source.width=I*r,m.source.height=_*r,t=!0),m.paintable.requestPaint?.()}return t}U();let D=[1,1,1],W=1,Y=[.29,.87,.5],fe="#ffffff";function X(){let t=null,r=null;if(n.background&&n.background!=="auto"&&(t=x(n.background),t&&(r=n.background)),!t){let l=b[0].content;for(;l;){let h=getComputedStyle(l).backgroundColor;if(h&&h!=="transparent"){let m=x(h);if(m){t=m,r=h;break}}l=l.parentElement}}D=t??[1,1,1],W=.299*D[0]+.587*D[1]+.114*D[2],fe=r??"#ffffff",Y=x(n.color)??[.29,.87,.5]}X();let ee=new Uint32Array(ue);function Ee(){let t=n.glyphs.length>1?n.glyphs:Te[n.charset]??Te.ascii,r=Math.min(t.length,ue);ee.fill(0);for(let l=0;l<r;l++)ee[l]=t[l]>>>0;return r}function ye(t){let r=g?t.source:t.fallbackCanvas;if(!(!r||!t.dirty)&&!(r.width<1||r.height<1)){t.dirty=!1;try{e.bindTexture(e.TEXTURE_2D,t.texture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,r),e.generateMipmap(e.TEXTURE_2D),t.stamp=performance.now(),t.uploadErrorLogged=!1}catch(l){t.uploadErrorLogged||(t.uploadErrorLogged=!0,console.warn("AsciiSweep could not upload a panel texture:",l))}}}let F=0,z=0,H=1,P=0,O=!1,te=0,$=!1,K=n.angle,q=0,B=0,V=!1,de=()=>n.progress>=0;function he(t){for(let ke of b)ye(ke);let r=b[z],l=b[H];e.useProgram(c),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,r.texture),e.uniform1i(o.uFrom,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,l.texture),e.uniform1i(o.uTo,1),e.uniform2f(o.uResolution,f.width,f.height),e.uniform1f(o.uProgress,P);let h=K*Math.PI/180;e.uniform2f(o.uDir,Math.cos(h),Math.sin(h));let m=f.width/Math.max(f.clientWidth,1),I=Math.max(n.scale,.5),_=Math.round(Math.min(Math.max(n.spacing,0),3));e.uniform1f(o.uGlyphPx,I*m),e.uniform1f(o.uSpacing,_),e.uniform1f(o.uLod,Math.max(0,Math.log2((5+2*_)*I*m)-1));let Re=Ee();e.uniform1uiv(o["uGlyphs[0]"],ee),e.uniform1i(o.uGlyphCount,Re),e.uniform1f(o.uBand,Math.min(Math.max(n.band,.02),1)),e.uniform1f(o.uSoftness,n.softness),e.uniform1f(o.uTurbulence,Math.max(n.turbulence,0)),e.uniform1f(o.uTrail,Math.max(n.trail,0)),e.uniform3f(o.uInk,Y[0],Y[1],Y[2]),e.uniform1f(o.uTint,n.tint),e.uniform1f(o.uGlow,n.glow),e.uniform1f(o.uAberration,Math.max(n.aberration,0)*m),e.uniform1f(o.uFlicker,n.flicker),e.uniform1f(o.uDensity,n.density),e.uniform1f(o.uDisplace,Math.max(n.displace,0)*m),e.uniform1f(o.uContrast,Math.max(n.contrast,0)),e.uniform1f(o.uBrightness,n.brightness),e.uniform1f(o.uInvert,n.invert),e.uniform1f(o.uThreshold,Math.max(n.threshold,.001)),e.uniform1f(o.uFade,n.fade),e.uniform1f(o.uAdditive,n.blend==="add"?1:n.blend==="over"?0:W<.5?1:0),e.uniform3f(o.uBg,D[0],D[1],D[2]),e.uniform1f(o.uBgLum,W),e.uniform1f(o.uTime,t/1e3),e.uniform1f(o.uActive,B),e.uniform1f(o.uMaxX,G),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,f.width,f.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.drawArrays(e.TRIANGLE_STRIP,0,4)}let ne=0,j=!1,re=performance.now(),Q=!0,J=typeof document>"u"||document.visibilityState!=="hidden",Z=window.matchMedia("(prefers-reduced-motion: reduce)"),oe=Z.matches;function Me(t){let r=1-Math.min(Math.max(t,0),1);return 1-r*r*r}function Ce(t){return 1-Math.cbrt(1-Math.min(Math.max(t,0),1))}function me(t){if(!w){if(!Q||!J){j=!1;return}if(de()){P=Math.min(Math.max(n.progress,0),1),z=0,H=1;let r=P>=.5?1:0;r!==F&&(F=r,N(F)),B=1,he(t),j=!1;return}if(O){$||($=!0,te=t);let r=Math.max(n.duration,.05),l=oe?1:Math.min(1,(t-te)/1e3/r);P=Me(l),l>=1&&(P=1,O=!1,q=2,n.onSweepEnd?.(F))}if(V){let r=oe?1:(t-re)/1e3/_e;B=Math.max(0,B-Math.max(r,0)),B<=.001&&(B=0,V=!1)}if(re=t,he(t),!O&&!V){if(q>0)q-=1,q===0&&(V=!0);else if(B===0){j=!1;return}}ne=requestAnimationFrame(me)}}function A(){w||j||!Q||!J||(j=!0,re=performance.now(),ne=requestAnimationFrame(me))}E=A,N(F),C(!0),A();function Le(t,r){if(w||de())return;let l=t===1?1:0;if(!(O?l===H:l===F)){if(O){P=1-P;let h=z;z=H,H=h,K=(K+180)%360,te=performance.now()-Ce(P)*Math.max(n.duration,.05)*1e3,$=!0}else z=F,H=l,P=0,K=r?.angle??n.angle,$=!1;F=l,O=!0,q=0,V=!1,B=1,N(F),C(!0),n.onSweepStart?.(l),A()}}function pe(){oe=Z.matches,A()}Z.addEventListener("change",pe);let ae=0;function ie(){X(),A(),window.clearTimeout(ae),ae=window.setTimeout(()=>{X(),C(),A()},300)}let ge=new MutationObserver(ie);ge.observe(document.documentElement,{attributes:!0,attributeFilter:["class","style","data-theme"]});let be=window.matchMedia("(prefers-color-scheme: dark)");be.addEventListener("change",ie);let le=new ResizeObserver(()=>{U()&&C(),A()});le.observe(f);for(let t of b)le.observe(t.content);let ve=new IntersectionObserver(t=>{Q=t[t.length-1]?.isIntersecting??!0,Q&&A()});ve.observe(f);let ce=!1;function xe(t){if(ce||w)return;let r=t.target;if(r){ce=!0;for(let l of b)l.content!==r&&(l.content.scrollTop!==r.scrollTop&&(l.content.scrollTop=r.scrollTop),l.content.scrollLeft!==r.scrollLeft&&(l.content.scrollLeft=r.scrollLeft));ce=!1,C(),A()}}for(let t of b)t.content.addEventListener("scroll",xe,{passive:!0});function we(){J=document.visibilityState!=="hidden",J&&A()}document.addEventListener("visibilitychange",we);let Ae=g?[]:b.map(t=>{let r=new MutationObserver(()=>k(t));return r.observe(t.content,{attributes:!0,attributeFilter:["class","hidden","src","srcset","style"],characterData:!0,childList:!0,subtree:!0}),r});function L(){for(let t of b)k(t)}if(!g){for(let t of b)t.content.addEventListener("load",L,!0),t.content.addEventListener("loadeddata",L,!0),t.content.addEventListener("input",L,!0),t.content.addEventListener("change",L,!0),t.content.addEventListener("transitionend",L,!0),t.content.addEventListener("animationend",L,!0);document.fonts?.addEventListener("loadingdone",L)}return{setOptions(t){let r=!1;for(let[l,h]of Object.entries(t)){if(typeof h=="function")continue;let m=n[l];if(Array.isArray(h)&&Array.isArray(m)){if(h.length!==m.length||h.some((I,_)=>I!==m[_])){r=!0;break}}else if(m!==h){r=!0;break}}Object.assign(n,t),r&&(X(),A())},sweep:Le,current:()=>F,capture:()=>{C(!0),A()},resize(){U(),X(),C(),A()},destroy(){w=!0,cancelAnimationFrame(ne),window.clearTimeout(ae),le.disconnect(),ve.disconnect(),ge.disconnect();for(let t of Ae)t.disconnect();if(be.removeEventListener("change",ie),Z.removeEventListener("change",pe),document.removeEventListener("visibilitychange",we),!g){for(let t of b)t.content.removeEventListener("load",L,!0),t.content.removeEventListener("loadeddata",L,!0),t.content.removeEventListener("input",L,!0),t.content.removeEventListener("change",L,!0),t.content.removeEventListener("transitionend",L,!0),t.content.removeEventListener("animationend",L,!0);document.fonts?.removeEventListener("loadingdone",L)}for(let t of b)t.content.removeEventListener("scroll",xe),window.clearTimeout(t.captureTimer),window.clearTimeout(t.scrollTimer),e.deleteTexture(t.texture),g&&(t.paintable.onpaint=null);e.deleteProgram(c),e.deleteShader(y),e.deleteShader(T),e.deleteBuffer(v)}}}return Ue(Je);})();
