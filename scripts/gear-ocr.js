// ── Screenshot import for the Titan Gear calculator ───────────
// OCRs a game screenshot showing one or two gear comparison panels
// and fills the Gear 1 / Gear 2 forms. Only the "Random Attributes"
// section is used when that header is detected; "Base Attributes"
// and "Special Effect" are ignored, matching the manual-entry note
// already on the Titan Gear tab. Comparison maths in gear.js is
// untouched.
//
// Structurally this mirrors scripts/chip-ocr.js (same pipeline:
// crop → OCR labels → OCR values → row-parse → targeted re-read),
// but the Titan Gear comparison screen is laid out differently from
// the HT Chips one — one full-width card with two side-by-side,
// non-overlapping columns, instead of two floating overlapping
// popups — so it gets its own crop calibration. Every Random
// Attribute line here is troop-type scoped (Navy/Army/Air Force);
// there is no "Heavy Trooper" unscoped equivalent and no "All
// units" scope.

(function () {
  'use strict';

  var TESSERACT_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

  var FIELD_NAMES = {
    'def': 'DEF',
    'dmg-increase': 'DMG Increase',
    'dmg-decrease': 'DMG Decrease',
    'atk': 'Attack',
    'hp': 'HP'
  };
  var FIELD_ORDER = ['def', 'dmg-increase', 'dmg-decrease', 'atk', 'hp'];
  // Form field ids don't match the internal field keys 1:1 (gear1-defense,
  // gear1-damage-increase, gear1-damage-decrease, gear1-attack, gear1-hp).
  var FIELD_ID_SUFFIX = {
    'def': 'defense',
    'dmg-increase': 'damage-increase',
    'dmg-decrease': 'damage-decrease',
    'atk': 'attack',
    'hp': 'hp'
  };

  // Words that can be part of a split stat label. The game doesn't wrap
  // these labels across lines the way HT Chip labels do, but OCR can still
  // split a single visual line into two "rows" on its own (confirmed with
  // HT Chips' "Heavy Trooper ATK" / "SPD" — no in-game wrap, just an OCR
  // artifact) — kept as cheap insurance against the same failure mode here.
  var CONTINUATION_RE = /incre|decre|taken|reduc|dmg|damage|attack|atk|def|hp|boost|army|navy|air|force/i;

  // ── Map an OCR'd stat label to a form field ──────────────────
  function classifyStat(text) {
    var t = ' ' + text.toLowerCase().replace(/[^a-z0-9%. ]/g, ' ').replace(/\s+/g, ' ') + ' ';
    if (/decreas|taken|reduc/.test(t)) return 'dmg-decrease';
    // "Increase DEF of Navy" contains "increas" but is a DEF stat.
    if (/ def |defen[cs]e/.test(t)) return 'def';
    if (/increas| dmg /.test(t) && !/ atk |attack/.test(t)) return 'dmg-increase';
    if (/attack| atk /.test(t)) {
      // Mirrors chip-ocr.js's ATK handling: even without an in-game wrap,
      // OCR can still split a label across two detected rows. Deferring
      // costs nothing in the common (single-row) case — with nothing
      // nearby to pull in, this falls straight through to fuzzyClassify(),
      // which already resolves every ATK phrasing back to 'atk'.
      return null;
    }
    if (/ hp |boost/.test(t)) return 'hp';
    return null;
  }

  // ── Map an OCR'd stat label to the troop-type scope it applies to ──
  // Every Titan Gear Random Attribute line is prefixed with a troop type
  // (Navy/Army/Air Force) — unlike HT Chips there is no unscoped or
  // "All units" case, so a failed scope read should never be treated as
  // "applies to everyone" (see filteredPanelFields()).
  function classifyScope(text) {
    var t = ' ' + text.toLowerCase().replace(/[^a-z0-9%. ]/g, ' ').replace(/\s+/g, ' ') + ' ';
    if (/\bnavy\b/.test(t)) return 'navy';
    if (/\barmy\b/.test(t)) return 'army';
    if (/air\s*force|\baf\b/.test(t)) return 'air-force';
    return null;
  }

  // Fuzzy fallback for labels OCR garbled too badly for keywords. The
  // game only has a fixed set of stat labels, so pick the closest by
  // bigram similarity.
  var KNOWN_LABELS = [
    ['navy hp boost', 'hp'],
    ['army hp boost', 'hp'],
    ['air force hp boost', 'hp'],
    ['navy decreased dmg taken', 'dmg-decrease'],
    ['army decreased dmg taken', 'dmg-decrease'],
    ['air force decreased dmg taken', 'dmg-decrease'],
    ['increase def of navy', 'def'],
    ['increase def of army', 'def'],
    ['increase def of air force', 'def'],
    ['navy dmg increase', 'dmg-increase'],
    ['army dmg increase', 'dmg-increase'],
    ['air force dmg increase', 'dmg-increase'],
    ['navy atk', 'atk'],
    ['army atk', 'atk'],
    ['air force atk', 'atk']
  ];

  function bigrams(s) {
    s = s.toLowerCase().replace(/[^a-z]/g, '');
    var out = {};
    for (var i = 0; i < s.length - 1; i++) {
      var b = s.substr(i, 2);
      out[b] = (out[b] || 0) + 1;
    }
    return out;
  }

  function diceSim(a, b) {
    var A = bigrams(a), B = bigrams(b);
    var totalA = 0, totalB = 0, common = 0, k;
    for (k in A) totalA += A[k];
    for (k in B) { totalB += B[k]; if (A[k]) common += Math.min(A[k], B[k]); }
    return (totalA + totalB) ? 2 * common / (totalA + totalB) : 0;
  }

  function fuzzyClassify(text) {
    if (text.replace(/[^a-z]/gi, '').length < 6) return null;
    var best = null, bestScore = 0;
    KNOWN_LABELS.forEach(function (kl) {
      var s = diceSim(text, kl[0]);
      if (s > bestScore) { bestScore = s; best = kl[1]; }
    });
    return bestScore >= 0.45 ? best : null;
  }

  // Gear stats are percentages under 100, almost always with decimals.
  // On the outlined in-game font Tesseract often loses the decimal point
  // ("3.82%" → "382%"), so restore it rather than discard the row.
  function parseValue(text) {
    var t = text.replace(/,/g, '.').replace(/[oO]/g, '0');
    var m = t.match(/(\d{1,3}\.\d{1,2})/);
    var decimal = !!m;
    if (!m) m = t.match(/(\d+)\s*%/);
    if (!m) return null;
    var v = parseFloat(m[1]);
    if (!decimal && v > 100 && /%/.test(t)) {
      v = v / 100;
      decimal = true;
    }
    if (v > 100) return null;
    return { value: v, decimal: decimal };
  }

  function medianHeight(words) {
    var heights = words.map(function (w) { return w.h; }).sort(function (a, b) { return a - b; });
    return heights.length ? heights[Math.floor(heights.length / 2)] : 12;
  }

  // ── Group one panel's OCR words into visual rows ──────────────
  function buildRows(words, medH) {
    var sorted = words.slice().sort(function (a, b) { return a.yc - b.yc; });
    var rows = [];
    sorted.forEach(function (w) {
      var row = rows[rows.length - 1];
      if (row && Math.abs(w.yc - row.yc) <= 0.6 * medH) {
        row.words.push(w);
        row.yc = (row.yc * (row.words.length - 1) + w.yc) / row.words.length;
      } else {
        rows.push({ yc: w.yc, words: [w] });
      }
    });
    rows.forEach(function (r) { r.words.sort(function (a, b) { return a.x0 - b.x0; }); });
    return rows;
  }

  // ── Find panel left edges ─────────────────────────────────────
  // Stat labels are left-aligned inside each panel, so a column
  // where several text words begin marks a panel's left edge.
  function findPanelEdges(words, imgW, medH) {
    var labelWords = words.filter(function (w) {
      return /[a-z]/i.test(w.text) && w.text.indexOf('%') === -1;
    });
    var xs = labelWords.map(function (w) { return w.x0; }).sort(function (a, b) { return a - b; });
    var clusters = [];
    xs.forEach(function (x) {
      var c = clusters[clusters.length - 1];
      if (c && x - c.start <= medH) { c.count++; c.sum += x; }
      else clusters.push({ start: x, sum: x, count: 1 });
    });
    var strong = clusters
      .map(function (c) { return { x: c.sum / c.count, count: c.count }; })
      .filter(function (c) { return c.count >= 3; })
      .sort(function (a, b) { return b.count - a.count; });
    if (!strong.length) {
      return [Math.min.apply(null, words.map(function (w) { return w.x0; }))];
    }
    var edges = [strong[0]];
    for (var i = 1; i < strong.length; i++) {
      if (Math.abs(strong[i].x - edges[0].x) >= 0.2 * imgW) { edges.push(strong[i]); break; }
    }
    return edges.map(function (c) { return c.x; }).sort(function (a, b) { return a - b; });
  }

  // Sums every usable record regardless of troop-type scope — used
  // internally to judge whether a panel has enough data to be usable
  // at all (see usablePanel()), independent of the Troop Type filter.
  function panelFields(panel) {
    var fields = {};
    panel.records.forEach(function (r) {
      if (r.baseStat || !r.field || r.value === null) return;
      fields[r.field] = (fields[r.field] || 0) + r.value;
    });
    return fields;
  }

  // Sums only the records matching the current Troop Type selection.
  // Unlike HT Chips, every real Titan Gear line is troop-scoped, so a
  // record with no detected scope (a failed OCR read, not a genuine
  // "applies to everyone" line) or a non-matching scope is silently
  // dropped rather than defaulted to "always included."
  function filteredPanelFields(panel, troopType) {
    var fields = {};
    if (!troopType) return fields;
    panel.records.forEach(function (r) {
      if (r.baseStat || !r.field || r.value === null) return;
      if (r.scope !== troopType) return;
      fields[r.field] = (fields[r.field] || 0) + r.value;
    });
    return fields;
  }

  function getTroopType() {
    var sel = document.getElementById('gear-ocr-troop-type');
    return sel ? sel.value : '';
  }

  // ── Parse OCR words into per-panel stat records ───────────────
  // Returns { panels: [{fields, records, x0, x1, medH}], unknownValues }.
  // Records keep their geometry so the targeted number pass can go back
  // to the image and re-read each value.
  function parsePanels(words, imgW, singlePanel) {
    if (!words.length) return { panels: [], unknownValues: 0 };
    var medH = medianHeight(words);
    // A per-side crop contains exactly one panel — skip edge detection
    // so stray text columns can't split the panel from its own values.
    var edges = singlePanel
      ? [Math.min.apply(null, words.map(function (w) { return w.x0; }))]
      : findPanelEdges(words, imgW, medH);

    var unknownValues = 0;
    var panels = edges.map(function (edge, idx) {
      var next = idx + 1 < edges.length ? edges[idx + 1] : Infinity;
      var panelWords = words.filter(function (w) {
        return (idx === 0 || w.x0 >= edge - medH) && w.x0 < next - medH;
      });
      if (!panelWords.length) return null;
      var panelX1 = Math.max.apply(null, panelWords.map(function (w) { return w.x1; }));

      var rows = buildRows(panelWords, medH);

      // Within a row, a %-value claims the label words to its left
      // back to the previous %-value. OCR can emit two overlapping
      // reads of one value ("3.829" + "82%") — keep the decimal one.
      var records = [];
      var assigned = new Set();
      rows.forEach(function (row) {
        var buffer = [];
        var lastRec = null;
        row.words.forEach(function (w) {
          var v = parseValue(w.text);
          if (v !== null) {
            if (lastRec && w.x0 <= lastRec.valX1) {
              assigned.add(w);
              if (v.decimal && !lastRec.decimal) {
                lastRec.value = v.value;
                lastRec.decimal = true;
                lastRec.valX1 = Math.max(lastRec.valX1, w.x1);
                lastRec.x1 = Math.max(lastRec.x1, w.x1);
              }
              return;
            }
            lastRec = {
              value: v.value,
              decimal: v.decimal,
              labelWords: buffer.slice(),
              yc: row.yc,
              x1: w.x1,
              valX0: w.x0,
              valX1: w.x1,
              labelX1: buffer.length ? buffer[buffer.length - 1].x1 : w.x0
            };
            records.push(lastRec);
            buffer.forEach(function (b) { assigned.add(b); });
            assigned.add(w);
            buffer = [];
          } else {
            buffer.push(w);
          }
        });
      });

      // The labels pass and the digits pass can both read the same value
      // a few pixels apart, landing on different rows. Records whose
      // value boxes overlap at nearly the same height are one number on
      // screen — keep the copy that owns a label.
      records = records.filter(function (rec, ri) {
        return !records.some(function (other, oi) {
          if (oi === ri) return false;
          var overlap = Math.min(rec.valX1, other.valX1) - Math.max(rec.valX0, other.valX0);
          if (overlap <= 0 || Math.abs(rec.yc - other.yc) > 1.2 * medH) return false;
          var recHas = rec.labelWords.length > 0;
          var otherHas = other.labelWords.length > 0;
          if (recHas !== otherHas) return !recHas;
          return oi < ri;
        });
      });

      // Rows OCR split apart (see CONTINUATION_RE above), and values
      // that OCR put on their own row: pull in unclaimed words just
      // above/below.
      function unassignedNear(rec, above) {
        var out = [];
        rows.forEach(function (row) {
          var dy = above ? rec.yc - row.yc : row.yc - rec.yc;
          if (dy < 0.4 * medH || dy > 2.4 * medH) return;
          row.words.forEach(function (w) {
            if (assigned.has(w)) return;
            if (w.x0 > rec.x1 + medH) return;
            if (!CONTINUATION_RE.test(w.text)) return;
            out.push(w);
          });
        });
        return out;
      }

      records.forEach(function (rec) {
        var label = rec.labelWords.map(function (w) { return w.text; }).join(' ');
        rec.field = classifyStat(label);
        if (!rec.field) {
          var below = unassignedNear(rec, false);
          below.forEach(function (w) { assigned.add(w); });
          label += ' ' + below.map(function (w) { return w.text; }).join(' ');
          rec.field = classifyStat(label);
        }
        if (!rec.field) {
          var aboveW = unassignedNear(rec, true);
          aboveW.forEach(function (w) { assigned.add(w); });
          label += ' ' + aboveW.map(function (w) { return w.text; }).join(' ');
          rec.field = classifyStat(label);
        }
        if (!rec.field) rec.field = fuzzyClassify(label);
        // The field can resolve from a partial row without ever needing a
        // split-off scope word (see chip-ocr.js's identical fix for
        // "Increase DEF of" / "Army"). Search independently for a scope
        // word whenever one isn't already in the label — critical here
        // since every real Titan Gear line needs its scope to be counted
        // at all (see filteredPanelFields()).
        if (!classifyScope(label)) {
          var scopeBelow = unassignedNear(rec, false);
          scopeBelow.forEach(function (w) { assigned.add(w); });
          label += ' ' + scopeBelow.map(function (w) { return w.text; }).join(' ');
        }
        if (!classifyScope(label)) {
          var scopeAbove = unassignedNear(rec, true);
          scopeAbove.forEach(function (w) { assigned.add(w); });
          label += ' ' + scopeAbove.map(function (w) { return w.text; }).join(' ');
        }
        rec.labelText = label.replace(/\s+/g, ' ').trim();
        rec.scope = classifyScope(label);
      });

      // Keep only stats between this panel's "Random Attributes" header
      // and its "Special Effect" header (if seen), so the Base
      // Attributes block above and the Special Effect block below (whose
      // prose — "...to 1 random targets" — can itself contain the word
      // "random") are both excluded.
      var minY = -Infinity;
      var maxY = Infinity;
      rows.forEach(function (row) {
        row.words.forEach(function (w) {
          if (assigned.has(w)) return;
          if (/random/i.test(w.text) && w.yc > minY) minY = w.yc;
          if (/special/i.test(w.text) && w.yc < maxY) maxY = w.yc;
        });
      });

      // Stat rows whose value OCR missed entirely become records with
      // value:null — the targeted number pass reads them off the image.
      rows.forEach(function (row) {
        var un = row.words.filter(function (w) { return !assigned.has(w) && /[a-z]/i.test(w.text); });
        if (!un.length) return;
        var text = un.map(function (w) { return w.text; }).join(' ');
        var f = classifyStat(text);
        // Fuzzy matching is only safe below a confirmed Random Attributes
        // header; elsewhere it would latch onto screen titles etc.
        if (!f && minY > -Infinity && row.yc > minY) f = fuzzyClassify(text);
        if (!f) return;
        if (records.some(function (r) { return r.field === f && Math.abs(r.yc - row.yc) < 3 * medH; })) return;
        records.push({
          value: null,
          decimal: false,
          field: f,
          scope: classifyScope(text),
          labelWords: un,
          labelText: text,
          yc: row.yc,
          x1: Math.max.apply(null, un.map(function (w) { return w.x1; })),
          valX0: null,
          valX1: null,
          labelX1: Math.max.apply(null, un.map(function (w) { return w.x1; }))
        });
        un.forEach(function (w) { assigned.add(w); });
      });

      records.forEach(function (rec) { rec.baseStat = rec.yc <= minY || rec.yc >= maxY; });
      unknownValues += records.filter(function (r) {
        return !r.baseStat && !r.field && r.value !== null;
      }).length;

      var panel = { records: records, x0: edge, x1: panelX1, medH: medH };
      panel.fields = panelFields(panel);
      var hasUsableRecord = records.some(function (r) { return r.field && !r.baseStat; });
      return hasUsableRecord ? panel : null;
    }).filter(Boolean);

    panels.sort(function (a, b) { return a.x0 - b.x0; });
    return { panels: panels.slice(0, 2), unknownValues: unknownValues };
  }

  // ── Targeted number pass ──────────────────────────────────────
  // Crop each stat row's value area, upscale it, and re-read it as a
  // single line of digits. Anchored to detected rows, so it works at
  // any screenshot size or layout.
  function parseRefined(text) {
    var t = String(text || '').replace(/,/g, '.').replace(/[^0-9.%]/g, '');
    var m = t.match(/(\d{1,3}\.\d{1,2})/);
    if (m) {
      var v = parseFloat(m[1]);
      return v > 0 && v <= 100 ? { value: v, decimal: true } : null;
    }
    m = t.match(/(\d{1,4})/);
    if (!m) return null;
    var raw = m[1];
    // 3-4 digits with no separator: the decimal point was lost (10.29 → 1029).
    var v2 = raw.length >= 3 ? parseInt(raw, 10) / 100 : parseInt(raw, 10);
    return v2 > 0 && v2 <= 100 ? { value: v2, decimal: raw.length >= 3 } : null;
  }

  // ── Geometric number reading ──────────────────────────────────
  // The stat value is a short row of glyphs in a known place: right of
  // the label, dark ink on a pale card. Rather than trusting OCR to spot
  // a 3-pixel decimal point, find every ink blob in that area, locate
  // the dot geometrically (the tiny blob near the baseline), and only
  // ask OCR to name the digit glyphs — redrawn large, clean, and evenly
  // spaced. Falls back to the crop re-OCR if anything looks off.

  function otsuThreshold(gray) {
    var hist = new Array(256).fill(0);
    var i;
    for (i = 0; i < gray.length; i++) hist[gray[i]]++;
    var total = gray.length;
    var sum = 0;
    for (i = 0; i < 256; i++) sum += i * hist[i];
    var sumB = 0, wB = 0, best = 127, bestVar = -1;
    for (i = 0; i < 256; i++) {
      wB += hist[i];
      if (!wB) continue;
      var wF = total - wB;
      if (!wF) break;
      sumB += i * hist[i];
      var mB = sumB / wB, mF = (sum - sumB) / wF;
      var v = wB * wF * (mB - mF) * (mB - mF);
      if (v > bestVar) { bestVar = v; best = i; }
    }
    return best;
  }

  function inkComponents(mask, w, h) {
    var labels = new Int32Array(w * h);
    var comps = [];
    var stack = [];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = y * w + x;
        if (!mask[idx] || labels[idx]) continue;
        var comp = { x0: x, y0: y, x1: x, y1: y, area: 0 };
        var label = comps.length + 1;
        stack.push(idx);
        labels[idx] = label;
        while (stack.length) {
          var cur = stack.pop();
          var cx = cur % w, cy = (cur - cx) / w;
          comp.area++;
          if (cx < comp.x0) comp.x0 = cx;
          if (cx > comp.x1) comp.x1 = cx;
          if (cy < comp.y0) comp.y0 = cy;
          if (cy > comp.y1) comp.y1 = cy;
          var n;
          if (cx > 0 && mask[n = cur - 1] && !labels[n]) { labels[n] = label; stack.push(n); }
          if (cx < w - 1 && mask[n = cur + 1] && !labels[n]) { labels[n] = label; stack.push(n); }
          if (cy > 0 && mask[n = cur - w] && !labels[n]) { labels[n] = label; stack.push(n); }
          if (cy < h - 1 && mask[n = cur + w] && !labels[n]) { labels[n] = label; stack.push(n); }
        }
        comp.w = comp.x1 - comp.x0 + 1;
        comp.h = comp.y1 - comp.y0 + 1;
        comp.xc = (comp.x0 + comp.x1) / 2;
        comp.yc = (comp.y0 + comp.y1) / 2;
        comps.push(comp);
      }
    }
    return comps;
  }

  function extractSymbols(data) {
    var out = [];
    (data.blocks || []).forEach(function (b) {
      (b.paragraphs || []).forEach(function (p) {
        (p.lines || []).forEach(function (l) {
          (l.words || []).forEach(function (wd) {
            (wd.symbols || []).forEach(function (s) {
              if (s.text && s.bbox) out.push({ text: s.text, xc: (s.bbox.x0 + s.bbox.x1) / 2 });
            });
          });
        });
      });
    });
    return out;
  }

  function readValueGeometric(worker, canvas, panel, rec) {
    return Promise.resolve().then(function () {
      var medH = panel.medH;
      var pad = medH;
      var rx0 = rec.valX0 !== null ? rec.valX0 - pad : rec.labelX1 + 0.4 * pad;
      var rx1 = Math.max(rec.valX1 !== null ? rec.valX1 + 1.5 * pad : 0, panel.x1 + 1.2 * pad);
      var ry0 = rec.yc - 1.35 * medH;
      var ry1 = rec.yc + 1.35 * medH;
      rx0 = Math.max(0, Math.floor(rx0));
      ry0 = Math.max(0, Math.floor(ry0));
      rx1 = Math.min(canvas.width, Math.ceil(rx1));
      ry1 = Math.min(canvas.height, Math.ceil(ry1));
      var w = rx1 - rx0, h = ry1 - ry0;
      if (w < 2 * medH || h < medH) return null;

      var img = canvas.getContext('2d').getImageData(rx0, ry0, w, h);
      var gray = new Uint8Array(w * h);
      for (var i = 0; i < w * h; i++) gray[i] = img.data[i * 4];
      var thr = otsuThreshold(gray);
      var mask = new Uint8Array(w * h);
      var inkCount = 0;
      for (i = 0; i < w * h; i++) {
        if (gray[i] < thr) { mask[i] = 1; inkCount++; }
      }
      // Mostly-dark region means we're off the card — not a value area.
      if (!inkCount || inkCount > 0.45 * w * h) return null;

      var centerY = h / 2;
      var comps = inkComponents(mask, w, h).filter(function (c) {
        return c.area >= 3 &&
          c.h <= 2.2 * medH && c.w <= 4 * medH &&
          Math.abs(c.yc - centerY) <= 0.85 * medH;
      });
      var digitSized = comps.filter(function (c) { return c.h > 0.4 * medH; });
      if (!digitSized.length) return null;
      var hs = digitSized.map(function (c) { return c.h; }).sort(function (a, b) { return a - b; });
      var glyphH = hs[Math.floor(hs.length / 2)];

      // The value is the rightmost tight cluster of blobs.
      comps.sort(function (a, b) { return a.x0 - b.x0; });
      var cluster = [comps[comps.length - 1]];
      for (i = comps.length - 2; i >= 0; i--) {
        if (cluster[0].x0 - comps[i].x1 > 0.9 * glyphH) break;
        cluster.unshift(comps[i]);
      }

      var dots = cluster.filter(function (c) {
        return c.h < 0.5 * glyphH && c.w < 0.9 * glyphH && c.yc > centerY;
      });
      if (dots.length > 1) return null; // ambiguous — let the fallback try
      var dot = dots[0] || null;
      var glyphs = cluster.filter(function (c) { return c !== dot && c.h > 0.4 * glyphH; });
      if (!glyphs.length || glyphs.length > 6) return null;
      var dotIndex = dot === null ? -1 : glyphs.filter(function (c) { return c.xc < dot.xc; }).length;
      if (dot && (dotIndex === 0 || dotIndex >= glyphs.length)) return null;

      // Redraw the glyphs big, clean, and evenly spaced, then OCR them.
      // Draw from the grayscale source (not the binary mask) — the
      // anti-aliasing carries shape detail OCR needs to tell 8 from 9.

      var scale = 64 / glyphH;
      var gap = 24, margin = 32;
      var stripH = 128;
      var slots = [];
      var dx = margin;
      glyphs.forEach(function (c) {
        var gw = Math.max(1, Math.round(c.w * scale));
        var gh = Math.max(1, Math.round(c.h * scale));
        slots.push({ x0: dx, x1: dx + gw, text: '' });
        dx += gw + gap;
      });
      var strip = document.createElement('canvas');
      strip.width = dx - gap + margin;
      strip.height = stripH;
      var sctx = strip.getContext('2d');
      sctx.fillStyle = '#fff';
      sctx.fillRect(0, 0, strip.width, strip.height);
      sctx.imageSmoothingEnabled = true;
      glyphs.forEach(function (c, gi) {
        var gw = slots[gi].x1 - slots[gi].x0;
        var gh = Math.max(1, Math.round(c.h * scale));
        sctx.drawImage(canvas, rx0 + c.x0, ry0 + c.y0, c.w, c.h, slots[gi].x0, Math.round((stripH - gh) / 2), gw, gh);
      });

      return worker.recognize(strip).then(function (res) {
        var syms = extractSymbols(res.data);
        if (syms.length) {
          syms.forEach(function (s) {
            var t = s.text.replace(/[^0-9%]/g, '');
            if (!t) return;
            var slot = null, bestDist = Infinity;
            slots.forEach(function (sl) {
              var d = s.xc >= sl.x0 && s.xc <= sl.x1 ? 0 : Math.min(Math.abs(s.xc - sl.x0), Math.abs(s.xc - sl.x1));
              if (d < bestDist) { bestDist = d; slot = sl; }
            });
            if (slot && bestDist < gap) slot.text += t;
          });
        } else {
          // No symbol boxes from this build — only safe if it's 1 char per glyph.
          var flat = String(res.data.text || '').replace(/[^0-9%]/g, '');
          if (flat.length !== slots.length) return null;
          slots.forEach(function (sl, si) { sl.text = flat[si]; });
        }

        var out = '';
        var dotPos = -1;
        for (var si = 0; si < slots.length; si++) {
          if (si === dotIndex) dotPos = out.length;
          out += slots[si].text;
        }
        var pctIdx = out.indexOf('%');
        if (pctIdx !== -1) out = out.slice(0, pctIdx);
        if (!/^\d{1,4}$/.test(out)) return null;
        if (dotPos === 0 || dotPos >= out.length) return null;
        var value = parseFloat(dotPos > 0 ? out.slice(0, dotPos) + '.' + out.slice(dotPos) : out);
        // Without a detected dot, a 3-4 digit read means a missed decimal
        // point — leave that case to the fallback's heuristics.
        if (!(value > 0 && value <= 100)) return null;
        if (dotPos > 0 && out.length - dotPos > 2) return null;
        return { value: value, decimal: dotPos > 0 };
      });
    }).catch(function () { return null; });
  }

  function refinePanelValues(worker, canvas, panel) {
    var recs = panel.records.filter(function (r) { return r.field && !r.baseStat; });
    return recs.reduce(function (chain, rec) {
      return chain.then(function () {
        var first = rec.value !== null && rec.decimal ? rec.value : null;
        return readValueGeometric(worker, canvas, panel, rec).then(function (geo) {
          if (geo && first !== null && geo.value !== first) {
            // The blob read and the line read disagree — let the crop
            // re-OCR break the tie (2-of-3 vote).
            return cropRead(worker, canvas, panel, rec).then(function (re) {
              if (re && re.decimal && re.value === first) {
                rec.read = 'line+crop';
                return;
              }
              rec.value = geo.value;
              rec.decimal = geo.decimal;
              rec.read = 'glyph';
            });
          }
          if (geo) {
            rec.value = geo.value;
            rec.decimal = geo.decimal;
            rec.read = 'glyph';
            return;
          }
          return cropRead(worker, canvas, panel, rec).then(function (re) {
            if (!re) return;
            // The focused read wins unless it is a weaker (integer) read
            // of a value the first pass already saw with its decimals.
            if (rec.value === null || !rec.decimal || re.decimal) {
              rec.value = re.value;
              rec.decimal = re.decimal;
              rec.read = 'crop';
            }
          });
        });
      });
    }, Promise.resolve()).then(function () {
      panel.fields = panelFields(panel);
    });
  }

  // Crop the whole value area, upscale, and re-OCR it as one line.
  // Returns {value, decimal} or null — the caller decides what to keep.
  function cropRead(worker, canvas, panel, rec) {
    return Promise.resolve().then(function () {
      var pad = panel.medH;
      var x0 = rec.valX0 !== null ? rec.valX0 - pad : rec.labelX1 + 0.5 * pad;
      var x1 = (rec.valX1 !== null ? rec.valX1 : panel.x1) + 2 * pad;
      var y0 = rec.yc - 1.25 * panel.medH;
      var y1 = rec.yc + 1.25 * panel.medH;
      x0 = Math.max(0, Math.floor(x0));
      y0 = Math.max(0, Math.floor(y0));
      x1 = Math.min(canvas.width, Math.ceil(x1));
      y1 = Math.min(canvas.height, Math.ceil(y1));
      if (x1 - x0 < 2 * panel.medH || y1 - y0 < panel.medH) return null;
      var scale = Math.max(1.5, Math.min(6, 56 / (y1 - y0)));
      var region = document.createElement('canvas');
      region.width = Math.round((x1 - x0) * scale);
      region.height = Math.round((y1 - y0) * scale);
      var ctx = region.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(canvas, x0, y0, x1 - x0, y1 - y0, 0, 0, region.width, region.height);
      return worker.recognize(region).then(function (res) {
        return parseRefined(res.data.text);
      });
    }).catch(function () { return null; });
  }

  // ── Fill the Titan Gear forms ─────────────────────────────────
  // troopType filters which scoped records get summed in — see
  // filteredPanelFields(). Re-callable on cached panels (see the Troop
  // Type <select> change listener in init()) so switching the dropdown
  // re-fills instantly without re-running OCR.
  function fillForms(panels, troopType) {
    var parts = [];
    panels.forEach(function (panel, i) {
      var prefix = 'gear' + (i + 1) + '-';
      var filled = [];
      var fields = filteredPanelFields(panel, troopType);
      FIELD_ORDER.forEach(function (f) {
        var input = document.getElementById(prefix + FIELD_ID_SUFFIX[f]);
        if (!input) return;
        if (fields[f] !== undefined) {
          var v = Math.round(fields[f] * 100) / 100;
          input.value = v;
          filled.push(FIELD_NAMES[f] + ' ' + v + '%');
        } else {
          input.value = '';
        }
      });
      parts.push('Gear ' + (i + 1) + ': ' + filled.join(', '));
    });
    return parts.join(' · ');
  }

  // ── Tesseract loading / word extraction ───────────────────────
  var tessPromise = null;
  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (!tessPromise) {
      tessPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = TESSERACT_SRC;
        s.onload = function () { resolve(window.Tesseract); };
        s.onerror = function () {
          tessPromise = null;
          reject(new Error('Could not load the OCR library (check your connection).'));
        };
        document.head.appendChild(s);
      });
    }
    return tessPromise;
  }

  function extractWords(data) {
    var raw = [];
    if (data.words && data.words.length) {
      raw = data.words;
    } else {
      (data.blocks || []).forEach(function (b) {
        (b.paragraphs || []).forEach(function (p) {
          (p.lines || []).forEach(function (l) {
            (l.words || []).forEach(function (w) { raw.push(w); });
          });
        });
      });
    }
    return raw
      .filter(function (w) { return w.text && w.text.trim() && w.bbox; })
      .map(function (w) {
        return {
          text: w.text.trim(),
          x0: w.bbox.x0, x1: w.bbox.x1,
          yc: (w.bbox.y0 + w.bbox.y1) / 2,
          h: w.bbox.y1 - w.bbox.y0
        };
      });
  }

  // ── Image → upscaled grayscale canvas (helps OCR on phone shots) ──
  function sourceToCanvas(source) {
    return new Promise(function (resolve, reject) {
      if (source instanceof HTMLCanvasElement) return resolve(source);
      var url = URL.createObjectURL(source);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var scale = Math.min(3, Math.max(1, 1500 / img.width));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        var ctx = canvas.getContext('2d');
        // The game uses small, outlined text on a pale background. A little
        // extra contrast is considerably more reliable than OCRing the raw
        // phone screenshot, without destroying decimal points as a hard
        // black/white threshold can.
        ctx.filter = 'grayscale(1) contrast(1.7)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read that image file.'));
      };
      img.src = url;
    });
  }

  // The Titan Gear comparison screen is one full-width card with two
  // non-overlapping columns (unlike HT Chips' two floating, overlapping
  // popups), so each side just gets its own half-width crop — no
  // overlap-disambiguation needed. Coordinates are a first-pass estimate
  // from a single example screenshot and are the most likely thing here
  // to need adjustment once tested against more real screenshots (the
  // same way HT Chips' crop needed a height correction mid-testing).
  var GEAR_STAT_AREAS = [
    { x: 0.02, y: 0.19, w: 0.46, h: 0.22 }, // left / candidate gear
    { x: 0.52, y: 0.19, w: 0.46, h: 0.22 }  // right / equipped gear
  ];

  // Wider per-side sweeps used when a tight crop finds nothing.
  var SIDE_FALLBACK_AREAS = [
    { x: 0.0, y: 0.10, w: 0.50, h: 0.45 },
    { x: 0.50, y: 0.10, w: 0.50, h: 0.45 }
  ];

  function cropCanvas(canvas, area) {
    var sx = Math.round(canvas.width * area.x);
    var sy = Math.round(canvas.height * area.y);
    var sw = Math.round(canvas.width * area.w);
    var sh = Math.round(canvas.height * area.h);
    var crop = document.createElement('canvas');
    // Enlarge each card again: a narrow screenshot otherwise leaves the
    // decimal digits only a few pixels high after it is cropped.
    crop.width = sw * 2;
    crop.height = sh * 2;
    var ctx = crop.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, crop.width, crop.height);
    // Unlike chip-ocr.js's HT Chips crop, this screen has no faint ghost
    // overlay to strip out — and its Random Attribute values are
    // color-coded by roll quality (purple/gold/blue), so a fixed
    // brightness cutoff aimed at erasing gray ghost text risks clipping
    // thin anti-aliased edges off legitimately-colored digits instead.
    // No erasure step here.
    return crop;
  }

  function valueColumnCanvas(canvas) {
    // The percentage column is consistently on the right side of a stat
    // panel. Removing the outlined labels lets Tesseract concentrate on the
    // tiny decimals it was otherwise skipping.
    var sx = Math.floor(canvas.width * 0.60);
    var values = document.createElement('canvas');
    values.width = canvas.width - sx;
    values.height = canvas.height;
    values.getContext('2d').drawImage(canvas, sx, 0, values.width, values.height, 0, 0, values.width, values.height);
    values.__offsetX = sx;
    return values;
  }

  function createOcrWorkers(Tesseract) {
    function logger(m) {
      if (m.status === 'recognizing text' && m.progress) {
        setStatus('Reading gear stats… ' + Math.round(m.progress * 100) + '%');
      }
    }
    return Promise.all([
      Tesseract.createWorker('eng', 1, { logger: logger }),
      Tesseract.createWorker('eng', 1, { logger: logger })
    ]).then(function (workers) {
      return Promise.all([
        workers[0].setParameters({ tessedit_pageseg_mode: '6' }),
        workers[1].setParameters({
          tessedit_pageseg_mode: '6',
          tessedit_char_whitelist: '0123456789.%'
        })
      ]).then(function () {
        return { labels: workers[0], numbers: workers[1] };
      });
    });
  }

  function setPSM(worker, mode) {
    return worker.setParameters({ tessedit_pageseg_mode: mode });
  }

  function recognize(worker, canvas, statusPrefix) {
    setStatus(statusPrefix + '…');
    return worker.recognize(canvas);
  }

  function terminateWorkers(workers) {
    if (!workers) return Promise.resolve();
    return Promise.all([workers.labels.terminate(), workers.numbers.terminate()]);
  }

  function usablePanel(panel) {
    return panel && Object.keys(panel.fields).length >= 1;
  }

  // ── Status line ───────────────────────────────────────────────
  function setStatus(msg, isError) {
    var el = document.getElementById('gear-ocr-status');
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg || '';
    el.classList.toggle('error', !!isError);
  }

  // ── Optional local macOS Vision helper (localhost only) ───────
  function isLocalHost() {
    return /^(localhost|127\.|0\.0\.0\.0)/.test(window.location.hostname);
  }

  function wordsFromVision(data) {
    return (data.words || []).map(function (word) {
      // Vision reports a bottom-left origin; the parser uses top-down rows.
      return {
        text: word.text,
        x0: word.x * 1000,
        x1: (word.x + word.w) * 1000,
        yc: (1 - word.y - word.h / 2) * 1000,
        h: word.h * 1000
      };
    });
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('Could not encode image.'));
      }, 'image/png');
    });
  }

  function postImageToMac(blob) {
    return fetch('http://127.0.0.1:8765/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: blob
    }).then(function (response) {
      if (!response.ok) throw new Error('Local OCR helper is unavailable.');
      return response.json();
    });
  }

  function recognizeWithMac(source) {
    return sourceToCanvas(source).then(function (canvas) {
      var crops = GEAR_STAT_AREAS.map(function (area) { return cropCanvas(canvas, area); });
      return crops.reduce(function (chain, crop, i) {
        return chain.then(function (panels) {
          setStatus('Reading Gear ' + (i + 1) + ' with macOS text recognition…');
          return canvasToBlob(crop).then(postImageToMac).then(function (data) {
            var words = wordsFromVision(data);
            var parsed = parsePanels(words, 1000, true);
            if (usablePanel(parsed.panels[0])) panels.push(parsed.panels[0]);
            return panels;
          });
        });
      }, Promise.resolve([])).then(function (panels) {
        if (!panels.length) throw new Error('No panels found with local OCR.');
        return { panels: panels, unknownValues: 0 };
      });
    });
  }

  // ── Result handling ───────────────────────────────────────────
  function finishParsed(parsed) {
    window.__gearOcr.lastParse = parsed;
    console.debug('[gear-ocr] path=' + (parsed.path || 'n/a') + ' parsed', JSON.stringify(parsed.panels.map(function (p) {
      return p.records.map(function (r) {
        return { label: r.labelText, value: r.value, field: r.field, scope: r.scope, base: !!r.baseStat, read: r.read || 'line' };
      });
    })));
    if (!parsed.panels.length) {
      setStatus('No stat values found — make sure the gear comparison panel(s) are visible and readable.', true);
      return parsed;
    }
    var troopType = getTroopType();
    var summary = fillForms(parsed.panels, troopType);
    var notes = [];
    if (!troopType) notes.push('select a Troop Type above to fill in values');
    if (parsed.panels.length === 1) notes.push('only one stat panel detected, filled Gear 1');
    var unreadable = [];
    parsed.panels.forEach(function (p, i) {
      p.records.forEach(function (r) {
        if (r.field && !r.baseStat && r.value === null) {
          unreadable.push('Gear ' + (i + 1) + ' ' + (FIELD_NAMES[r.field] || r.field));
        }
      });
    });
    if (unreadable.length) notes.push('could not read a number for: ' + unreadable.join(', '));
    if (parsed.unknownValues) notes.push(parsed.unknownValues + ' value(s) could not be matched to a stat');
    setStatus('Filled — ' + summary + (notes.length ? ' (' + notes.join('; ') + ')' : '') + '. Check the values, then hit Compare.');
    return parsed;
  }

  // ── Browser OCR pipeline ──────────────────────────────────────
  function processCrop(workers, crop, i) {
    var label = 'Gear ' + (i + 1);
    // Debug aid for calibrating GEAR_STAT_AREAS against real screenshots —
    // lets a crop actually be viewed instead of only inferred from its
    // OCR output. See window.__gearOcr.lastCrops.
    window.__gearOcr.lastCrops = window.__gearOcr.lastCrops || [];
    window.__gearOcr.lastCrops[i] = crop.toDataURL();
    return setPSM(workers.numbers, '6').then(function () {
      return recognize(workers.labels, crop, 'Reading ' + label + ' labels');
    }).then(function (labelsRes) {
      var valueCrop = valueColumnCanvas(crop);
      return recognize(workers.numbers, valueCrop, 'Reading ' + label + ' values').then(function (valuesRes) {
        var words = extractWords(labelsRes.data);
        extractWords(valuesRes.data).forEach(function (w) {
          w.x0 += valueCrop.__offsetX;
          w.x1 += valueCrop.__offsetX;
          words.push(w);
        });
        var parsed = parsePanels(words, crop.width, true);
        var panel = parsed.panels[0];
        if (!panel) return null;
        panel.__unknown = parsed.unknownValues;
        return setPSM(workers.numbers, '7').then(function () {
          setStatus('Re-checking ' + label + ' numbers…');
          return refinePanelValues(workers.numbers, crop, panel);
        }).then(function () {
          return usablePanel(panel) ? panel : null;
        });
      });
    });
  }

  function runBrowserOcr(source) {
    return loadTesseract().then(function (Tesseract) {
      return sourceToCanvas(source).then(function (canvas) {
        setStatus('Reading the two gear stat lists…');
        var workers = null;
        return createOcrWorkers(Tesseract).then(function (created) {
          workers = created;
          var sides = [null, null];
          // Jobs on each worker are intentionally queued: Tesseract workers
          // cannot safely recognize two canvases at the same time.
          return [0, 1].reduce(function (chain, i) {
            return chain.then(function () {
              return processCrop(workers, cropCanvas(canvas, GEAR_STAT_AREAS[i]), i).then(function (panel) {
                sides[i] = panel;
                if (panel) panel.__path = 'crop';
              });
            });
          }, Promise.resolve()).then(function () {
            // Any side the tight crop missed gets one wider sweep of
            // that half of the screenshot. Never parse both halves in
            // one pass — that is how gear pieces contaminate each other.
            return [0, 1].reduce(function (chain, i) {
              return chain.then(function () {
                if (sides[i]) return;
                setStatus('Re-scanning the gear ' + (i + 1) + ' side…');
                return processCrop(workers, cropCanvas(canvas, SIDE_FALLBACK_AREAS[i]), i).then(function (panel) {
                  sides[i] = panel;
                  if (panel) panel.__path = 'wide';
                });
              });
            }, Promise.resolve());
          }).then(function () {
            var panels = sides.filter(Boolean);
            return {
              panels: panels,
              unknownValues: panels.reduce(function (s, p) { return s + (p.__unknown || 0); }, 0),
              path: sides.map(function (p) { return p ? p.__path : 'none'; }).join('+')
            };
          });
        }).then(function (parsed) {
          return terminateWorkers(workers).then(function () { return parsed; });
        }, function (err) {
          return terminateWorkers(workers).then(function () { throw err; });
        });
      });
    });
  }

  var busy = false;
  function processImageSource(source) {
    if (busy) return Promise.resolve();
    busy = true;
    setStatus('Reading screenshot…');
    // The Vision helper only exists on the dev machine; deployed visitors
    // (any OS) go straight to the in-browser pipeline.
    var attempt = isLocalHost()
      ? recognizeWithMac(source).then(function (parsed) {
          if (parsed.panels.length) return parsed;
          throw new Error('No panels found with local OCR.');
        })
      : Promise.reject(new Error('helper skipped'));
    return attempt
      .catch(function () { return runBrowserOcr(source); })
      .then(finishParsed)
      .catch(function (err) {
        setStatus(err && err.message ? err.message : 'Something went wrong reading the screenshot.', true);
      })
      .then(function (r) { busy = false; return r; });
  }

  // ── UI wiring ─────────────────────────────────────────────────
  function init() {
    var drop = document.getElementById('gear-ocr-drop');
    var fileInput = document.getElementById('gear-ocr-file');
    if (!drop || !fileInput) return;

    drop.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) {
        processImageSource(fileInput.files[0]);
        fileInput.value = '';
      }
    });

    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('dragover'); });
    });
    drop.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && f.type.indexOf('image/') === 0) processImageSource(f);
    });

    document.addEventListener('paste', function (e) {
      var tab = document.getElementById('titan-gear-calculator');
      if (!tab || !tab.classList.contains('active')) return;
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image/') === 0) {
          processImageSource(items[i].getAsFile());
          e.preventDefault();
          break;
        }
      }
    });

    // Ctrl/Cmd+V has no equivalent on mobile — this button reads the
    // clipboard directly (Async Clipboard API) for phones/tablets where
    // a screenshot is copied but there's no keyboard to paste with.
    var pasteBtn = document.getElementById('gear-ocr-paste-btn');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', function () {
        if (!navigator.clipboard || !navigator.clipboard.read) {
          setStatus('Clipboard paste isn’t supported in this browser — use the drop zone to choose a file instead.', true);
          return;
        }
        navigator.clipboard.read().then(function (clipItems) {
          for (var i = 0; i < clipItems.length; i++) {
            var types = clipItems[i].types;
            for (var j = 0; j < types.length; j++) {
              if (types[j].indexOf('image/') === 0) {
                clipItems[i].getType(types[j]).then(processImageSource);
                return;
              }
            }
          }
          setStatus('No image found on the clipboard — copy a screenshot first, then try again.', true);
        }).catch(function () {
          setStatus('Couldn’t read the clipboard — your browser may need permission granted for this page.', true);
        });
      });
    }

    // Re-filter the last OCR result when Troop Type changes — no re-OCR.
    var troopTypeSelect = document.getElementById('gear-ocr-troop-type');
    if (troopTypeSelect) {
      troopTypeSelect.addEventListener('change', function () {
        var parsed = window.__gearOcr.lastParse;
        if (!parsed || !parsed.panels || !parsed.panels.length) return;
        fillForms(parsed.panels, troopTypeSelect.value);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exposed for testing
  window.__gearOcr = {
    classifyStat: classifyStat,
    classifyScope: classifyScope,
    fuzzyClassify: fuzzyClassify,
    parsePanels: parsePanels,
    parseRefined: parseRefined,
    filteredPanelFields: filteredPanelFields,
    runBrowserOcr: runBrowserOcr,
    finishParsed: finishParsed,
    processImageSource: processImageSource
  };
})();
