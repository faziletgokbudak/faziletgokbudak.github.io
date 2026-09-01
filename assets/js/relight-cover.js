/*
 * Cover relight — a soft warm light that follows the cursor across the
 * sunset banner (screen-blended), as if nudging the sun. Pure DOM/CSS, no
 * WebGL. Drifts gently when the pointer rests; honours reduced-motion.
 */
(function () {
  "use strict";

  var banner = document.getElementById("cover-banner");
  var spot = document.getElementById("cover-spot");
  if (!banner || !spot) return;

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tx = 0.5, ty = 0.45, cx = 0.5, cy = 0.45;   // targets & smoothed, in 0..1
  var visible = false, lastMove = -9999, rafId = 0, running = false;

  function within(e) {
    var r = banner.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }

  window.addEventListener("pointermove", function (e) {
    var r = banner.getBoundingClientRect();
    if (within(e)) {
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
      lastMove = performance.now();
      if (!visible) { visible = true; spot.style.opacity = "1"; }
    } else if (visible && !reduce) {
      // keep it alive drifting once the pointer leaves the banner
    } else if (visible) {
      visible = false; spot.style.opacity = "0";
    }
  }, { passive: true });

  function tick(now) {
    if (!running) return;
    var r = banner.getBoundingClientRect();
    var idle = (now - lastMove) > 2000;
    if (idle && !reduce) {
      var a = now * 0.00035;
      tx = 0.5 + Math.cos(a) * 0.32;
      ty = 0.5 + Math.sin(a * 1.3) * 0.22;
      if (!visible) { visible = true; spot.style.opacity = "1"; }
    }
    cx += (tx - cx) * 0.09;
    cy += (ty - cy) * 0.09;
    spot.style.transform = "translate(" + (cx * r.width) + "px," + (cy * r.height) + "px)";
    rafId = requestAnimationFrame(tick);
  }
  function start() { if (!running) { running = true; rafId = requestAnimationFrame(tick); } }
  function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0.01 }).observe(banner);
  } else { start(); }
})();
