/* Home-page promo: the app icon («Стежка до вершини») lives through a day and a night, then a lake opens under
   the summit, the reflected peak becomes the letter V and the name Vershyna writes itself out.

   Same approach as SpinBook's tour: `seek(t)` draws the whole frame as a pure function of time, and
   requestAnimationFrame drives it only while the figure is on screen and the tab is visible. A button pauses it.
   With "reduce motion" on, it shows a still frame (the lake) and plays only when the visitor presses Play.
   Without JS the figure keeps its static icon image.

   The scene copies the app icon (vershyna repo, apps/mobile/scripts/iconScene.mjs, 1024² icon space): change both
   together. The wordmark is Unbounded ExtraBold (SIL Open Font License 1.1, the app's display font), converted to
   outlines so no font file is loaded. */
(function () {
  var figure = document.getElementById("promo");
  if (!figure || !window.requestAnimationFrame || !document.createElementNS) return;

  var NS = "http://www.w3.org/2000/svg";
  var W = 1000, H = 1080;              // stage
  var S = 560, IX = (W - S) / 2;        // icon square on the stage
  var IY_SQUARE = (H - S) / 2;          // centred while it is a square...
  var K = S / 1024;                     // icon units -> stage units
  var LOOP = 25.5;                      // seconds
  var POSTER = 16.9;                    // the still frame for "reduce motion"
  var HORIZON = 840, APEX = 1400, FRAME_TALL = 1640;
  var IY_TALL = (H - FRAME_TALL * S / 1024) / 2; // ...and while it grows into the lake
  var IY = IY_SQUARE;

  // ---- colour helpers ------------------------------------------------------------------------------------
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) {
    var x = rgb(a), y = rgb(b);
    return "rgb(" + Math.round(x[0] + (y[0] - x[0]) * t) + "," + Math.round(x[1] + (y[1] - x[1]) * t) + "," + Math.round(x[2] + (y[2] - x[2]) * t) + ")";
  }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ramp(t, a, b) { return clamp((t - a) / (b - a)); }
  function ease(v) { return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Sky keyframes [time, top, bottom]: dawn, day, afternoon (the icon's own sky), dusk, night, next morning.
  var SKY = [
    [0, "#F4C3A6", "#E28A68"],
    [2.4, "#F7DDA8", "#E8B058"],
    [4.6, "#F5D49A", "#D9763E"],
    [6.6, "#E29469", "#A63F2E"],
    [7.7, "#131A31", "#3A2944"],
    [13.2, "#131A31", "#3A2944"],
    [13.8, "#6B5A7E", "#DB8C6C"],
    [14.4, "#F5D49A", "#D9763E"],
  ];
  function skyAt(t) {
    if (t <= SKY[0][0]) return [SKY[0][1], SKY[0][2]];
    for (var i = 1; i < SKY.length; i++) {
      if (t <= SKY[i][0]) {
        var a = SKY[i - 1], b = SKY[i], u = (t - a[0]) / (b[0] - a[0]);
        return [mix(a[1], b[1], u), mix(a[2], b[2], u)];
      }
    }
    var last = SKY[SKY.length - 1];
    return [last[1], last[2]];
  }

  // Land colours by day and by night.
  var LAND = {
    peak: ["#9E2B25", "#4C1F27"], snow: ["#FFFFFF", "#C3C9E4"], trail: ["#F7F1E6", "#8D91AD"],
    pole: ["#2A1F1A", "#120E10"], flag: ["#3C5A3A", "#1E2E28"], hill: ["#3C5A3A", "#1A2A24"],
    fir: ["#1F3320", "#0D1712"], band: ["#2A1F1A", "#151012"], linen: ["#F7F1E6", "#8A8597"], ochre: ["#C9892B", "#6A5126"],
  };

  // ---- SVG building --------------------------------------------------------------------------------------
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function pts(list) { return list.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "); }

  var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", focusable: "false", "aria-label": "Іконка Вершини проживає день і ніч, у гірському озері відбивається вершина, відображення стає літерою V, і з’являється назва Vershyna" });
  var defs = el("defs", {}, svg);
  var skyGrad = el("linearGradient", { id: "vp-sky", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: 0, y2: 1024 }, defs);
  var skyTop = el("stop", { offset: 0 }, skyGrad), skyBottom = el("stop", { offset: 1 }, skyGrad);
  var waterGrad = el("linearGradient", { id: "vp-water", gradientUnits: "userSpaceOnUse", x1: 0, y1: HORIZON, x2: 0, y2: FRAME_TALL }, defs);
  el("stop", { offset: 0, "stop-color": "#86A7A2" }, waterGrad);
  el("stop", { offset: 1, "stop-color": "#2E5156" }, waterGrad);
  var clip = el("clipPath", { id: "vp-frame" }, defs);
  var clipRect = el("rect", { x: 0, y: 0, width: 1024, height: 1024, rx: 200 }, clip);
  var moonMask = el("mask", { id: "vp-moon", maskUnits: "userSpaceOnUse", x: -200, y: -200, width: 1424, height: 1424 }, defs);
  el("rect", { x: -200, y: -200, width: 1424, height: 1424, fill: "#fff" }, moonMask);
  var moonBite = el("circle", { r: 84, fill: "#000" }, moonMask);
  var blur = el("filter", { id: "vp-shadow", x: "-20%", y: "-20%", width: "140%", height: "140%" }, defs);
  el("feGaussianBlur", { stdDeviation: 26 }, blur);

  // The icon, in icon units.
  var icon = el("g", {}, svg);
  var shadow = el("rect", { x: 30, y: 46, width: 964, height: 1000, rx: 200, fill: "#2A1F1A", opacity: 0.28, filter: "url(#vp-shadow)" }, icon);
  var scene = el("g", { "clip-path": "url(#vp-frame)" }, icon);
  el("rect", { x: -10, y: -10, width: 1044, height: FRAME_TALL + 20, fill: "url(#vp-sky)" }, scene);

  // Stars: seeded, so every loop looks the same.
  var stars = el("g", { fill: "#F3E3C0" }, scene), starList = [];
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  for (var i = 0; i < 30; i++) {
    var sx = 40 + rnd() * 944, sy = 40 + rnd() * 560, r = 4 + rnd() * 6;
    var star = el("path", { d: "M" + sx + " " + (sy - 3 * r) + "v" + 6 * r + "M" + (sx - 3 * r) + " " + sy + "h" + 6 * r, stroke: "#F3E3C0", "stroke-width": r, "stroke-linecap": "butt" }, stars);
    starList.push([star, rnd() * 6.28, 1.2 + rnd() * 1.6]);
  }
  var sun = el("circle", { r: 100 }, scene);
  var moon = el("circle", { r: 92, fill: "#F3E3C0", mask: "url(#vp-moon)" }, scene);

  var SLOPE = 560 / 512;
  var peak = el("polygon", { points: pts([[512, 280], [2112, 280 + 1600 * SLOPE], [-1088, 280 + 1600 * SLOPE]]) }, scene);
  var snow = el("polygon", { points: "512,280 440,360 480,350 512,385 548,350 586,362" }, scene);
  var trail = el("g", {}, scene);
  (function () {
    var line = [[330, 1000], [610, 820], [420, 690], [560, 560], [470, 470], [512, 395]], carry = 0;
    for (var i = 1; i < line.length; i++) {
      var a = line[i - 1], b = line[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]), d = carry;
      for (; d <= len; d += 41) el("circle", { cx: a[0] + (b[0] - a[0]) * d / len, cy: a[1] + (b[1] - a[1]) * d / len, r: 9 }, trail);
      carry = d - len;
    }
  })();
  var pole = el("rect", { x: 506, y: 160, width: 12, height: 125 }, scene);
  var flag = el("polygon", { points: "518,160 640,197 518,234" }, scene);
  var water = el("rect", { x: -10, y: HORIZON, width: 1044, height: FRAME_TALL - HORIZON + 10, fill: "url(#vp-water)" }, scene);

  var front = el("g", {}, scene); // foothill, firs and the embroidered hem: they give way to the lake
  var hill = el("path", { d: "M-10,882 L0,880 C220,820 380,860 520,900 C700,950 860,850 1024,880 L1034,882 L1034,940 L-10,940 Z" }, front);
  var firs = el("g", {}, front);
  [[110, 880, 150], [200, 870, 110], [900, 880, 160], [985, 885, 110]].forEach(function (f) {
    el("polygon", { points: pts([[f[0], f[1] - f[2]], [f[0] - f[2] * 0.38, f[1]], [f[0] + f[2] * 0.38, f[1]]]) }, firs);
  });
  var band = el("rect", { x: -10, y: 930, width: 1044, height: FRAME_TALL - 920 }, front);
  var hemLinen = el("g", {}, front), hemOchre = el("g", {}, front);
  (function () {
    var rows = ["l.o.", ".l.l", "o.l."], cell = 32, gap = cell * 0.11;
    for (var y = 0; y < 3; y++) for (var x = 0; x < 32; x++) {
      var k = rows[y][x % 4];
      if (k === ".") continue;
      el("rect", { x: x * cell + gap / 2, y: 930 + y * cell + gap / 2, width: cell - gap, height: cell - gap, rx: 3.5 }, k === "l" ? hemLinen : hemOchre);
    }
  })();

  // The reflection, in stage units (it leaves the icon to become the V).
  function stage(p) { return [IX + p[0] * K, IY + p[1] * K]; }
  var reflection = el("g", {}, svg);
  var reflPoly = el("polygon", {}, reflection);
  var reflDetail = el("g", {}, reflection);
  var reflSnow = el("polygon", { fill: "#E4ECEC", opacity: 0.75, points: "512,1400 440,1320 480,1330 512,1295 548,1330 586,1318" }, reflDetail);
  var ripples = el("g", { fill: "#F7F1E6", opacity: 0.32 }, reflDetail), rippleList = [];
  [890, 960, 1030, 1100, 1170, 1240].forEach(function (y, i) {
    var half = 512 * (APEX - y) / (APEX - HORIZON) * 0.8;
    rippleList.push([el("rect", { y: y, height: 7, rx: 3.5, width: half * (0.9 + 0.25 * ((i * 37) % 5) / 5) }, ripples), y, half, i]);
  });

  // ---- the wordmark: V (a polygon that the reflection morphs into) + "ershyna" ---------------------------
  var GLYPHS = {
    e: [742, "M395 -17Q289 -17 206.0 21.0Q123 59 75.0 128.0Q27 197 27 289Q27 379 73.5 447.0Q120 515 200.5 552.5Q281 590 381 590Q486 590 560.0 545.5Q634 501 673.5 418.5Q713 336 713 224H214V355H581L514 310Q510 349 494.0 376.5Q478 404 451.5 418.0Q425 432 389 432Q348 432 319.0 416.0Q290 400 274.5 371.5Q259 343 259 307Q259 256 281.5 221.0Q304 186 350.0 167.5Q396 149 464 149Q526 149 587.0 164.0Q648 179 698 208V66Q637 26 561.5 4.5Q486 -17 395 -17Z"],
    r: [569, "M25 573H259L293 370V0H64V377ZM554 584V389Q522 395 495.5 397.5Q469 400 447 400Q406 400 371.0 384.5Q336 369 314.5 331.5Q293 294 293 228L251 280Q260 342 275.5 397.5Q291 453 318.0 496.5Q345 540 385.5 565.0Q426 590 485 590Q501 590 518.0 588.5Q535 587 554 584Z"],
    s: [767, "M739 191Q739 122 696.5 75.5Q654 29 576.5 6.0Q499 -17 393 -17Q284 -17 202.0 9.0Q120 35 73.0 82.5Q26 130 23 193H256Q262 173 281.0 158.5Q300 144 331.0 137.0Q362 130 405 130Q459 130 487.5 139.5Q516 149 516 168Q516 185 493.5 193.0Q471 201 418 205L321 212Q216 219 154.0 242.0Q92 265 65.0 303.0Q38 341 38 393Q38 459 80.0 503.0Q122 547 197.5 568.5Q273 590 373 590Q472 590 549.0 565.0Q626 540 672.5 495.0Q719 450 727 390H494Q489 408 473.0 421.5Q457 435 430.0 443.0Q403 451 363 451Q312 451 287.0 441.5Q262 432 262 414Q262 398 277.5 390.0Q293 382 336 379L466 370Q569 364 629.0 341.5Q689 319 714.0 281.5Q739 244 739 191Z"],
    h: [793, "M52 770H281V0H52ZM486 590Q569 590 627.5 557.0Q686 524 717.0 463.5Q748 403 748 322V0H519V289Q519 345 489.5 375.0Q460 405 405 405Q367 405 339.0 389.0Q311 373 296.0 344.0Q281 315 281 274L212 310Q225 403 264.5 465.0Q304 527 361.0 558.5Q418 590 486 590Z"],
    y: [797, "M257 -182Q189 -182 137.5 -165.5Q86 -149 36 -113V43Q86 11 129.0 -3.0Q172 -17 223 -17Q265 -17 296.5 1.0Q328 19 349 68L556 573H799L531 -2Q500 -69 455.5 -109.0Q411 -149 360.0 -165.5Q309 -182 257 -182ZM244 65 8 573H260L464 65Z"],
    n: [805, "M25 573H254L293 336V0H64V371ZM497 590Q581 590 639.0 557.0Q697 524 728.5 463.5Q760 403 760 322V0H530V289Q530 345 500.5 375.0Q471 405 417 405Q379 405 351.0 389.0Q323 373 308.0 344.0Q293 315 293 274L224 310Q237 403 276.5 465.0Q316 527 373.0 558.5Q430 590 497 590Z"],
    a: [839, "M563 0 536 204 564 286 536 367 563 573H801L763 287L801 0ZM614 286Q602 195 561.5 126.5Q521 58 457.5 20.5Q394 -17 312 -17Q229 -17 165.0 21.0Q101 59 65.5 127.5Q30 196 30 286Q30 378 65.5 446.5Q101 515 165.0 552.5Q229 590 312 590Q394 590 457.5 553.0Q521 516 562.0 447.5Q603 379 614 286ZM261 286Q261 248 276.5 219.0Q292 190 320.0 173.0Q348 156 384 156Q421 156 455.0 173.0Q489 190 515.0 219.0Q541 248 553 286Q541 324 515.0 353.5Q489 383 455.0 400.0Q421 417 384 417Q348 417 320.0 400.0Q292 383 276.5 353.5Q261 324 261 286Z"],
  };
  var V_ADV = 951, KERN = { Ve: -112, er: -4, rs: -9, hy: -23 };
  var word = "Vershyna", total = V_ADV, x = 0, advances = [];
  for (var c = 1; c < word.length; c++) total += GLYPHS[word[c]][0] + (KERN[word[c - 1] + word[c]] || 0);
  var F = 900 / total, X0 = W / 2 - (total * F) / 2, BASE = 640;
  function glyphToStage(p) { return [X0 + p[0] * F, BASE - p[1] * F]; }

  // The V outline in font units, as 8 points; the reflection is the same 8 points collapsed into a triangle.
  var V_POINTS = [[-1, 750], [248, 750], [478, 218], [478, 218], [708, 750], [952, 750], [608, 0], [343, 0]];
  var REFL_POINTS = [[0, HORIZON], [512, HORIZON], [512, HORIZON], [512, HORIZON], [512, HORIZON], [1024, HORIZON], [512, APEX], [512, APEX]];
  var vTo = V_POINTS.map(glyphToStage);

  var letters = el("g", {}, svg), letterList = [];
  x = V_ADV;
  for (c = 1; c < word.length; c++) {
    x += KERN[word[c - 1] + word[c]] || 0;
    var g = el("g", {}, letters);
    el("path", { d: GLYPHS[word[c]][1], transform: "translate(" + (X0 + x * F).toFixed(1) + " " + BASE + ") scale(" + F.toFixed(4) + " " + (-F).toFixed(4) + ")" }, g);
    letterList.push(g);
    x += GLYPHS[word[c]][0];
  }

  var brand = "#9E2B25";
  function readBrand() {
    var v = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) brand = v;
  }
  readBrand();

  // ---- one frame as a function of time -------------------------------------------------------------------
  function seek(t) {
    var appear = ramp(t, 0, 0.6), vanish = 1 - ramp(t, 24.3, 25.3);
    var night = ramp(t, 6.8, 7.7) * (1 - ramp(t, 13.2, 14.2));
    var lake = ramp(t, 13.9, 14.6);          // water in, foothill and hem out
    var tallness = ease(ramp(t, 14.5, 15.8)); // the frame grows down into the lake
    var grow = ease(ramp(t, 15.2, 16.3));     // the reflection rises from the water line
    var fade = ease(ramp(t, 17.4, 18.4));
    var morph = ease(ramp(t, 17.8, 19.2));

    // Sky, sun and moon on the same arc, rising behind the left foothill and setting on the right.
    var sky = skyAt(t);
    skyTop.setAttribute("stop-color", sky[0]);
    skyBottom.setAttribute("stop-color", sky[1]);
    function arc(u) { var a = Math.PI * (1 - u); return [512 + 620 * Math.cos(a), 950 - 810 * Math.sin(a)]; }
    var su = ramp(t, 0.2, 7.0), sp = arc(su);
    sun.setAttribute("cx", sp[0]); sun.setAttribute("cy", sp[1]);
    sun.setAttribute("fill", su < 0.5 ? mix("#FFE1C0", "#FFF7E2", su * 2) : mix("#FFF7E2", "#FFD39A", su * 2 - 2 + 1));
    sun.setAttribute("opacity", su > 0 && su < 1 ? 1 : 0);
    var mu = ramp(t, 7.4, 13.4), mp = arc(mu);
    moon.setAttribute("cx", mp[0]); moon.setAttribute("cy", mp[1]);
    moonBite.setAttribute("cx", mp[0] + 46); moonBite.setAttribute("cy", mp[1] - 34);
    moon.setAttribute("opacity", mu > 0 && mu < 1 ? 1 : 0);
    stars.setAttribute("opacity", night);
    if (night > 0) starList.forEach(function (s) { s[0].setAttribute("opacity", 0.55 + 0.45 * Math.sin(t * s[2] + s[1])); });

    function land(name) { return mix(LAND[name][0], LAND[name][1], night); }
    peak.setAttribute("fill", land("peak"));
    snow.setAttribute("fill", land("snow"));
    trail.setAttribute("fill", land("trail"));
    pole.setAttribute("fill", land("pole"));
    flag.setAttribute("fill", land("flag"));
    hill.setAttribute("fill", land("hill"));
    firs.setAttribute("fill", land("fir"));
    band.setAttribute("fill", land("band"));
    hemLinen.setAttribute("fill", land("linen"));
    hemOchre.setAttribute("fill", land("ochre"));
    flag.setAttribute("transform", "translate(518 197) skewY(" + (Math.sin(t * 3.1) * 2.5).toFixed(2) + ") translate(-518 -197)");

    // The lake: the foothill and hem give way, the frame grows downwards, the peak's reflection rises from the water line.
    IY = lerp(IY_SQUARE, IY_TALL, tallness);
    var place = "translate(" + IX + " " + IY.toFixed(2) + ") scale(" + K + ")";
    icon.setAttribute("transform", place);
    reflDetail.setAttribute("transform", place);
    var tall = 1024 + (FRAME_TALL - 1024) * tallness;
    clipRect.setAttribute("height", tall);
    shadow.setAttribute("height", tall - 24);
    front.setAttribute("opacity", 1 - lake);
    water.setAttribute("opacity", lake);
    icon.setAttribute("opacity", appear * (1 - fade));

    // The reflection, then the V.
    var horizonY = IY + HORIZON * K;
    var points = REFL_POINTS.map(stage).map(function (p, i) { return [lerp(p[0], vTo[i][0], morph), lerp(p[1], vTo[i][1], morph)]; });
    reflPoly.setAttribute("points", pts(points));
    reflPoly.setAttribute("fill", mix("#7A2C2A", brand, morph));
    reflection.setAttribute("opacity", grow > 0 ? vanish : 0);
    reflection.setAttribute("transform", morph > 0 ? "" : "translate(0 " + horizonY + ") scale(1 " + Math.max(grow, 0.001) + ") translate(0 " + -horizonY + ")");
    reflDetail.setAttribute("opacity", 1 - ramp(morph, 0, 0.35));
    rippleList.forEach(function (r) {
      var drift = Math.sin(t * 1.7 + r[3]) * 18;
      r[0].setAttribute("x", (512 - r[0].getAttribute("width") / 2 + drift).toFixed(1));
    });

    letterList.forEach(function (g, i) {
      var a = ease(ramp(t, 19.0 + i * 0.11, 19.55 + i * 0.11));
      g.setAttribute("opacity", a * vanish);
      g.setAttribute("transform", "translate(0 " + ((1 - a) * 40).toFixed(1) + ")");
    });
    letters.setAttribute("fill", brand);
  }

  // ---- playback ------------------------------------------------------------------------------------------
  var reduced = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var t = 0, last = 0, raf = 0, visible = false, userPaused = reduced.matches;
  var PLAY = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>';
  var PAUSE = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="1.5" width="3.4" height="11" fill="currentColor"/><rect x="8.6" y="1.5" width="3.4" height="11" fill="currentColor"/></svg>';

  function tick(now) {
    if (last) t = (t + Math.min(0.1, (now - last) / 1000)) % LOOP;
    last = now;
    seek(t);
    raf = requestAnimationFrame(tick);
  }
  function sync() {
    var run = visible && !userPaused && !document.hidden;
    if (run && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    button.innerHTML = userPaused ? PLAY : PAUSE;
    var label = userPaused ? button.getAttribute("data-play") : button.getAttribute("data-pause");
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  var stageBox = figure.querySelector(".promo-stage");
  var button = figure.querySelector(".promo-toggle");
  stageBox.textContent = "";
  stageBox.appendChild(svg);
  figure.classList.add("is-live");
  if (userPaused) t = POSTER;
  seek(t);

  button.hidden = false;
  button.addEventListener("click", function () { userPaused = !userPaused; sync(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { visible = entries[entries.length - 1].isIntersecting; sync(); }, { threshold: 0.2 }).observe(figure);
  } else {
    visible = true;
  }
  document.addEventListener("visibilitychange", sync);
  if (reduced.addEventListener) reduced.addEventListener("change", function () { if (reduced.matches) { userPaused = true; sync(); } });
  if (window.matchMedia) {
    var dark = window.matchMedia("(prefers-color-scheme: dark)");
    if (dark.addEventListener) dark.addEventListener("change", function () { readBrand(); seek(t); });
  }
  sync();

  // Test hook: ?promo-t=12.5 freezes the animation at that second (used to check frames).
  var m = /[?&]promo-t=([\d.]+)/.exec(location.search);
  if (m) { userPaused = true; t = parseFloat(m[1]) % LOOP; seek(t); sync(); }
})();
