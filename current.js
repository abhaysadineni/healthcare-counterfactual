/* The current: a canvas of luminous filaments. Each filament is a molecule that Medicare paid for, drawn from
   the 2020 to 2024 spending record into the present, then onward to the year it is expected to lose exclusivity,
   where it frays. Device makers run above as thinner streaks from their filed quarterly revenue. Nothing here is
   simulated: the only geometry is the record and the dated expectations listed on the method page. */
(function (global) {
  "use strict";
  var AREA_HUES = { "Oncology": 350, "Immunology": 280, "Cardiometabolic": 28, "Cardiovascular": 8, "Infectious disease": 190, "Neuroscience": 250, "Respiratory": 165,
    "Blood and rare disease": 320, "Wound care and skin substitutes": 45, "Musculoskeletal": 60, "Urology and renal": 205, "Endocrine": 90, "Gastroenterology": 120, "Ophthalmology": 215, "Kidney and liver": 140, "Women's and men's health": 330, "Other": 250, "Devices": 185 };
  var T0 = 2017, T1 = 2037, NOW = 2026.55, YEARS = [2020, 2021, 2022, 2023, 2024];
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var inst = null;

  function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hsla(h, s, l, a) { return "hsla(" + h + "," + s + "%," + l + "%," + a + ")"; }
  function fmt(x) { if (x === null || x === undefined || isNaN(x)) return "n/a"; var a = Math.abs(x); if (a >= 1e3) return "$" + (a / 1e3).toFixed(a >= 1e4 ? 0 : 1) + "bn"; return "$" + a.toFixed(0) + "m"; }
  function esc(s) { return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function start(box, data, opts) {
    stop();
    opts = opts || {};
    var cv = box.querySelector("canvas"), tip = box.querySelector(".tip"), ctx = cv.getContext("2d");
    var dpr = Math.min(2, devicePixelRatio || 1), W, H, small, fil = [], dev = [], stars = null, hover = null, filter = null, raf = null, t0 = performance.now(), last = 0, parts = [];
    var mols = data.molecules.slice(0, 200);

    function xOf(t) { var pl = W < 860 ? 12 : Math.round(W * 0.36), pr = small ? 70 : 110; return pl + (t - T0) / (T1 - T0) * (W - pl - pr); }
    function build() {
      var N = small ? 70 : 140, list = mols.slice(0, N);
      var areas = {}; list.forEach(function (m) { areas[m.area] = (areas[m.area] || 0) + m.sp[4]; });
      var order = Object.keys(areas).sort(function (a, b) { return areas[b] - areas[a]; });
      var top = H * (small ? 0.2 : 0.16), bot = H * 0.9, span = bot - top, bands = {}, tot = 0;
      order.forEach(function (a) { var n = list.filter(function (m) { return m.area === a; }).length; bands[a] = { n: n, w: Math.sqrt(n) + 0.6 }; tot += bands[a].w; });
      var y = top; order.forEach(function (a) { var h = bands[a].w / tot * span; bands[a].y0 = y; bands[a].h = h; y += h; });
      var maxSp = Math.max.apply(null, list.map(function (m) { return m.sp[4]; })), kW = (small ? 9 : 16) / Math.sqrt(maxSp);
      var idx = 0, counters = {}; fil = [];
      // vertical order at the core follows the band order, so the braid never crosses itself
      var coreSpread = H * (small ? 0.26 : 0.22), coreTop = H * 0.53 - coreSpread / 2;
      order.forEach(function (a) { list.filter(function (m) { return m.area === a; }).forEach(function (m) {
        var k = counters[a] = (counters[a] || 0); counters[a]++;
        var b = bands[a], yFar = b.y0 + (k + 0.5) / b.n * b.h, yCore = coreTop + (idx + 0.5) / list.length * coreSpread;
        var loe = m.loe ? m.loe.year : null, tEnd = loe ? Math.min(T1, loe + 2.2) : T1, yOut = yFar + (yFar - H * 0.53) * 0.15;
        var hue = AREA_HUES[m.area] || 0, pts = [];
        var steps = small ? 40 : 64;
        for (var i = 0; i <= steps; i++) {
          var t = T0 + (tEnd - T0) * i / steps, yy, w, sp;
          if (t <= NOW) { var s = smooth((t - 2019) / (NOW - 2019)); yy = lerp(yFar, yCore, s); }
          else { var s2 = smooth((t - NOW) / Math.max(0.5, (loe ? loe : T1) - NOW)); yy = lerp(yCore, yOut, s2); }
          if (t < 2020) sp = m.sp[0] * Math.max(0, (t - 2018) / 2); else if (t <= 2024) { var f = Math.min(3.999, t - 2020), a0 = Math.floor(f); sp = lerp(m.sp[a0], m.sp[a0 + 1], f - a0); } else sp = m.sp[4];
          w = kW * Math.sqrt(Math.max(0, sp)) + 0.5;
          if (loe && t > loe) w *= Math.max(0, 1 - (t - loe) / 2.2);
          if (t < 2018.6) w *= Math.max(0, (t - T0) / 1.6);
          pts.push({ t: t, x: xOf(t), y: yy, w: w });
        }
        fil.push({ m: m, pts: pts, hue: hue, loe: loe, tEnd: tEnd, on: true, np: Math.max(2, Math.round((small ? 6 : 12) * Math.sqrt(m.sp[4] / maxSp))), id: idx });
        idx++;
      }); });
      // device makers, drawn above from their filed quarterly revenue
      dev = [];
      var devs = (data.groups && data.groups["Devices"]) || [], maxR = 1;
      devs.forEach(function (d) { d.rev.forEach(function (r) { maxR = Math.max(maxR, r[2]); }); });
      devs.slice(0, small ? 6 : 12).forEach(function (d, i) {
        var pts = [], base = H * (small ? 0.06 : 0.045) + i * (small ? 6 : 11);
        d.rev.forEach(function (r, j) { var q = /^(\d{4})Q(\d)$/.exec(r[0]); if (!q) return; var t = (+q[1]) + ((+q[2]) - 0.5) / 4; if (t < T0) return; pts.push({ t: t, x: xOf(t), y: base + Math.sin(t * 1.7 + i) * 3, w: 0.6 + (small ? 2.5 : 4.5) * Math.sqrt(r[2] / maxR) }); });
        if (pts.length < 4) return;
        var lastP = pts[pts.length - 1]; pts.push({ t: T1, x: xOf(T1), y: base + 4, w: lastP.w * 0.35, future: true });
        dev.push({ d: d, pts: pts, hue: AREA_HUES.Devices, on: true });
      });
      parts = [];
      fil.forEach(function (f) { for (var i = 0; i < f.np; i++) parts.push({ f: f, u: Math.random(), v: 0.0009 + Math.random() * 0.0016, o: (Math.random() - 0.5) * 1.2, dx: 0, dy: 0, life: 1 }); });
      buildStars();
    }
    function buildStars() {
      stars = document.createElement("canvas"); stars.width = W * dpr; stars.height = H * dpr; var g = stars.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#07060F"); bg.addColorStop(1, "#04030A"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      var neb = [[xOf(NOW), H * 0.53, H * 0.9, 262, 0.22], [xOf(2021), H * 0.35, H * 0.7, 300, 0.12], [xOf(2032), H * 0.7, H * 0.7, 215, 0.1], [xOf(NOW) - H * 0.25, H * 0.6, H * 0.45, 24, 0.09]];
      neb.forEach(function (n) { var rg = g.createRadialGradient(n[0], n[1], 0, n[0], n[1], n[2]); rg.addColorStop(0, hsla(n[3], 70, 50, n[4])); rg.addColorStop(1, hsla(n[3], 70, 40, 0)); g.fillStyle = rg; g.fillRect(0, 0, W, H); });
      var k = Math.round(W * H / 2600); for (var i = 0; i < k; i++) { var r = Math.random(); g.fillStyle = "rgba(255,255,255," + (0.15 + Math.random() * 0.6) + ")"; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, r < 0.9 ? 0.6 : 1.3, 0, 6.29); g.fill(); }
    }
    function size() { W = box.clientWidth; H = box.clientHeight; small = W < 720; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); build(); if (REDUCED) draw(1e9); }

    function path(pts, wScale, alpha, sat, lit, whiten, dashed) {
      // draw a variable-width polyline as short segments; whiten near the present
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], w = (a.w + b.w) / 2 * wScale; if (w < 0.15) continue;
        var near = Math.max(0, 1 - Math.abs(((a.t + b.t) / 2) - NOW) / 3.2), wh = whiten * near * near;
        ctx.strokeStyle = hsla(this.hue, sat * (1 - wh * 0.8), Math.min(96, lit + wh * (96 - lit)), alpha * (b.future ? 0.35 : 1)); ctx.lineWidth = w; ctx.setLineDash(dashed ? [3, 6] : []);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    function label(txt, x, y, col) { ctx.lineWidth = 3; ctx.strokeStyle = "rgba(4,3,10,.75)"; ctx.lineJoin = "round"; ctx.strokeText(txt, x, y); ctx.fillStyle = col; ctx.fillText(txt, x, y); }
    function pointAt(f, u) { var pts = f.pts, k = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(k)), t = k - i; var a = pts[i], b = pts[i + 1]; return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), t: lerp(a.t, b.t, t) }; }

    function draw(ts) {
      if (!REDUCED && ts - last < 16) { raf = requestAnimationFrame(draw); return; } last = ts; var time = (ts - t0) / 1000;
      ctx.globalCompositeOperation = "source-over"; ctx.drawImage(stars, 0, 0, W, H);
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
      var anyOn = fil.some(function (f) { return f.on; });
      // device streaks
      dev.forEach(function (d) { var dim = hover && hover !== d ? 0.35 : 1; path.call(d, d.pts, 2.6, 0.05 * dim, 80, 60, 0.4); path.call(d, d.pts, 1, 0.45 * dim, 70, 72, 0.6); });
      // filaments, glow then core then thread
      fil.forEach(function (f) { var dim = (hover && hover !== f ? 0.3 : 1) * (f.on ? 1 : 0.06); path.call(f, f.pts, 2.8, 0.045 * dim, 85, 52, 0.5); });
      fil.forEach(function (f) { var dim = (hover && hover !== f ? 0.3 : 1) * (f.on ? 1 : 0.06); path.call(f, f.pts, 1.05, 0.34 * dim, 85, 60, 0.75); path.call(f, f.pts, 0.28, 0.85 * dim, 60, 80, 0.9); });
      // particles ride the filaments; past the loss of exclusivity they scatter
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], f = p.f; if (!f.on && !(hover === f)) continue;
        if (!REDUCED) p.u += p.v * (hover === f ? 2.2 : 1);
        var q = pointAt(f, Math.min(1, p.u)), fray = f.loe && q.t > f.loe;
        if (fray) { p.dx += (Math.random() - 0.5) * 0.5; p.dy += (Math.random() - 0.5) * 0.5 - 0.1; p.life -= 0.02; } else { p.dx *= 0.9; p.dy *= 0.9; }
        if (p.u >= 1 || p.life <= 0) { p.u = Math.random() * 0.2; p.dx = p.dy = 0; p.life = 1; }
        var near = Math.max(0, 1 - Math.abs(q.t - NOW) / 3), dim = hover && hover !== f ? 0.25 : 1, r = 0.9 + q.w * 0.12 + near * 0.8;
        ctx.fillStyle = hsla(f.hue, 90 - near * 60, 70 + near * 25, (0.55 + near * 0.4) * dim * p.life);
        ctx.beginPath(); ctx.arc(q.x + p.dx * 10, q.y + p.o * q.w + p.dy * 10, r, 0, 6.29); ctx.fill();
      }
      // the present: a bright core with a soft column of light
      var xn = xOf(NOW), cg = ctx.createRadialGradient(xn, H * 0.53, 0, xn, H * 0.53, H * 0.3); cg.addColorStop(0, "rgba(255,240,225," + (0.38 + Math.sin(time * 0.8) * 0.04) + ")"); cg.addColorStop(0.2, "rgba(255,200,140,.14)"); cg.addColorStop(0.55, "rgba(160,120,255,.06)"); cg.addColorStop(1, "rgba(120,80,255,0)");
      ctx.fillStyle = cg; ctx.fillRect(xn - H * 0.3, H * 0.23, H * 0.6, H * 0.6);
      ctx.globalCompositeOperation = "source-over";
      var lg = ctx.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(0.5, "rgba(255,255,255,.35)"); lg.addColorStop(1, "rgba(255,255,255,0)"); ctx.strokeStyle = lg; ctx.lineWidth = 1; ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.moveTo(xn, 0); ctx.lineTo(xn, H); ctx.stroke(); ctx.setLineDash([]);
      // axis
      ctx.font = "500 10.5px Manrope, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(241,238,255,.55)";
      for (var y = 2018; y <= 2036; y += small ? 4 : 2) if (Math.abs(y - NOW) > 1.2) ctx.fillText(String(y), xOf(y), H - 8);
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "600 10.5px Manrope, sans-serif"; ctx.fillText("now", xn, H - 8);
      ctx.fillStyle = "rgba(241,238,255,.4)"; ctx.font = "500 10px Manrope, sans-serif"; ctx.textAlign = "left"; ctx.fillText("record 2020 to 2024", xOf(2020), H - 22); ctx.fillText("expected exclusivity loss", xOf(NOW) + 8, H - 22); ctx.textAlign = "right";
      // labels for the largest filaments and the frayed ends
            ctx.font = "600 10.5px Manrope, sans-serif";
      var placedL = []; ctx.textAlign = "right";
      (hover && hover.m ? [hover] : []).forEach(function (f) { var p0 = f.pts[Math.round(f.pts.length * (2019.2 - T0) / (f.tEnd - T0))] || f.pts[5]; if (placedL.some(function (q) { return Math.abs(q - p0.y) < 12; })) return; placedL.push(p0.y); label(f.m.brand.replace(/\*/g, ""), xOf(T0) - 4, p0.y + 3, hsla(f.hue, 60, 88, hover && hover !== f ? 0.35 : 0.9)); });
      ctx.textAlign = "left";
      var placed = [];
      fil.forEach(function (f) { if (!f.on || !f.loe || f.loe <= NOW - 0.4) return; var pe = f.pts.filter(function (p) { return p.t <= f.loe; }).pop(); if (!pe || f.m.sp[4] < (small ? 4000 : 1500)) return; if (placed.some(function (q) { return Math.abs(q[0] - pe.x) < 70 && Math.abs(q[1] - pe.y) < 13; })) return; placed.push([pe.x, pe.y]); ctx.font = "500 10px Manrope, sans-serif"; label(f.m.brand.replace(/\*/g, "") + " " + f.loe, pe.x + 6, pe.y + 3, hsla(f.hue, 50, 90, hover && hover !== f ? 0.3 : 0.85)); });
      dev.slice(0, small ? 2 : 4).forEach(function (d) { var p = d.pts[d.pts.length - 2]; ctx.font = "500 10px Manrope, sans-serif"; label(d.d.ticker, p.x + 6, p.y + 3, hsla(185, 60, 88, 0.75)); });
      if (!REDUCED) raf = requestAnimationFrame(draw);
    }
    function hit(ev) {
      var r = cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, best = null, bd = 14 * 14;
      fil.concat(dev).forEach(function (f) { if (f.on === false) return; var pts = f.pts; for (var i = 0; i < pts.length; i++) { var dx = pts[i].x - x, dy = pts[i].y - y, d = dx * dx + dy * dy - pts[i].w * pts[i].w; if (d < bd) { bd = d; best = f; } } });
      return best;
    }
    function showTip(ev) {
      if (!hover) { tip.hidden = true; return; }
      var html;
      if (hover.m) { var m = hover.m, mk = m.makers && m.makers[0]; html = '<span class="tag">' + esc(m.area) + '</span><span class="tag">' + esc(m.mod) + "</span><b>" + esc(m.brand.replace(/\*/g, "")) + "</b><div class=\"kv\"><span>" + esc(m.gen || "") + "</span></div><div class=\"kv\" style=\"margin-top:.4rem\"><span>Medicare 2024 " + fmt(m.sp[4]) + "</span><span>2020 " + fmt(m.sp[0]) + "</span>" + (mk ? "<span>" + esc(mk.name) + (mk.share < 0.999 ? " " + Math.round(mk.share * 100) + "%" : "") + "</span>" : "") + (m.loe ? "<span>exclusivity loss " + m.loe.year + (m.loe.status.indexOf("unverified") === 0 ? " (unverified)" : "") + "</span>" : "") + (m.negotiation ? "<span>negotiated price from " + m.negotiation.effective.slice(0, 4) + "</span>" : "") + "</div><div class=\"kv\" style=\"margin-top:.4rem;opacity:.7\"><span>click to open</span></div>"; }
      else { var d = hover.d, lastR = d.rev[d.rev.length - 1]; html = '<span class="tag">Devices</span><b>' + esc(d.name) + "</b><div class=\"kv\"><span>" + esc(d.ticker) + "</span><span>revenue " + esc(lastR[0]) + " " + fmt(lastR[2]) + "</span></div>"; }
      tip.innerHTML = html; tip.hidden = false; var r = cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, tw = tip.offsetWidth, th = tip.offsetHeight, lx = x + 16, ly = y - th / 2; if (lx + tw > W - 8) lx = x - 16 - tw; tip.style.left = Math.max(8, lx) + "px"; tip.style.top = Math.max(8, Math.min(H - th - 8, ly)) + "px";
    }
    cv.addEventListener("mousemove", function (ev) { var h = hit(ev); if (h !== hover) { hover = h; cv.style.cursor = h ? "pointer" : ""; if (REDUCED) draw(1e9); } showTip(ev); });
    cv.addEventListener("mouseleave", function () { hover = null; tip.hidden = true; });
    cv.addEventListener("click", function (ev) { var h = hit(ev); if (h && opts.onPick) opts.onPick(h.m ? { molecule: h.m } : { device: h.d }); });
    function setFilter(area) { filter = area; fil.forEach(function (f) { f.on = !area || f.m.area === area; }); if (REDUCED) draw(1e9); }
    size(); addEventListener("resize", size);
    function vis() { if (document.hidden) { cancelAnimationFrame(raf); raf = null; } else if (!raf && !REDUCED) raf = requestAnimationFrame(draw); }
    document.addEventListener("visibilitychange", vis);
    inst = { stop: function () { cancelAnimationFrame(raf); removeEventListener("resize", size); document.removeEventListener("visibilitychange", vis); inst = null; }, setFilter: setFilter, areas: function () { var a = {}; fil.forEach(function (f) { a[f.m.area] = (a[f.m.area] || 0) + 1; }); return a; }, hues: AREA_HUES };
    if (REDUCED) draw(1e9); else raf = requestAnimationFrame(draw);
    return inst;
  }
  function stop() { if (inst) inst.stop(); }
  global.HC_CURRENT = { start: start, stop: stop, hues: AREA_HUES, fmt: fmt };
})(window);
