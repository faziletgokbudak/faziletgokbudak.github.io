/*
 * Profile orb — the profile photo textured onto an analytic sphere and
 * sealed under a material: a specular glint and a Fresnel rim track the
 * cursor, with a spherical bulge so it reads as 3D. The face is kept near
 * full brightness (gloss added on top), so it stays natural.
 *
 * Set the material via the front-matter flag `relight_medallion: <name>`.
 * Use `relight_medallion: demo` to show a temporary on-page switcher for
 * trying them all; then set the winner's name and the switcher disappears.
 *
 * Lazy-inits on view, pauses off-screen, honours reduced-motion, falls back
 * to the plain <img> when WebGL is unavailable.
 */
(function () {
  "use strict";

  var container = document.getElementById("relight-orb");
  var canvas = document.getElementById("relight-gl");
  if (!container || !canvas) return;
  var img = container.querySelector(".relight-fallback-img");

  // ---- material presets -------------------------------------------------
  // bulge[min,max] dome strength · glintExp/Gain specular · rim tint+gain ·
  // tint overlay+amt · sat saturation · irid iridescent rim (0/1)
  var MATERIALS = {
    glass:   { bulge:[0.90,0.98], glintExp:200, glintGain:2.4, rim:[0.85,0.90,1.00], rimGain:0.55, tint:[1,1,1],          tintAmt:0.00, sat:1.00, irid:0 },
    gold:    { bulge:[0.90,0.98], glintExp:170, glintGain:2.6, rim:[1.00,0.82,0.42], rimGain:0.70, tint:[1.0,0.90,0.72],  tintAmt:0.16, sat:1.05, irid:0 },
    chrome:  { bulge:[0.90,0.98], glintExp:320, glintGain:3.2, rim:[0.95,0.97,1.00], rimGain:0.95, tint:[1,1,1],          tintAmt:0.00, sat:0.95, irid:0 },
    frosted: { bulge:[0.93,0.99], glintExp:38,  glintGain:1.2, rim:[0.90,0.93,1.00], rimGain:0.42, tint:[1,1,1],          tintAmt:0.00, sat:0.70, irid:0 },
    crystal: { bulge:[0.80,0.99], glintExp:420, glintGain:3.4, rim:[0.90,0.95,1.00], rimGain:0.80, tint:[1,1,1],          tintAmt:0.00, sat:1.12, irid:1 },
    water:   { bulge:[0.70,1.00], glintExp:600, glintGain:3.8, rim:[0.90,0.95,1.00], rimGain:0.50, tint:[1,1,1],          tintAmt:0.00, sat:1.00, irid:0 },
    holo:    { bulge:[0.90,0.98], glintExp:220, glintGain:2.4, rim:[1,1,1],          rimGain:0.75, tint:[1,1,1],          tintAmt:0.00, sat:1.05, irid:1 },
    amber:   { bulge:[0.88,0.98], glintExp:180, glintGain:2.6, rim:[1.00,0.70,0.30], rimGain:0.60, tint:[1.0,0.66,0.28],  tintAmt:0.34, sat:1.00, irid:0 },
    // reflects the cover photo's sunset: orange sky up top, lavender haze below
    sunset:  { bulge:[0.88,0.98], glintExp:200, glintGain:2.6, rim:[1.00,0.70,0.38], rimGain:0.70, tint:[1.0,0.84,0.66],  tintAmt:0.14, sat:1.04, irid:0,
               env:{ top:[1.20,0.74,0.38], bot:[0.44,0.42,0.58] }, glint:[1.00,0.88,0.72] }
  };
  var ORDER = ["sunset","glass","frosted","chrome","gold","crystal","water","holo","amber"];

  var flag = container.getAttribute("data-material") || "glass";
  var demo = flag === "demo";
  var cur = MATERIALS[flag] || MATERIALS.glass;

  var gl = null;
  try {
    gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: true, alpha: true })
      || canvas.getContext("experimental-webgl", { premultipliedAlpha: false, alpha: true });
  } catch (e) { gl = null; }
  if (!gl) return; // plain <img> remains as fallback

  var VERT =
    "attribute vec2 aPos; varying vec2 vUv;" +
    "void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }";

  var FRAG = [
    "#extension GL_OES_standard_derivatives : enable",
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform sampler2D uTex; uniform float uAspect;",
    "uniform vec2 uLight; uniform float uLightZ;",
    "uniform vec3 uEnvTop; uniform vec3 uEnvBot;",
    "uniform vec2 uBulge; uniform float uGlintExp; uniform float uGlintGain;",
    "uniform vec3 uRim; uniform float uRimGain; uniform vec3 uTint; uniform float uTintAmt;",
    "uniform float uSat; uniform float uIrid; uniform vec3 uGlint;",
    "vec3 env(vec3 d){ return mix(uEnvBot, uEnvTop, clamp(d.y*0.5+0.5,0.0,1.0)); }",
    "void main(){",
    "  vec2 p = vUv*2.0 - 1.0;",
    "  float r2 = dot(p,p);",
    "  if(r2 > 1.0){ discard; }",
    "  float z = sqrt(max(0.0,1.0-r2));",
    "  vec3 N = vec3(p, z);",
    "  vec2 q = p * 0.5;",
    "  if(uAspect > 1.0) q.x /= uAspect; else q.y *= uAspect;",
    "  q *= mix(uBulge.x, uBulge.y, z);",
    "  vec3 albedo = texture2D(uTex, vec2(0.5,0.5) + q).rgb;",
    "  float luma = dot(albedo, vec3(0.299,0.587,0.114));",
    "  albedo = mix(vec3(luma), albedo, uSat);",
    "  albedo = mix(albedo, albedo*uTint, uTintAmt);",
    "  vec3 V = vec3(0.0,0.0,1.0);",
    "  vec3 L = normalize(vec3(uLight, uLightZ));",
    "  vec3 H = normalize(L+V);",
    "  float NdotL = max(dot(N,L),0.0);",
    "  float NdotV = max(dot(N,V),0.0);",
    "  float NdotH = max(dot(N,H),0.0);",
    "  float VdotH = max(dot(V,H),0.0);",
    "  vec3 col = albedo * (0.88 + 0.12*NdotL);",
    "  col *= mix(1.0, 0.80, smoothstep(0.80, 1.0, sqrt(r2)));",
    "  float fres = 0.05 + 0.95*pow(1.0-VdotH, 5.0);",
    "  float glintMask = 1.0 - 0.82*smoothstep(0.55, 0.92, luma);",   // fade on bright/white areas
    "  col += uGlint * fres * pow(NdotH, uGlintExp) * uGlintGain * glintMask;",
    "  float edge = pow(1.0-NdotV, 3.0);",
    "  vec3 rimc = uRim;",
    "  if(uIrid > 0.5){ rimc = 0.55 + 0.45*cos(6.28318*(vec3(0.0,0.33,0.67) + (1.0-NdotV)*1.25)); }",
    "  col += mix(env(reflect(-V,N)), rimc, 0.6) * edge * uRimGain;",
    "  col += env(N) * 0.06;",
    "  float aa = smoothstep(1.0, 1.0-fwidth(r2)*1.6, r2);",
    "  gl_FragColor = vec4(clamp(col,0.0,1.0), aa);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return s;
  }
  var prog = gl.createProgram();
  gl.getExtension("OES_standard_derivatives");
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ["uTex","uAspect","uLight","uLightZ","uEnvTop","uEnvBot","uBulge","uGlintExp",
   "uGlintGain","uRim","uRimGain","uTint","uTintAmt","uSat","uIrid","uGlint"]
    .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // ---- texture from the profile <img> ----------------------------------
  // Pre-downsample the full-res photo at high quality (area averaging) to the
  // display size, so the GPU never has to minify a huge image (which softens
  // and aliases). Rebuilt if the orb's pixel size changes materially.
  var tex = gl.createTexture();
  var work = document.createElement("canvas");
  var wctx = work.getContext("2d");
  var texReady = false, imgLoaded = false, lastTexSize = 0, aspect = 1.0;
  function buildTexture(size) {
    size = Math.max(64, Math.min(1024, Math.round(size)));
    work.width = size; work.height = size;
    wctx.clearRect(0, 0, size, size);
    wctx.imageSmoothingEnabled = true;
    wctx.imageSmoothingQuality = "high";
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var s = Math.max(size / iw, size / ih);       // cover-fit, centre crop
    wctx.drawImage(img, (size - iw * s) / 2, (size - ih * s) / 2, iw * s, ih * s);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, work);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    aspect = 1.0;                                  // cover already applied above
    lastTexSize = size;
    texReady = true;
    container.classList.add("relight-ready");
  }
  if (img.complete && img.naturalWidth) imgLoaded = true;
  else img.addEventListener("load", function () { imgLoaded = true; });

  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function envColors() {
    if (cur.env) return cur.env;                  // material overrides the environment
    return isDark()
      ? { top: [0.55, 0.60, 0.72], bot: [0.03, 0.03, 0.05] }
      : { top: [1.05, 1.08, 1.18], bot: [0.20, 0.22, 0.28] };
  }

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    var rect = container.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    var target = Math.min(1024, Math.max(64, Math.min(w, h)));
    if (imgLoaded && (!texReady || Math.abs(target - lastTexSize) > lastTexSize * 0.12)) {
      buildTexture(target);
    }
  }

  var lx = 0.4, ly = 0.6, tx = 0.4, ty = 0.6, lastMove = -9999;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.addEventListener("pointermove", function (e) {
    var rect = container.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var radius = rect.width / 2 || 1;
    tx = (e.clientX - cx) / radius;
    ty = -(e.clientY - cy) / radius;
    var m = Math.hypot(tx, ty);
    if (m > 1.7) { tx *= 1.7 / m; ty *= 1.7 / m; }
    lastMove = performance.now();
  }, { passive: true });

  var running = false, rafId = 0;
  function frame(now) {
    if (!running) return;
    resize();
    if (texReady) {
      var idle = (now - lastMove) > 2200;
      if (idle && !reduce) { var a = now * 0.0005; tx = Math.cos(a) * 0.8; ty = Math.sin(a) * 0.8 + 0.15; }
      else if (idle && reduce) { tx = 0.45; ty = 0.6; }
      lx += (tx - lx) * 0.12; ly += (ty - ly) * 0.12;

      var env = envColors();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(U.uTex, 0);
      gl.uniform1f(U.uAspect, aspect);
      gl.uniform2f(U.uLight, lx, ly);
      gl.uniform1f(U.uLightZ, 0.6);
      gl.uniform3f(U.uEnvTop, env.top[0], env.top[1], env.top[2]);
      gl.uniform3f(U.uEnvBot, env.bot[0], env.bot[1], env.bot[2]);
      gl.uniform2f(U.uBulge, cur.bulge[0], cur.bulge[1]);
      gl.uniform1f(U.uGlintExp, cur.glintExp);
      gl.uniform1f(U.uGlintGain, cur.glintGain);
      gl.uniform3f(U.uRim, cur.rim[0], cur.rim[1], cur.rim[2]);
      gl.uniform1f(U.uRimGain, cur.rimGain);
      gl.uniform3f(U.uTint, cur.tint[0], cur.tint[1], cur.tint[2]);
      gl.uniform1f(U.uTintAmt, cur.tintAmt);
      gl.uniform1f(U.uSat, cur.sat);
      gl.uniform1f(U.uIrid, cur.irid);
      var g = cur.glint || [1, 1, 1];
      gl.uniform3f(U.uGlint, g[0], g[1], g[2]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    rafId = requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; rafId = requestAnimationFrame(frame); } }
  function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0.02 }).observe(container);
  } else { start(); }

  // ---- temporary demo switcher (only when relight_medallion: demo) ------
  if (demo) {
    var bar = document.createElement("div");
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Try orb material");
    bar.style.cssText = [
      "position:fixed", "left:50%", "bottom:18px", "transform:translateX(-50%)",
      "z-index:9999", "display:flex", "flex-wrap:wrap", "gap:6px", "max-width:92vw",
      "padding:8px 10px", "border-radius:999px",
      "background:rgba(20,22,28,0.86)", "backdrop-filter:blur(8px)",
      "box-shadow:0 8px 30px rgba(0,0,0,0.35)", "font:600 13px/1 system-ui,sans-serif"
    ].join(";");
    var note = document.createElement("span");
    note.textContent = "material:";
    note.style.cssText = "color:#9aa1ac;align-self:center;padding:0 4px;letter-spacing:.02em";
    bar.appendChild(note);
    ORDER.forEach(function (name) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = name;
      b.style.cssText = [
        "cursor:pointer", "border:0", "border-radius:999px", "padding:7px 12px",
        "color:#e8eaee", "background:rgba(255,255,255,0.08)", "text-transform:capitalize"
      ].join(";");
      b.addEventListener("click", function () {
        cur = MATERIALS[name];
        [].forEach.call(bar.querySelectorAll("button"), function (x) {
          x.style.background = "rgba(255,255,255,0.08)"; x.style.color = "#e8eaee";
        });
        b.style.background = "#e39b2e"; b.style.color = "#1a1305";
        note.textContent = "material: " + name + "  →  set relight_medallion: " + name;
      });
      if (name === "glass") { b.style.background = "#e39b2e"; b.style.color = "#1a1305"; }
      bar.appendChild(b);
    });
    document.body.appendChild(bar);
  }
})();
