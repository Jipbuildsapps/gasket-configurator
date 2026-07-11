(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(initAll);

  document.addEventListener('shopify:section:load', function (event) {
    if (!event || !event.target) return;

    var roots = event.target.querySelectorAll
      ? event.target.querySelectorAll('.gcfg')
      : [];

    Array.prototype.slice.call(roots).forEach(initRoot);
  });

  function initAll() {
    Array.prototype.slice.call(document.querySelectorAll('.gcfg')).forEach(initRoot);
  }

  function initRoot(root) {
    if (!root || root.__gcfgInit) return;

    var Nesting = window.GasketConfiguratorNesting;
    var Drawing = window.GasketConfiguratorDrawing;

    if (!Nesting || !Drawing) {
      var retryCount = root.__gcfgRetryCount || 0;

      if (retryCount < 20) {
        root.__gcfgRetryCount = retryCount + 1;

        window.setTimeout(function () {
          initRoot(root);
        }, 50);

        return;
      }

      console.error('Gasket configurator: nesting/drawing assets ontbreken of laden te laat.');
      return;
    }

    root.__gcfgRetryCount = 0;
    root.__gcfgInit = true;

    function $(selector) {
      return root.querySelector(selector);
    }

    function $all(selector) {
      return Array.prototype.slice.call(root.querySelectorAll(selector));
    }

    function bySuffix(suffix) {
      return root.querySelector('[id$="' + suffix + '"]');
    }

    var I18N = {
      choose_shape: 'Kies eerst een vorm. Daarna verschijnen de juiste maatvelden.',
      invalid: 'Vul geldige maten in. De binnenmaat moet kleiner zijn dan de buitenmaat.',
      no_items: 'Voeg minimaal één geldige pakkingregel toe.',
      no_fit: 'Eén of meer pakkingen passen niet op de ingestelde plaat.',
      bolt_partial: 'Om het boutpatroon te tonen, vul PCD + gat Ø + aantal gaten in.',
      bolt_no_fit: 'Boutpatroon past niet binnen de ring.',
      export_invalid: 'Vul eerst een geldige live pakking in. De binnenmaat moet kleiner zijn dan de buitenmaat.',
      export_bolt_partial: 'Voor export van boutgaten: vul PCD + gat Ø + aantal gaten volledig in.',
      export_bolt_no_fit: 'Boutpatroon past niet binnen de ring. Export is gestopt.'
    };

    var els = {
      variant: bySuffix('-variant'),
      variantDebug: bySuffix('-variant-debug'),

      itemsWrap: bySuffix('-items'),
      itemTpl: bySuffix('-item-template'),
      addItemBtn: bySuffix('-add-item'),

      plateW: bySuffix('-plateW'),
      plateH: bySuffix('-plateH'),
      edge: bySuffix('-edge'),
      gap: bySuffix('-gap'),

      platePrice: bySuffix('-platePrice'),
      hourRate: bySuffix('-hourRate'),
      cutSpeed: bySuffix('-cutSpeed'),
      setupMin: bySuffix('-setupMin'),
      kerf: bySuffix('-kerf'),
      pierceSec: bySuffix('-pierceSec'),

      holeMethod: bySuffix('-holeMethod'),
      punchSec: bySuffix('-punchSec'),
      plateLoadMin: bySuffix('-plateLoadMin'),
      plateUnloadMin: bySuffix('-plateUnloadMin'),
      moveSec: bySuffix('-moveSec'),
      finishSec: bySuffix('-finishSec'),

      marginPct: bySuffix('-marginPct'),
      minOrder: bySuffix('-minOrder'),
      remainderMode: bySuffix('-remainderMode'),

      calcBtn: bySuffix('-calc'),
      calcBox: bySuffix('-calcBox'),
      priceResult: bySuffix('-priceResult'),
      nestSvg: bySuffix('-nestSvg'),
      warnBox: bySuffix('-warn'),
      svgWarn: bySuffix('-svgWarn'),

      dxfBtn: bySuffix('-download-dxf'),
      svgBtn: bySuffix('-download-svg'),

      previewSvg: $('.gcfg__svg')
    };

    if (!els.previewSvg || !els.itemsWrap || !els.itemTpl) return;

    if (els.dxfBtn) els.dxfBtn.textContent = 'Download DXF live pakking';
    if (els.svgBtn) els.svgBtn.textContent = 'Download SVG live pakking';

    var drawingEls = {
      ringFill: els.previewSvg.querySelector('.ringFill'),
      ringOD: els.previewSvg.querySelector('.ringOD'),
      ringID: els.previewSvg.querySelector('.ringID'),
      holesG: els.previewSvg.querySelector('.holes'),
      pcdCircle: els.previewSvg.querySelector('.pcdCircle'),
      ringOuterPath: els.previewSvg.querySelector('.ringOuterPath'),
      ringInnerPath: els.previewSvg.querySelector('.ringInnerPath'),

      odExtL: els.previewSvg.querySelector('.od-ext-l'),
      odExtR: els.previewSvg.querySelector('.od-ext-r'),
      odLine: els.previewSvg.querySelector('.od-line'),
      odText: els.previewSvg.querySelector('.od-text'),

      idExtL: els.previewSvg.querySelector('.id-ext-l'),
      idExtR: els.previewSvg.querySelector('.id-ext-r'),
      idLine: els.previewSvg.querySelector('.id-line'),
      idText: els.previewSvg.querySelector('.id-text'),

      holeExtL: els.previewSvg.querySelector('.hole-ext-l'),
      holeExtR: els.previewSvg.querySelector('.hole-ext-r'),
      holeLine: els.previewSvg.querySelector('.hole-line'),
      holeText: els.previewSvg.querySelector('.hole-text'),

      pcdExtL: els.previewSvg.querySelector('.pcd-ext-l'),
      pcdExtR: els.previewSvg.querySelector('.pcd-ext-r'),
      pcdLine: els.previewSvg.querySelector('.pcd-line'),
      pcdText: els.previewSvg.querySelector('.pcd-text'),

      thkGroup: els.previewSvg.querySelector('.thk'),
      thkLeft: els.previewSvg.querySelector('.thk-left'),
      thkRight: els.previewSvg.querySelector('.thk-right'),
      thkTop: els.previewSvg.querySelector('.thk-top'),
      thkBot: els.previewSvg.querySelector('.thk-bot'),
      thkIdTop: els.previewSvg.querySelector('.thk-id-top'),
      thkIdBot: els.previewSvg.querySelector('.thk-id-bot'),
      thkDim: els.previewSvg.querySelector('.thk-dim'),
      thkText: els.previewSvg.querySelector('.thk-text')
    };

    var activeItem = null;
    var renderFrame = null;

    function updateStaticCopy() {
      var replacements = {
        'Pakkingregels': 'Vorm & maten',
        'Voeg één of meerdere pakkingen toe.': 'Kies eerst de vorm; daarna vul je de bijbehorende maten in.',
        'Vul de pakkingregels en kosten in. Klik daarna op prijs berekenen.': 'Kies materiaal, vorm en maten. Klik daarna op prijs berekenen.'
      };

      function walk(node) {
        if (!node) return;

        if (node.nodeType === 3) {
          Object.keys(replacements).forEach(function (from) {
            if (node.nodeValue.indexOf(from) !== -1) {
              node.nodeValue = node.nodeValue.split(from).join(replacements[from]);
            }
          });

          return;
        }

        Array.prototype.slice.call(node.childNodes || []).forEach(walk);
      }

      walk(root);
    }

    function warn(el, msg) {
      if (el) el.textContent = msg || '';
    }

    function extractNumber(value) {
      if (value == null) return null;

      var text = String(value).trim().replace(',', '.');
      var match = text.match(/-?\d+(\.\d+)?/);

      return match ? Number(match[0]) : null;
    }

    function val(el) {
      var n = extractNumber(el && el.value);
      return n == null ? 0 : n;
    }

    function fmt(n, decimals) {
      if (n == null || !isFinite(n)) n = 0;

      return n.toLocaleString('nl-NL', {
        minimumFractionDigits: decimals || 0,
        maximumFractionDigits: decimals || 0
      });
    }

    function money(n) {
      if (n == null || !isFinite(n)) n = 0;

      return '€ ' + n.toLocaleString('nl-NL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    function px(n) {
      return Math.round(n) + 0.5;
    }

    function num(n, decimals) {
      if (n == null || !isFinite(n)) n = 0;

      var d = decimals == null ? 4 : decimals;

      return Number(n).toFixed(d).replace(/\.?0+$/, '');
    }

    function escXml(value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        }[char];
      });
    }

    function safeFilePart(value) {
      return String(value == null ? '' : value)
        .toLowerCase()
        .replace(',', '.')
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    function setA(el, attr, value) {
      if (el) el.setAttribute(attr, String(value));
    }

    function clamp(n, min, max) {
      n = Number(n);
      if (!isFinite(n)) n = 0;

      return Math.min(max, Math.max(min, n));
    }

    function clampRadius(w, h, r, fallback) {
      var max = Math.max(0, Math.min(w || 0, h || 0) / 2);

      if (!(r > 0) && fallback != null) r = fallback;

      return clamp(r || 0, 0, max);
    }

    function circleArea(d) {
      var r = Math.max(0, d || 0) / 2;

      return Math.PI * r * r;
    }

    function circlePerimeter(d) {
      return Math.PI * Math.max(0, d || 0);
    }

    function roundedRectArea(w, h, r) {
      w = Math.max(0, w || 0);
      h = Math.max(0, h || 0);
      r = clampRadius(w, h, r);

      return (w * h) - ((4 - Math.PI) * r * r);
    }

    function roundedRectPerimeter(w, h, r) {
      w = Math.max(0, w || 0);
      h = Math.max(0, h || 0);
      r = clampRadius(w, h, r);

      return 2 * (w + h - 4 * r) + (2 * Math.PI * r);
    }

    function circlePath(cx, cy, r, scale) {
      r = Math.max(0, r || 0) * (scale || 1);

      return (
        'M ' + num(cx + r, 3) + ' ' + num(cy, 3) +
        ' A ' + num(r, 3) + ' ' + num(r, 3) + ' 0 1 0 ' + num(cx - r, 3) + ' ' + num(cy, 3) +
        ' A ' + num(r, 3) + ' ' + num(r, 3) + ' 0 1 0 ' + num(cx + r, 3) + ' ' + num(cy, 3)
      );
    }

    function roundedRectPath(cx, cy, w, h, r, scale) {
      scale = scale || 1;
      w = Math.max(0, w || 0) * scale;
      h = Math.max(0, h || 0) * scale;
      r = clampRadius(w, h, (r || 0) * scale);

      var x = cx - w / 2;
      var y = cy - h / 2;
      var x2 = x + w;
      var y2 = y + h;

      if (r <= 0) {
        return (
          'M ' + num(x, 3) + ' ' + num(y, 3) +
          ' H ' + num(x2, 3) +
          ' V ' + num(y2, 3) +
          ' H ' + num(x, 3) +
          ' Z'
        );
      }

      return (
        'M ' + num(x + r, 3) + ' ' + num(y, 3) +
        ' H ' + num(x2 - r, 3) +
        ' A ' + num(r, 3) + ' ' + num(r, 3) + ' 0 0 1 ' + num(x2, 3) + ' ' + num(y + r, 3) +
        ' V ' + num(y2 - r, 3) +
        ' A ' + num(r, 3) + ' ' + num(r, 3) + ' 0 0 1 ' + num(x2 - r, 3) + ' ' + num(y2, 3) +
        ' H ' + num(x + r, 3) +
        ' A ' + num(r, 3) + ' ' + num(r, 3) + ' 0 0 1 ' + num(x, 3) + ' ' + num(y2 - r, 3) +
        ' V ' + num(y + r, 3) +
        ' A ' + num(r, 3) + ' ' + num(r, 3) + ' 0 0 1 ' + num(x + r, 3) + ' ' + num(y, 3) +
        ' Z'
      );
    }

    function shapeLabel(shape) {
      if (shape === 'rect') return 'Vierkant/rechthoek';
      if (shape === 'manhole') return 'Mangat';

      return 'Rond';
    }

    function itemLabel(it) {
      if (!it) return 'Pakking';
      if (it.shape === 'rect') {
        return 'Rechthoek ' + fmt(it.outerW, 1) + ' x ' + fmt(it.outerH, 1);
      }
      if (it.shape === 'manhole') {
        return 'Mangat ' + fmt(it.outerW, 1) + ' x ' + fmt(it.outerH, 1);
      }

      return 'Rond OD ' + fmt(it.od, 1) + ' / ID ' + fmt(it.id, 1);
    }

    function innerLabel(it) {
      if (!it) return '';
      if (it.innerShape === 'manhole') {
        return 'binnen mangat ' + fmt(it.innerW, 1) + ' x ' + fmt(it.innerH, 1);
      }
      if (it.innerShape === 'rect') {
        return 'binnen ' + fmt(it.innerW, 1) + ' x ' + fmt(it.innerH, 1) + ' r' + fmt(it.innerRadius, 1);
      }

      return 'binnen Ø ' + fmt(it.innerDia, 1);
    }

    function outerPathForItem(it, cx, cy, scale) {
      if (it.shape === 'circle') return circlePath(cx, cy, it.od / 2, scale);

      return roundedRectPath(cx, cy, it.outerW, it.outerH, it.outerRadius, scale);
    }

    function innerPathForItem(it, cx, cy, scale) {
      if (it.innerShape === 'rect' || it.innerShape === 'manhole') {
        return roundedRectPath(cx, cy, it.innerW, it.innerH, it.innerRadius, scale);
      }

      return circlePath(cx, cy, it.innerDia / 2, scale);
    }

    function hideLine(el) {
      if (!el) return;

      el.style.display = 'none';
      el.setAttribute('x1', '0');
      el.setAttribute('y1', '0');
      el.setAttribute('x2', '0');
      el.setAttribute('y2', '0');
    }

    function hideText(el) {
      if (!el) return;

      el.style.display = 'none';
      el.textContent = '';
      el.setAttribute('x', '0');
      el.setAttribute('y', '0');
    }

    function getVariantData() {
      var json = root.querySelector('script[data-gasket-variants]');

      try {
        var data = JSON.parse((json && json.textContent) || '[]');
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Gasket configurator: variant JSON kon niet gelezen worden.', error);
        return [];
      }
    }

    var VARIANTS = getVariantData();

    function findVariant(id) {
      id = String(id || '');

      for (var i = 0; i < VARIANTS.length; i++) {
        if (String(VARIANTS[i].id) === id) return VARIANTS[i];
      }

      return VARIANTS[0] || null;
    }

    function applyVariant() {
      var variant = findVariant(els.variant && els.variant.value);
      if (!variant) return;

      if (els.platePrice) els.platePrice.value = Number(variant.platePrice || 0);
      if (els.cutSpeed) els.cutSpeed.value = Number(variant.cutSpeed || 0);

      if (els.variantDebug) {
        els.variantDebug.textContent =
          'Gelezen uit custom metafields: plaatprijs ' +
          money(variant.platePrice || 0) +
          ' • snijsnelheid ' +
          fmt(variant.cutSpeed || 0, 0) +
          ' mm/min';
      }
    }

    function fieldBlock(label, field, type, attrs) {
      attrs = attrs || '';

      return (
        '<div>' +
          '<label class="gcfg__label">' + label + '</label>' +
          '<input class="gcfg__input" data-field="' + field + '" type="' + (type || 'text') + '" ' + attrs + '>' +
        '</div>'
      );
    }

    function shapeControlsHtml() {
      return (
        '<div class="gcfg__shapeBlock" data-shape-controls>' +
          '<input type="hidden" data-field="shape" value="">' +
          '<div class="gcfg__shapePicker" role="radiogroup" aria-label="Vorm">' +
            shapeTileHtml('circle', 'Rond', '<circle cx="32" cy="32" r="22"></circle><circle cx="32" cy="32" r="10"></circle>') +
            shapeTileHtml('rect', 'Vierkant', '<rect x="11" y="13" width="42" height="38" rx="7"></rect><rect x="22" y="23" width="20" height="18" rx="4"></rect>') +
            shapeTileHtml('manhole', 'Mangat', '<rect x="8" y="18" width="48" height="28" rx="14"></rect><rect x="21" y="24" width="22" height="16" rx="8"></rect>') +
          '</div>' +
          '<div class="gcfg__shapePrompt" data-shape-prompt>Kies een vorm om de maatvelden te openen.</div>' +

          '<div class="gcfg__row gcfg__row--2" data-show-for="rect manhole">' +
            fieldBlock('Buitenlengte / breedte mm *', 'outerW', 'text', 'inputmode="decimal" placeholder="bijv. 220"') +
            fieldBlock('Buitenhoogte mm *', 'outerH', 'text', 'inputmode="decimal" placeholder="bijv. 140"') +
          '</div>' +

          '<div class="gcfg__row" data-show-for="rect">' +
            fieldBlock('Buitenradius mm', 'outerRadius', 'text', 'inputmode="decimal" placeholder="bijv. 8, of leeg voor scherp"') +
          '</div>' +

          '<div class="gcfg__row" data-show-for="rect">' +
            '<label class="gcfg__label">Binnenvorm *</label>' +
            '<select class="gcfg__input" data-field="innerShape">' +
              '<option value="circle">Rond gat</option>' +
              '<option value="rect">Vierkant / rechthoekig gat</option>' +
            '</select>' +
          '</div>' +

          '<div class="gcfg__row" data-show-for="rect" data-inner-show-for="circle">' +
            fieldBlock('Binnen Ø mm *', 'innerDia', 'text', 'inputmode="decimal" placeholder="bijv. 90"') +
          '</div>' +

          '<div class="gcfg__row gcfg__row--2" data-show-for="rect" data-inner-show-for="rect">' +
            fieldBlock('Binnenlengte / breedte mm *', 'innerW', 'text', 'inputmode="decimal" placeholder="bijv. 140"') +
            fieldBlock('Binnenhoogte mm *', 'innerH', 'text', 'inputmode="decimal" placeholder="bijv. 70"') +
          '</div>' +

          '<div class="gcfg__row" data-show-for="rect" data-inner-show-for="rect">' +
            fieldBlock('Binnenradius mm', 'innerRadius', 'text', 'inputmode="decimal" placeholder="bijv. 8"') +
          '</div>' +

          '<div class="gcfg__row gcfg__row--2" data-show-for="manhole">' +
            fieldBlock('Binnenlengte mm *', 'innerW', 'text', 'inputmode="decimal" placeholder="bijv. 160"') +
            fieldBlock('Binnenhoogte mm *', 'innerH', 'text', 'inputmode="decimal" placeholder="bijv. 80"') +
          '</div>' +
        '</div>'
      );
    }

    function shapeTileHtml(value, label, icon) {
      return (
        '<button type="button" class="gcfg__shapeTile" data-shape-choice="' + value + '" role="radio" aria-checked="false">' +
          '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + icon + '</svg>' +
          '<span>' + label + '</span>' +
        '</button>'
      );
    }

    function closestFieldWrap(input) {
      return input && input.parentElement ? input.parentElement : null;
    }

    function prepareItemShapeUI(item) {
      if (!item || item.__gcfgShapeReady) return;

      var f = itemFields(item);
      var circleRow = f.od && f.od.closest ? f.od.closest('.gcfg__row') : null;
      var pcdRow = f.pcd && f.pcd.closest ? f.pcd.closest('.gcfg__row') : null;
      var holeDiaRow = f.holeDia && f.holeDia.closest ? f.holeDia.closest('.gcfg__row') : null;
      var qtyRow = f.qty && f.qty.closest ? f.qty.closest('.gcfg__row') : null;

      if (circleRow) {
        circleRow.setAttribute('data-show-for', 'circle');
        circleRow.insertAdjacentHTML('beforebegin', shapeControlsHtml());
      }

      if (pcdRow) pcdRow.setAttribute('data-show-for', 'circle');
      if (holeDiaRow) holeDiaRow.setAttribute('data-show-for', 'circle');
      if (qtyRow) qtyRow.setAttribute('data-requires-shape', 'true');

      item.__gcfgShapeReady = true;
      syncShapeUI(item, true);
    }

    function fieldValue(el) {
      return el && el.value != null ? String(el.value).trim() : '';
    }

    function seedShapeFields(item) {
      var f = itemFields(item);

      if (!fieldValue(f.outerW) && fieldValue(f.od)) f.outerW.value = f.od.value;
      if (!fieldValue(f.outerH) && fieldValue(f.od)) f.outerH.value = f.od.value;
      if (!fieldValue(f.innerDia) && fieldValue(f.id)) f.innerDia.value = f.id.value;
      if (!fieldValue(f.innerW) && fieldValue(f.id)) f.innerW.value = f.id.value;
      if (!fieldValue(f.innerH) && fieldValue(f.id)) f.innerH.value = f.id.value;
    }

    function syncShapeUI(item, skipSeed) {
      var f = itemFields(item);
      var shape = f.shape && f.shape.value ? f.shape.value : '';
      var innerShape = f.innerShape && f.innerShape.value ? f.innerShape.value : 'circle';

      if (!skipSeed) seedShapeFields(item);

      item.setAttribute('data-shape', shape);
      item.setAttribute('data-inner-shape', innerShape);
      item.classList.toggle('has-shape', !!shape);

      Array.prototype.slice.call(item.querySelectorAll('[data-shape-choice]')).forEach(function (btn) {
        var active = btn.getAttribute('data-shape-choice') === shape;
        btn.classList.toggle('is-selected', active);
        btn.setAttribute('aria-checked', active ? 'true' : 'false');
      });

      Array.prototype.slice.call(item.querySelectorAll('[data-show-for]')).forEach(function (el) {
        var allowed = String(el.getAttribute('data-show-for') || '').split(/\s+/);
        el.hidden = allowed.indexOf(shape) === -1;
      });

      Array.prototype.slice.call(item.querySelectorAll('[data-inner-show-for]')).forEach(function (el) {
        var allowed = String(el.getAttribute('data-inner-show-for') || '').split(/\s+/);
        el.hidden = allowed.indexOf(innerShape) === -1 || shape !== 'rect';
      });

      Array.prototype.slice.call(item.querySelectorAll('[data-requires-shape]')).forEach(function (el) {
        el.hidden = !shape;
      });

      Array.prototype.slice.call(item.querySelectorAll('[data-shape-prompt]')).forEach(function (el) {
        el.hidden = !!shape;
      });
    }

    function itemFields(item) {
      return {
        shape: item.querySelector('[data-field="shape"]'),
        od: item.querySelector('[data-field="od"]'),
        id: item.querySelector('[data-field="id"]'),
        outerW: item.querySelector('[data-field="outerW"]'),
        outerH: item.querySelector('[data-field="outerH"]'),
        outerRadius: item.querySelector('[data-field="outerRadius"]'),
        innerShape: item.querySelector('[data-field="innerShape"]'),
        innerDia: item.querySelector('[data-field="innerDia"]'),
        innerW: item.querySelector('[data-field="innerW"]'),
        innerH: item.querySelector('[data-field="innerH"]'),
        innerRadius: item.querySelector('[data-field="innerRadius"]'),
        pcd: item.querySelector('[data-field="pcd"]'),
        holes: item.querySelector('[data-field="holes"]'),
        holeDia: item.querySelector('[data-field="holeDia"]'),
        h: item.querySelector('[data-field="h"]'),
        qty: item.querySelector('[data-field="qty"]')
      };
    }

    function readItem(item, index) {
      var f = itemFields(item);
      var shape = f.shape && f.shape.value ? f.shape.value : '';

      if (!shape) return null;

      var innerShape = shape === 'circle'
        ? 'circle'
        : (shape === 'manhole'
          ? 'manhole'
          : (f.innerShape && f.innerShape.value ? f.innerShape.value : 'circle'));
      var od = val(f.od);
      var id = val(f.id);
      var outerW = shape === 'circle' ? od : val(f.outerW);
      var outerH = shape === 'circle' ? od : val(f.outerH);
      var innerDia = shape === 'circle' || innerShape === 'circle' ? (shape === 'circle' ? id : val(f.innerDia)) : 0;
      var innerW = innerShape === 'rect' || innerShape === 'manhole' ? val(f.innerW) : innerDia;
      var innerH = innerShape === 'rect' || innerShape === 'manhole' ? val(f.innerH) : innerDia;
      var outerRadius = val(f.outerRadius);
      var innerRadius = val(f.innerRadius);
      var pcd = val(f.pcd);
      var holes = Math.max(0, Math.round(val(f.holes)));
      var holeDia = val(f.holeDia);
      var h = val(f.h);
      var qty = Math.max(0, Math.round(val(f.qty)));

      if (!(qty > 0)) return null;

      if (shape === 'circle') {
        outerRadius = od / 2;
        innerRadius = id / 2;

        if (!(od > 0) || !(id > 0) || id >= od) return null;
      } else {
        if (!(outerW > 0) || !(outerH > 0)) return null;

        outerRadius = shape === 'manhole'
          ? Math.min(outerW, outerH) / 2
          : clampRadius(outerW, outerH, outerRadius);

        if (shape === 'manhole') {
          if (!(innerW > 0) || !(innerH > 0) || innerW >= outerW || innerH >= outerH) return null;
          innerDia = Math.max(innerW, innerH);
          innerRadius = Math.min(innerW, innerH) / 2;
        } else if (innerShape === 'circle') {
          if (!(innerDia > 0) || innerDia >= Math.min(outerW, outerH)) return null;
          innerW = innerDia;
          innerH = innerDia;
          innerRadius = innerDia / 2;
        } else {
          if (!(innerW > 0) || !(innerH > 0) || innerW >= outerW || innerH >= outerH) return null;
          innerRadius = clampRadius(innerW, innerH, innerRadius);
        }

        od = Math.max(outerW, outerH);
        id = innerShape === 'circle' ? innerDia : Math.max(innerW, innerH);
        holes = 0;
        pcd = 0;
        holeDia = 0;
      }

      return {
        index: index + 1,
        shape: shape,
        innerShape: innerShape,
        od: od,
        id: id,
        outerW: outerW,
        outerH: outerH,
        outerRadius: outerRadius,
        innerDia: innerDia,
        innerW: innerW,
        innerH: innerH,
        innerRadius: innerRadius,
        pcd: pcd,
        holes: holes,
        holeDia: holeDia,
        h: h,
        qty: qty
      };
    }

    function readItems() {
      var out = [];

      $all('[data-gasket-item]').forEach(function (item, index) {
        var data = readItem(item, index);
        if (data) out.push(data);
      });

      return out;
    }

    function boltPatternMessage(it, messages) {
      if (it.shape && it.shape !== 'circle') return '';

      var filled = [it.pcd, it.holes, it.holeDia].filter(function (x) {
        return x && x > 0;
      }).length;

      if (filled > 0 && filled < 3) return messages.partial;

      if (it.pcd > 0 && it.holes > 0 && it.holeDia > 0) {
        var ro = it.od / 2;
        var ri = it.id / 2;
        var rp = it.pcd / 2;
        var rh = it.holeDia / 2;

        if (!(rp - rh > ri) || !(rp + rh < ro)) return messages.noFit;
      }

      return '';
    }

    function validateBoltPattern(it, target, messages) {
      var message = boltPatternMessage(it, messages);

      if (message) {
        warn(target, message);
        return false;
      }

      return true;
    }

    function readActiveItemForExport() {
      warn(els.svgWarn, '');

      if (!activeItem) activeItem = $all('[data-gasket-item]')[0] || null;

      if (!activeItem) {
        warn(els.svgWarn, I18N.export_invalid);
        return null;
      }

      var items = $all('[data-gasket-item]');
      var index = Math.max(0, items.indexOf(activeItem));
      var item = readItem(activeItem, index);

      if (!item) {
        warn(els.svgWarn, I18N.export_invalid);
        return null;
      }

      if (!validateBoltPattern(item, els.svgWarn, {
        partial: I18N.export_bolt_partial,
        noFit: I18N.export_bolt_no_fit
      })) {
        return null;
      }

      item.qty = 1;

      return item;
    }

    function updateItemTitles() {
      var items = $all('[data-gasket-item]');

      items.forEach(function (item, index) {
        var title = item.querySelector('.gcfg__itemTitle');
        var color = Drawing.getColor(index + 1);
        var remove = item.querySelector('[data-remove]');

        if (title) title.textContent = 'Pakking ' + (index + 1) + ' — ' + color.name;

        item.classList.toggle('is-active', item === activeItem);

        if (remove) remove.style.display = items.length > 1 ? '' : 'none';
      });
    }

    function applyDefaultsToItem(item, defaults) {
      if (!defaults) return;

      var f = itemFields(item);

      if (defaults.shape != null && f.shape) f.shape.value = defaults.shape;
      if (defaults.od != null) f.od.value = defaults.od;
      if (defaults.id != null) f.id.value = defaults.id;
      if (defaults.outerW != null && f.outerW) f.outerW.value = defaults.outerW;
      if (defaults.outerH != null && f.outerH) f.outerH.value = defaults.outerH;
      if (defaults.outerRadius != null && f.outerRadius) f.outerRadius.value = defaults.outerRadius;
      if (defaults.innerShape != null && f.innerShape) f.innerShape.value = defaults.innerShape;
      if (defaults.innerDia != null && f.innerDia) f.innerDia.value = defaults.innerDia;
      if (defaults.innerW != null && f.innerW) f.innerW.value = defaults.innerW;
      if (defaults.innerH != null && f.innerH) f.innerH.value = defaults.innerH;
      if (defaults.innerRadius != null && f.innerRadius) f.innerRadius.value = defaults.innerRadius;
      if (defaults.pcd != null) f.pcd.value = defaults.pcd;
      if (defaults.holes != null) f.holes.value = defaults.holes;
      if (defaults.holeDia != null) f.holeDia.value = defaults.holeDia;
      if (defaults.h != null && f.h) f.h.value = defaults.h;
      if (defaults.qty != null) f.qty.value = defaults.qty;
    }

    function addItem(defaults) {
      var node = els.itemTpl.content.firstElementChild.cloneNode(true);

      els.itemsWrap.appendChild(node);
      prepareItemShapeUI(node);
      applyDefaultsToItem(node, defaults);
      syncShapeUI(node, true);

      var previewBtn = node.querySelector('[data-preview]');
      var removeBtn = node.querySelector('[data-remove]');

      if (previewBtn) {
        previewBtn.addEventListener('click', function () {
          activeItem = node;
          updateItemTitles();
          renderActivePreview();
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          if ($all('[data-gasket-item]').length <= 1) return;

          if (activeItem === node) activeItem = null;

          node.remove();

          if (!activeItem) activeItem = $all('[data-gasket-item]')[0] || null;

          updateItemTitles();
          renderActivePreview();
        });
      }

      node.querySelectorAll('[data-shape-choice]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var f = itemFields(node);
          if (f.shape) f.shape.value = btn.getAttribute('data-shape-choice') || 'circle';
          syncShapeUI(node);
          if (node === activeItem) scheduleRender();
        });
      });

      node.querySelectorAll('input, select').forEach(function (input) {
        input.addEventListener('input', function () {
          syncShapeUI(node);
          if (node === activeItem) scheduleRender();
        }, { passive: true });

        input.addEventListener('change', function () {
          syncShapeUI(node);
          if (node === activeItem) scheduleRender();
        }, { passive: true });
      });

      if (!activeItem) activeItem = node;

      updateItemTitles();
      renderActivePreview();
    }

    function resetDrawing() {
      warn(els.svgWarn, '');

      if (drawingEls.holesG) drawingEls.holesG.innerHTML = '';
      if (drawingEls.ringFill) drawingEls.ringFill.setAttribute('d', '');
      if (drawingEls.ringOuterPath) drawingEls.ringOuterPath.setAttribute('d', '');
      if (drawingEls.ringInnerPath) drawingEls.ringInnerPath.setAttribute('d', '');

      setA(drawingEls.ringOD, 'r', 0);
      setA(drawingEls.ringID, 'r', 0);
      setA(drawingEls.pcdCircle, 'r', 0);

      if (drawingEls.pcdCircle) drawingEls.pcdCircle.style.display = 'none';

      [
        drawingEls.odExtL,
        drawingEls.odExtR,
        drawingEls.odLine,
        drawingEls.idExtL,
        drawingEls.idExtR,
        drawingEls.idLine,
        drawingEls.pcdExtL,
        drawingEls.pcdExtR,
        drawingEls.pcdLine,
        drawingEls.holeExtL,
        drawingEls.holeExtR,
        drawingEls.holeLine
      ].forEach(hideLine);

      [
        drawingEls.odText,
        drawingEls.idText,
        drawingEls.pcdText,
        drawingEls.holeText
      ].forEach(hideText);

      if (drawingEls.thkGroup) drawingEls.thkGroup.style.display = 'none';
    }

    function renderActivePreview() {
      resetDrawing();

      if (!activeItem) return;

      var items = $all('[data-gasket-item]');
      var itemIndex = Math.max(0, items.indexOf(activeItem));
      var it = readItem(activeItem, itemIndex);
      var thickness = it && it.h > 0 ? it.h : null;

      if (!it) {
        var shapeField = activeItem.querySelector('[data-field="shape"]');
        warn(els.svgWarn, shapeField && !shapeField.value ? I18N.choose_shape : I18N.invalid);
        return;
      }

      var cx = 320;
      var cy = 255;
      var maxPreview = 280;
      var scale = maxPreview / Math.max(it.outerW, it.outerH);
      var outerW = it.outerW * scale;
      var outerH = it.outerH * scale;
      var innerW = it.innerW * scale;
      var innerH = it.innerH * scale;
      var rOuter = Math.max(outerW, outerH) / 2;
      var rInner = Math.max(innerW, innerH) / 2;

      var d = outerPathForItem(it, cx, cy, scale) + ' ' + innerPathForItem(it, cx, cy, scale);
      var outerPath = outerPathForItem(it, cx, cy, scale);
      var innerPath = innerPathForItem(it, cx, cy, scale);

      if (drawingEls.ringFill) drawingEls.ringFill.setAttribute('d', d);

      if (it.shape === 'circle') {
        setA(drawingEls.ringOD, 'cx', cx);
        setA(drawingEls.ringOD, 'cy', cy);
        setA(drawingEls.ringOD, 'r', outerW / 2);

        setA(drawingEls.ringID, 'cx', cx);
        setA(drawingEls.ringID, 'cy', cy);
        setA(drawingEls.ringID, 'r', it.innerShape === 'circle' ? innerW / 2 : 0);
      } else {
        if (drawingEls.ringOuterPath) drawingEls.ringOuterPath.setAttribute('d', outerPath);
        if (drawingEls.ringInnerPath) drawingEls.ringInnerPath.setAttribute('d', innerPath);
      }

      drawDiameterDimension(drawingEls.odExtL, drawingEls.odExtR, drawingEls.odLine, drawingEls.odText, cx - outerW / 2, cx + outerW / 2, cy, 62, fmt(it.outerW, 1) + ' mm', cx, -10);
      drawDiameterDimension(drawingEls.idExtL, drawingEls.idExtR, drawingEls.idLine, drawingEls.idText, cx - innerW / 2, cx + innerW / 2, cy, 96, fmt(it.innerW, 1) + ' mm', cx, -10);

      drawBoltPattern({
        cx: cx,
        cy: cy,
        rOuter: Math.min(outerW, outerH) / 2,
        rInner: it.innerShape === 'circle' ? innerW / 2 : Math.max(innerW, innerH) / 2,
        scale: scale,
        pcd: it.pcd,
        holeDia: it.holeDia,
        holeCount: it.holes
      });

      drawThickness({
        cx: cx,
        cy: cy,
        rOuter: rOuter,
        rInner: rInner,
        thickness: thickness
      });
    }

    function drawDiameterDimension(extL, extR, line, text, xL, xR, cy, yDim, label, textX, textYOffset) {
      setA(extL, 'x1', px(xL));
      setA(extL, 'x2', px(xL));
      setA(extL, 'y1', px(yDim));
      setA(extL, 'y2', px(cy));
      if (extL) extL.style.display = '';

      setA(extR, 'x1', px(xR));
      setA(extR, 'x2', px(xR));
      setA(extR, 'y1', px(yDim));
      setA(extR, 'y2', px(cy));
      if (extR) extR.style.display = '';

      setA(line, 'x1', px(xL));
      setA(line, 'x2', px(xR));
      setA(line, 'y1', px(yDim));
      setA(line, 'y2', px(yDim));
      if (line) line.style.display = '';

      setA(text, 'x', textX);
      setA(text, 'y', yDim + textYOffset);
      if (text) {
        text.style.display = '';
        text.textContent = label;
      }
    }

    function drawBoltPattern(cfg) {
      var pcd = cfg.pcd;
      var holeDia = cfg.holeDia;
      var holeCount = cfg.holeCount;

      if (pcd && holeDia && holeCount > 0) {
        var rPcd = (pcd / 2) * cfg.scale;
        var rHole = (holeDia / 2) * cfg.scale;

        if (drawingEls.pcdCircle) {
          drawingEls.pcdCircle.style.display = '';
          setA(drawingEls.pcdCircle, 'cx', cfg.cx);
          setA(drawingEls.pcdCircle, 'cy', cfg.cy);
          setA(drawingEls.pcdCircle, 'r', rPcd);
        }

        var fits = rPcd - rHole > cfg.rInner + 2 && rPcd + rHole < cfg.rOuter - 2;

        if (!fits) {
          warn(els.svgWarn, I18N.bolt_no_fit);
          return;
        }

        var NS = 'http://www.w3.org/2000/svg';
        var step = (Math.PI * 2) / holeCount;
        var rot = Math.PI / 2;

        for (var i = 0; i < holeCount; i++) {
          var angle = rot + i * step;
          var circle = document.createElementNS(NS, 'circle');

          circle.setAttribute('cx', cfg.cx + rPcd * Math.cos(angle));
          circle.setAttribute('cy', cfg.cy + rPcd * Math.sin(angle));
          circle.setAttribute('r', rHole);

          drawingEls.holesG.appendChild(circle);
        }

        var yDimHole = cfg.cy + cfg.rOuter + 92;
        var yDimPCD = yDimHole + 48;

        drawDiameterDimension(drawingEls.holeExtL, drawingEls.holeExtR, drawingEls.holeLine, drawingEls.holeText, cfg.cx - rHole, cfg.cx + rHole, cfg.cy + rPcd, yDimHole, 'Ø ' + fmt(holeDia, 1) + ' mm', cfg.cx, 16);
        drawDiameterDimension(drawingEls.pcdExtL, drawingEls.pcdExtR, drawingEls.pcdLine, drawingEls.pcdText, cfg.cx - rPcd, cfg.cx + rPcd, cfg.cy, yDimPCD, 'PCD ' + fmt(pcd, 1) + ' mm', cfg.cx, 16);

        return;
      }

      var filled = [pcd, holeDia, holeCount].filter(function (x) {
        return x && x > 0;
      }).length;

      if (filled > 0 && filled < 3) warn(els.svgWarn, I18N.bolt_partial);
    }

    function drawThickness(cfg) {
      if (!cfg.thickness || !drawingEls.thkGroup) return;

      drawingEls.thkGroup.style.display = '';

      var yTopOD = cfg.cy - cfg.rOuter;
      var yBotOD = cfg.cy + cfg.rOuter;
      var yTopID = cfg.cy - cfg.rInner;
      var yBotID = cfg.cy + cfg.rInner;
      var x1 = 520;
      var x2 = 532;

      setA(drawingEls.thkLeft, 'x1', px(x1));
      setA(drawingEls.thkLeft, 'x2', px(x1));
      setA(drawingEls.thkLeft, 'y1', px(yTopOD));
      setA(drawingEls.thkLeft, 'y2', px(yBotOD));

      setA(drawingEls.thkRight, 'x1', px(x2));
      setA(drawingEls.thkRight, 'x2', px(x2));
      setA(drawingEls.thkRight, 'y1', px(yTopOD));
      setA(drawingEls.thkRight, 'y2', px(yBotOD));

      setA(drawingEls.thkTop, 'x1', px(x1));
      setA(drawingEls.thkTop, 'x2', px(x2));
      setA(drawingEls.thkTop, 'y1', px(yTopOD));
      setA(drawingEls.thkTop, 'y2', px(yTopOD));

      setA(drawingEls.thkBot, 'x1', px(x1));
      setA(drawingEls.thkBot, 'x2', px(x2));
      setA(drawingEls.thkBot, 'y1', px(yBotOD));
      setA(drawingEls.thkBot, 'y2', px(yBotOD));

      setA(drawingEls.thkIdTop, 'x1', px(x1));
      setA(drawingEls.thkIdTop, 'x2', px(x2));
      setA(drawingEls.thkIdTop, 'y1', px(yTopID));
      setA(drawingEls.thkIdTop, 'y2', px(yTopID));

      setA(drawingEls.thkIdBot, 'x1', px(x1));
      setA(drawingEls.thkIdBot, 'x2', px(x2));
      setA(drawingEls.thkIdBot, 'y1', px(yBotID));
      setA(drawingEls.thkIdBot, 'y2', px(yBotID));

      var yDim = yTopOD - 22;

      setA(drawingEls.thkDim, 'x1', px(x1));
      setA(drawingEls.thkDim, 'x2', px(x2));
      setA(drawingEls.thkDim, 'y1', px(yDim));
      setA(drawingEls.thkDim, 'y2', px(yDim));

      setA(drawingEls.thkText, 'x', (x1 + x2) / 2);
      setA(drawingEls.thkText, 'y', yDim - 8);

      if (drawingEls.thkText) drawingEls.thkText.textContent = fmt(cfg.thickness, 1) + ' mm';
    }

    function scheduleRender() {
      if (renderFrame) window.cancelAnimationFrame(renderFrame);

      renderFrame = window.requestAnimationFrame(function () {
        renderFrame = null;
        renderActivePreview();
      });
    }

    function outerArea(it) {
      if (it.shape === 'circle') return circleArea(it.od);

      return roundedRectArea(it.outerW, it.outerH, it.outerRadius);
    }

    function innerArea(it) {
      if (it.innerShape === 'rect' || it.innerShape === 'manhole') {
        return roundedRectArea(it.innerW, it.innerH, it.innerRadius);
      }

      return circleArea(it.innerDia);
    }

    function ringArea(it) {
      return Math.max(0, outerArea(it) - innerArea(it));
    }

    function outerPerimeter(it) {
      if (it.shape === 'circle') return circlePerimeter(it.od);

      return roundedRectPerimeter(it.outerW, it.outerH, it.outerRadius);
    }

    function innerPerimeter(it) {
      if (it.innerShape === 'rect' || it.innerShape === 'manhole') {
        return roundedRectPerimeter(it.innerW, it.innerH, it.innerRadius);
      }

      return circlePerimeter(it.innerDia);
    }

    function processMetricsPerPiece(it, holeMethod) {
      var cutLength = 0;
      var cutContours = 0;
      var pierces = 0;
      var punchedHoles = 0;

      cutLength += outerPerimeter(it);
      cutContours += 1;
      pierces += 1;

      if (innerArea(it) > 0) {
        cutLength += innerPerimeter(it);
        cutContours += 1;
        pierces += 1;
      }

      if (it.shape === 'circle' && it.holes > 0 && it.holeDia > 0) {
        if (holeMethod === 'punch') {
          punchedHoles += it.holes;
        } else {
          cutLength += it.holes * Math.PI * it.holeDia;
          cutContours += it.holes;
          pierces += it.holes;
        }
      }

      return {
        cutLength: cutLength,
        cutContours: cutContours,
        pierces: pierces,
        punchedHoles: punchedHoles
      };
    }

    function readCostSettings() {
      var remainderMode = els.remainderMode && els.remainderMode.value
        ? els.remainderMode.value
        : 'charge';

      var nestingOptions = {
        materialMode: remainderMode === 'discard' ? 'used_strip' : 'full_plate',

        /*
          Belangrijk:
          - discard: onderste reststrook rood tonen en niet meerekenen
          - charge: geen automatische rode reststrook door 30%-threshold
        */
        wasteThresholdPct: remainderMode === 'discard' ? 30 : -1
      };

      return {
        W: val(els.plateW) || 1500,
        H: val(els.plateH) || 1500,
        edge: val(els.edge),
        gap: val(els.gap),

        platePrice: val(els.platePrice),
        hourRate: val(els.hourRate),
        cutSpeed: val(els.cutSpeed),
        setupMin: val(els.setupMin),
        kerf: val(els.kerf),
        pierceSec: val(els.pierceSec),

        holeMethod: els.holeMethod && els.holeMethod.value ? els.holeMethod.value : 'cut',
        punchSec: val(els.punchSec),
        plateLoadMin: val(els.plateLoadMin),
        plateUnloadMin: val(els.plateUnloadMin),
        moveSec: val(els.moveSec),
        finishSec: val(els.finishSec),

        marginPct: val(els.marginPct),
        minOrder: val(els.minOrder),

        remainderMode: remainderMode,
        nestingOptions: nestingOptions
      };
    }

    function calculateProcessTotals(items, cfg) {
      var totals = {
        qty: 0,
        cutLength: 0,
        cutContours: 0,
        pierces: 0,
        punchedHoles: 0,
        ringArea: 0
      };

      items.forEach(function (it) {
        var metrics = processMetricsPerPiece(it, cfg.holeMethod);

        totals.qty += it.qty;
        totals.cutLength += metrics.cutLength * it.qty;
        totals.cutContours += metrics.cutContours * it.qty;
        totals.pierces += metrics.pierces * it.qty;
        totals.punchedHoles += metrics.punchedHoles * it.qty;
        totals.ringArea += ringArea(it) * it.qty;
      });

      return totals;
    }

    function calculateItemPrices(items, cfg, totals, moneyData) {
      var lines = [];

      var sharedMinutes = cfg.setupMin + moneyData.plateHandlingMinutes;

      var finalScale = moneyData.subtotal > 0
        ? moneyData.totalCost / moneyData.subtotal
        : 0;

      items.forEach(function (it) {
        var m = processMetricsPerPiece(it, cfg.holeMethod);

        var itemCutIncl = (m.cutLength * it.qty) + (cfg.kerf > 0 ? (m.cutContours * it.qty * cfg.kerf) : 0);
        var itemCutMinutes = cfg.cutSpeed > 0 ? itemCutIncl / cfg.cutSpeed : 0;
        var itemPierceMinutes = (m.pierces * it.qty * cfg.pierceSec) / 60;
        var itemPositioningMinutes = (m.cutContours * it.qty * cfg.moveSec) / 60;
        var itemPunchMinutes = (m.punchedHoles * it.qty * cfg.punchSec) / 60;
        var itemFinishingMinutes = (it.qty * cfg.finishSec) / 60;

        var itemDirectMinutes =
          itemCutMinutes +
          itemPierceMinutes +
          itemPositioningMinutes +
          itemPunchMinutes +
          itemFinishingMinutes;

        var qtyShare = totals.qty > 0 ? it.qty / totals.qty : 0;
        var materialShare = totals.ringArea > 0 ? (ringArea(it) * it.qty) / totals.ringArea : qtyShare;

        var itemSharedMinutes = sharedMinutes * qtyShare;
        var itemLaborMinutes = itemDirectMinutes + itemSharedMinutes;
        var itemLaborCost = (itemLaborMinutes / 60) * cfg.hourRate;

        var itemMaterialCost = moneyData.materialCost * materialShare;
        var itemBaseCost = itemMaterialCost + itemLaborCost;
        var itemTotalCost = itemBaseCost * finalScale;
        var itemPiecePrice = it.qty > 0 ? itemTotalCost / it.qty : 0;

        lines.push({
          index: it.index,
          qty: it.qty,
          shape: it.shape,
          od: it.od,
          id: it.id,
          label: itemLabel(it),
          materialCost: itemMaterialCost,
          laborCost: itemLaborCost,
          totalCost: itemTotalCost,
          piecePrice: itemPiecePrice
        });
      });

      return lines;
    }

    function calculatePrice(event) {
      if (event) event.preventDefault();

      warn(els.warnBox, '');

      var items = readItems();

      if (!items.length) {
        var hasUnchosenShape = $all('[data-gasket-item]').some(function (item) {
          var shapeField = item.querySelector('[data-field="shape"]');
          return shapeField && !shapeField.value;
        });

        warn(els.warnBox, hasUnchosenShape ? I18N.choose_shape : I18N.no_items);
        return;
      }

      for (var i = 0; i < items.length; i++) {
        if (!validateBoltPattern(items[i], els.warnBox, {
          partial: I18N.bolt_partial,
          noFit: I18N.bolt_no_fit
        })) {
          return;
        }
      }

      var cfg = readCostSettings();

      var packing = items.length === 1
        ? Nesting.packSinglePattern(items[0], cfg.W, cfg.H, cfg.edge, cfg.gap, cfg.nestingOptions)
        : Nesting.packMixedSmart(items, cfg.W, cfg.H, cfg.edge, cfg.gap, cfg.nestingOptions);

      if (packing.notFit && packing.notFit.length) {
        warn(els.warnBox, I18N.no_fit);
        return;
      }

      if (!packing.plates || !packing.plates.length) {
        warn(els.warnBox, I18N.no_fit);
        return;
      }

      var mat = Nesting.totalMaterialArea(packing, cfg.W, cfg.H, cfg.edge, cfg.nestingOptions);

      var plateAreaM2 = (cfg.W * cfg.H) / 1000000;
      var pricePerM2 = plateAreaM2 > 0 ? cfg.platePrice / plateAreaM2 : 0;

      var materialAreaM2 = (mat.areaMm2 || 0) / 1000000;
      var materialCost = materialAreaM2 * pricePerM2;

      var totals = calculateProcessTotals(items, cfg);
      var plateCount = packing.plates.length;

      var kerfAllowance = cfg.kerf > 0 ? totals.cutContours * cfg.kerf : 0;
      var totalCutIncl = totals.cutLength + kerfAllowance;
      var totalCutM = totalCutIncl / 1000;

      var cutMinutes = cfg.cutSpeed > 0 ? totalCutIncl / cfg.cutSpeed : 0;
      var pierceMinutes = (totals.pierces * cfg.pierceSec) / 60;
      var positioningMinutes = (totals.cutContours * cfg.moveSec) / 60;
      var punchMinutes = (totals.punchedHoles * cfg.punchSec) / 60;
      var plateHandlingMinutes = plateCount * (cfg.plateLoadMin + cfg.plateUnloadMin);
      var finishingMinutes = (totals.qty * cfg.finishSec) / 60;

      var totalMinutes =
        cfg.setupMin +
        plateHandlingMinutes +
        cutMinutes +
        pierceMinutes +
        positioningMinutes +
        punchMinutes +
        finishingMinutes;

      var laborCost = (totalMinutes / 60) * cfg.hourRate;
      var subtotal = materialCost + laborCost;
      var withMargin = subtotal * (1 + cfg.marginPct / 100);
      var totalCost = Math.max(withMargin, cfg.minOrder);
      var averagePricePerPiece = totals.qty > 0 ? totalCost / totals.qty : 0;
      var wastePct = mat.areaMm2 > 0 ? ((mat.areaMm2 - totals.ringArea) / mat.areaMm2) * 100 : 0;

      var lastPlate = packing.plates[packing.plates.length - 1] || { placed: [] };

      var itemPrices = calculateItemPrices(items, cfg, totals, {
        materialCost: materialCost,
        plateHandlingMinutes: plateHandlingMinutes,
        cutMinutes: cutMinutes,
        pierceMinutes: pierceMinutes,
        positioningMinutes: positioningMinutes,
        punchMinutes: punchMinutes,
        finishingMinutes: finishingMinutes,
        subtotal: subtotal,
        totalCost: totalCost
      });

      if (els.nestSvg) {
        Drawing.drawNest(els.nestSvg, cfg.W, cfg.H, packing, items, cfg.edge, Nesting);
      }

      renderPriceResult({
        items: items,
        packing: packing,
        mat: mat,
        lastPlate: lastPlate,
        cfg: cfg,
        totals: totals,
        plateCount: plateCount,
        materialAreaM2: materialAreaM2,
        pricePerM2: pricePerM2,
        materialCost: materialCost,
        totalCutM: totalCutM,
        cutMinutes: cutMinutes,
        pierceMinutes: pierceMinutes,
        positioningMinutes: positioningMinutes,
        punchMinutes: punchMinutes,
        plateHandlingMinutes: plateHandlingMinutes,
        finishingMinutes: finishingMinutes,
        totalMinutes: totalMinutes,
        laborCost: laborCost,
        subtotal: subtotal,
        totalCost: totalCost,
        averagePricePerPiece: averagePricePerPiece,
        wastePct: wastePct,
        itemPrices: itemPrices
      });

      if (els.calcBox) {
        els.calcBox.hidden = false;

        if (els.calcBox.scrollIntoView) {
          els.calcBox.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    }

    function renderPriceResult(data) {
      if (!els.priceResult) return;

      var discardedM2 = ((data.mat && data.mat.discardedAreaMm2) || 0) / 1000000;
      var chargedAreaM2 = ((data.mat && data.mat.areaMm2) || 0) / 1000000;
      var chargedPlates = data.mat && data.mat.chargedPlates != null
        ? data.mat.chargedPlates
        : data.mat.fullPlates;

      var restCost = discardedM2 * data.pricePerM2;
      var restSummary = data.cfg.remainderMode === 'discard'
        ? 'Reststuk niet doorgerekend: ' + fmt(discardedM2, 3) + ' m² (' + money(restCost) + ' materiaalwaarde).'
        : 'Restmateriaal wordt meegerekend in de materiaalprijs; doorberekend oppervlak is ' + fmt(chargedAreaM2, 3) + ' m².';

      var marginEuro = data.totalCost - data.subtotal;
      var marginPct = data.subtotal > 0 ? (marginEuro / data.subtotal) * 100 : 0;

      els.priceResult.innerHTML =
        '<div class="gcfg__resultSummary" data-gcfg-pricing>' +
          '<div class="gcfg__summaryGrid">' +
            resultMetric('Plaatmateriaal', fmt(chargedAreaM2, 3) + ' m²', money(data.materialCost), restSummary) +
            resultMetric('Tijd', fmt(data.totalMinutes, 1) + ' min', money(data.laborCost), 'Totale machine-/arbeidstijd en tijdkosten.') +
            resultMetric('Kostprijs', money(data.subtotal), 'materiaal + tijd', 'Exclusief marge; minimum orderbedrag staat hieronder bij details.') +
            resultMetric('Verkoopprijs', '<span data-gcfg-value="salePrice">' + money(data.totalCost) + '</span>', 'totaal', 'Aanpasbaar via de velden hieronder.') +
          '</div>' +

          '<div class="gcfg__pricingControls">' +
            priceControl('Verkoopprijs totaal €', 'salePrice', num(data.totalCost, 2), '0.01') +
            priceControl('Marge %', 'marginPct', num(marginPct, 2), '0.1') +
            priceControl('Marge €', 'marginEuro', num(marginEuro, 2), '0.01') +
          '</div>' +

          '<div class="gcfg__marginLine">' +
            'Marge: <strong data-gcfg-value="marginPct">' + fmt(marginPct, 1) + '%</strong> / ' +
            '<strong data-gcfg-value="marginEuro">' + money(marginEuro) + '</strong>' +
            '<span data-gcfg-value="minimumWarning"></span>' +
          '</div>' +

          '<div class="gcfg__lineItems" data-gcfg-value="itemPrices">' +
            renderItemPriceCards(data, data.totalCost) +
          '</div>' +

          '<details class="gcfg__resultDetails">' +
            '<summary>Uitgebreide berekening tonen</summary>' +
            '<div class="gcfg__detailsBody">' +
              renderDetailedResult(data, chargedAreaM2, discardedM2, chargedPlates) +
            '</div>' +
          '</details>' +
        '</div>';

      bindPricingControls(els.priceResult.querySelector('[data-gcfg-pricing]'), data);
    }

    function resultMetric(label, value, subvalue, hint) {
      return (
        '<div class="gcfg__metric">' +
          '<div class="gcfg__metricLabel">' + label + '</div>' +
          '<div class="gcfg__metricValue">' + value + '</div>' +
          '<div class="gcfg__metricSub">' + subvalue + '</div>' +
          '<div class="gcfg__metricHint">' + hint + '</div>' +
        '</div>'
      );
    }

    function priceControl(label, key, value, step) {
      return (
        '<label class="gcfg__priceControl">' +
          '<span>' + label + '</span>' +
          '<input class="gcfg__input gcfg__priceInput" type="number" min="0" step="' + step + '" value="' + value + '" data-gcfg-input="' + key + '">' +
        '</label>'
      );
    }

    function renderItemPriceCards(data, salePrice) {
      var scale = data.subtotal > 0 ? salePrice / data.subtotal : 0;

      return data.itemPrices.map(function (line) {
        var color = Drawing.getColor(line.index);
        var baseCost = line.materialCost + line.laborCost;
        var lineTotal = baseCost * scale;
        var piecePrice = line.qty > 0 ? lineTotal / line.qty : 0;

        return (
          '<div class="gcfg__lineItem">' +
            '<strong>Pakking ' + line.index + ' (' + color.name + ')</strong>' +
            '<span>' + escXml(line.label || 'Pakking') + '</span>' +
            '<span>' + line.qty + ' stuks</span>' +
            '<span>Kostprijs regel: ' + money(baseCost) + '</span>' +
            '<span>Verkoop/stuk: <strong>' + money(piecePrice) + '</strong></span>' +
            '<span>Regeltotaal: ' + money(lineTotal) + '</span>' +
          '</div>'
        );
      }).join('');
    }

    function bindPricingControls(container, data) {
      if (!container) return;

      var saleInput = container.querySelector('[data-gcfg-input="salePrice"]');
      var marginPctInput = container.querySelector('[data-gcfg-input="marginPct"]');
      var marginEuroInput = container.querySelector('[data-gcfg-input="marginEuro"]');
      var saleValue = container.querySelector('[data-gcfg-value="salePrice"]');
      var marginPctValue = container.querySelector('[data-gcfg-value="marginPct"]');
      var marginEuroValue = container.querySelector('[data-gcfg-value="marginEuro"]');
      var itemPrices = container.querySelector('[data-gcfg-value="itemPrices"]');
      var minimumWarning = container.querySelector('[data-gcfg-value="minimumWarning"]');
      var syncing = false;

      function readInput(input, fallback) {
        var n = extractNumber(input && input.value);
        return n == null ? fallback : n;
      }

      function setInput(input, value, decimals) {
        if (input) input.value = num(value, decimals == null ? 2 : decimals);
      }

      function renderState(salePrice, source) {
        salePrice = Math.max(0, salePrice);

        var marginEuro = salePrice - data.subtotal;
        var marginPct = data.subtotal > 0 ? (marginEuro / data.subtotal) * 100 : 0;
        var average = data.totals.qty > 0 ? salePrice / data.totals.qty : 0;

        syncing = true;

        if (source !== 'sale') setInput(saleInput, salePrice, 2);
        if (source !== 'pct') setInput(marginPctInput, marginPct, 2);
        if (source !== 'euro') setInput(marginEuroInput, marginEuro, 2);

        syncing = false;

        if (saleValue) saleValue.textContent = money(salePrice);
        if (marginPctValue) marginPctValue.textContent = fmt(marginPct, 1) + '%';
        if (marginEuroValue) marginEuroValue.textContent = money(marginEuro);
        if (itemPrices) itemPrices.innerHTML = renderItemPriceCards(data, salePrice);

        if (minimumWarning) {
          minimumWarning.textContent = salePrice < data.cfg.minOrder
            ? ' Let op: onder minimum orderbedrag (' + money(data.cfg.minOrder) + ').'
            : ' Gemiddeld per pakking: ' + money(average) + '.';
        }
      }

      if (saleInput) {
        saleInput.addEventListener('input', function () {
          if (syncing) return;
          renderState(readInput(saleInput, data.totalCost), 'sale');
        });
      }

      if (marginPctInput) {
        marginPctInput.addEventListener('input', function () {
          if (syncing) return;
          var pct = readInput(marginPctInput, data.cfg.marginPct);
          renderState(data.subtotal * (1 + pct / 100), 'pct');
        });
      }

      if (marginEuroInput) {
        marginEuroInput.addEventListener('input', function () {
          if (syncing) return;
          renderState(data.subtotal + readInput(marginEuroInput, 0), 'euro');
        });
      }

      renderState(data.totalCost, '');
    }

    function renderDetailedResult(data, chargedAreaM2, discardedM2, chargedPlates) {
      var itemLines = data.items.map(function (it) {
        var color = Drawing.getColor(it.index);

        return 'Pakking ' +
          it.index +
          ' (' +
          color.name +
          '): ' +
          itemLabel(it) +
          ' • ' +
          innerLabel(it) +
          ' • aantal ' +
          it.qty;
      }).join('<br>');

      var layoutInfo = '';

      if (data.packing.mode === 'single') {
        layoutInfo =
          'Beste patroon: ' + data.packing.layout.name + '<br>' +
          'Raster: ' + data.packing.layout.gridCount + ' stuks per plaat<br>' +
          'Versprongen: ' + data.packing.layout.staggeredCount + ' stuks per plaat<br>' +
          'Maximaal per plaat: <strong>' + data.packing.perPlate + '</strong><br>' +
          '<em>Grijze posities zijn vrije posities en tellen niet mee.</em><br>';
      } else {
        layoutInfo =
          'Slimme gemixte indeling: grote pakkingen eerst, daarna kleinere in vrije ruimtes en indien mogelijk in binnendiameters.<br>' +
          '<em>Bij meerdere pakkingtypes worden grijze vrije posities uitgezet om verwarring te voorkomen.</em><br>';
      }

      var holeMethodLabel = data.cfg.holeMethod === 'punch'
        ? 'Boutgaten stansen'
        : 'Boutgaten CNC snijden';

      var remainderLabel = data.cfg.remainderMode === 'discard'
        ? 'Niet meegerekend en rood getoond als restafval'
        : 'Meegerekend in materiaalprijs';

      return (
        '<strong>Pakkingregels</strong><br>' +
        itemLines +

        '<br><br><strong>Plaatindeling</strong><br>' +
        layoutInfo +
        'Aantal platen nodig: <strong>' + data.plateCount + '</strong><br>' +
        'Gebruikte platen gerekend: ' + data.mat.fullPlates + '<br>' +
        'Doorberekende platen/stroken: ' + fmt(chargedPlates, 2) + '<br>' +
        'Stuks op laatste/restplaat: ' + (data.lastPlate.placed ? data.lastPlate.placed.length : 0) + '<br><br>' +

        '<strong>Materiaal</strong><br>' +
        'Onderste reststrook: ' + remainderLabel + '<br>' +
        'Doorberekend materiaaloppervlak: ' + fmt(chargedAreaM2, 3) + ' m²<br>' +
        'Niet meegerekend/restmateriaal: ' + fmt(discardedM2, 3) + ' m²<br>' +
        'Prijs per m² materiaal: ' + money(data.pricePerM2) + '<br>' +
        'Materiaalkosten: ' + money(data.materialCost) + '<br>' +
        'Indicatief verlies binnen strook/platen: ' + fmt(Math.max(0, data.wastePct), 1) + '%<br><br>' +

        '<strong>Bewerking</strong><br>' +
        'Bewerkingsmethode boutgaten: ' + holeMethodLabel + '<br>' +
        'Totaal aantal pakkingen: ' + data.totals.qty + '<br>' +
        'CNC-contouren: ' + data.totals.cutContours + '<br>' +
        'Pierces: ' + data.totals.pierces + '<br>' +
        'Gestanste gaten: ' + data.totals.punchedHoles + '<br>' +
        'Totale CNC snijlengte incl. kerf: ' + fmt(data.totalCutM, 2) + ' meter<br><br>' +

        '<strong>Arbeid & machinetijd</strong><br>' +
        'Setup / programma / instellen: ' + fmt(data.cfg.setupMin, 1) + ' min<br>' +
        'Plaat laden/afruimen: ' + fmt(data.plateHandlingMinutes, 1) + ' min<br>' +
        'CNC snijtijd: ' + fmt(data.cutMinutes, 1) + ' min<br>' +
        'Pierce-tijd: ' + fmt(data.pierceMinutes, 1) + ' min<br>' +
        'Positioneren/verplaatsen: ' + fmt(data.positioningMinutes, 1) + ' min<br>' +
        'Stanstijd: ' + fmt(data.punchMinutes, 1) + ' min<br>' +
        'Opruimen/sorteren: ' + fmt(data.finishingMinutes, 1) + ' min<br>' +
        'Totale tijd: <strong>' + fmt(data.totalMinutes, 1) + ' min</strong><br>' +
        'Arbeids-/machinekosten: ' + money(data.laborCost) + '<br><br>' +

        '<strong>Prijsinstellingen</strong><br>' +
        'Subtotaal/kostprijs: ' + money(data.subtotal) + '<br>' +
        'Ingestelde marge/opslag: ' + fmt(data.cfg.marginPct, 1) + '%<br>' +
        'Minimum orderbedrag: ' + money(data.cfg.minOrder)
      );
    }

    function downloadText(content, type, filename) {
      var blob = new Blob([content], { type: type });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
    }

    function exportFilename(it, ext) {
      var base = 'pakking-1stuk-' + safeFilePart(it.shape || 'rond');

      if (it.shape === 'circle') {
        base +=
          '-od' +
          safeFilePart(num(it.od, 2)) +
          '-id' +
          safeFilePart(num(it.id, 2));
      } else {
        base +=
          '-' +
          safeFilePart(num(it.outerW, 2)) +
          'x' +
          safeFilePart(num(it.outerH, 2)) +
          '-binnen-' +
          safeFilePart(it.innerShape || 'gat') +
          '-' +
          safeFilePart(num(it.innerW, 2)) +
          'x' +
          safeFilePart(num(it.innerH, 2));
      }

      if (it.pcd > 0 && it.holes > 0 && it.holeDia > 0) {
        base +=
          '-pcd' +
          safeFilePart(num(it.pcd, 2)) +
          '-' +
          it.holes +
          'x' +
          safeFilePart(num(it.holeDia, 2));
      }

      return base + '.' + ext;
    }

    function holeCenters(it) {
      var centers = [];

      if (it.shape && it.shape !== 'circle') return centers;
      if (!(it.pcd > 0) || !(it.holes > 0) || !(it.holeDia > 0)) return centers;

      var rp = it.pcd / 2;

      for (var h = 0; h < it.holes; h++) {
        var angle = -Math.PI / 2 + (Math.PI * 2 * h) / it.holes;

        centers.push({
          x: rp * Math.cos(angle),
          y: rp * Math.sin(angle),
          r: it.holeDia / 2
        });
      }

      return centers;
    }

    function roundedRectPoints(w, h, r, steps) {
      w = Math.max(0, w || 0);
      h = Math.max(0, h || 0);
      r = clampRadius(w, h, r);
      steps = Math.max(2, Math.round(steps || 8));

      var hw = w / 2;
      var hh = h / 2;
      var points = [];

      function pushArc(cx, cy, start, end) {
        for (var i = 0; i <= steps; i++) {
          var t = start + (end - start) * (i / steps);
          points.push({
            x: cx + Math.cos(t) * r,
            y: cy + Math.sin(t) * r
          });
        }
      }

      if (r <= 0) {
        return [
          { x: -hw, y: -hh },
          { x: hw, y: -hh },
          { x: hw, y: hh },
          { x: -hw, y: hh }
        ];
      }

      pushArc(hw - r, -hh + r, -Math.PI / 2, 0);
      pushArc(hw - r, hh - r, 0, Math.PI / 2);
      pushArc(-hw + r, hh - r, Math.PI / 2, Math.PI);
      pushArc(-hw + r, -hh + r, Math.PI, Math.PI * 1.5);

      return points;
    }

    function generateLiveGasketDXF(it) {
      var lines = [];
      var holes = holeCenters(it);
      var ro = Math.max(it.outerW, it.outerH) / 2;

      function add() {
        for (var i = 0; i < arguments.length; i++) lines.push(String(arguments[i]));
      }

      function layer(name, color) {
        add(
          0, 'LAYER',
          2, name,
          70, 0,
          62, color,
          6, 'CONTINUOUS'
        );
      }

      function circle(layerName, x, y, r) {
        add(
          0, 'CIRCLE',
          8, layerName,
          10, num(x, 6),
          20, num(-y, 6),
          30, 0,
          40, num(r, 6)
        );
      }

      function line(layerName, x1, y1, x2, y2) {
        add(
          0, 'LINE',
          8, layerName,
          10, num(x1, 6),
          20, num(-y1, 6),
          30, 0,
          11, num(x2, 6),
          21, num(-y2, 6),
          31, 0
        );
      }

      function polyline(layerName, points) {
        if (!points || points.length < 2) return;

        for (var i = 0; i < points.length; i++) {
          var a = points[i];
          var b = points[(i + 1) % points.length];
          line(layerName, a.x, a.y, b.x, b.y);
        }
      }

      add(
        0, 'SECTION',
        2, 'HEADER',
        9, '$ACADVER',
        1, 'AC1009',
        9, '$INSUNITS',
        70, 4,
        0, 'ENDSEC'
      );

      add(
        0, 'SECTION',
        2, 'TABLES',
        0, 'TABLE',
        2, 'LAYER',
        70, 8
      );

      layer('CUT_OD', 1);
      layer('CUT_ID', 5);
      layer('CUT_HOLES', 3);
      layer('REF_PCD', 2);
      layer('INFO_TEXT', 7);

      add(
        0, 'ENDTAB',
        0, 'ENDSEC'
      );

      add(
        0, 'SECTION',
        2, 'ENTITIES'
      );

      if (it.shape === 'circle') {
        circle('CUT_OD', 0, 0, it.od / 2);
        circle('CUT_ID', 0, 0, it.id / 2);
      } else {
        polyline('CUT_OD', roundedRectPoints(it.outerW, it.outerH, it.outerRadius, 10));

        if (it.innerShape === 'rect' || it.innerShape === 'manhole') {
          polyline('CUT_ID', roundedRectPoints(it.innerW, it.innerH, it.innerRadius, 10));
        } else {
          circle('CUT_ID', 0, 0, it.innerDia / 2);
        }
      }

      holes.forEach(function (hole) {
        circle('CUT_HOLES', hole.x, hole.y, hole.r);
      });

      if (it.pcd > 0 && it.holes > 0 && it.holeDia > 0) {
        circle('REF_PCD', 0, 0, it.pcd / 2);
      }

      add(
        0, 'TEXT',
        8, 'INFO_TEXT',
        10, num(-ro, 3),
        20, num(-(ro + 14), 3),
        30, 0,
        40, Math.max(3, Math.max(it.outerW, it.outerH) * 0.025),
        1, '1x GASKET ' + shapeLabel(it.shape) + ' ' + num(it.outerW, 2) + 'x' + num(it.outerH, 2) + ' MM'
      );

      add(
        0, 'ENDSEC',
        0, 'EOF'
      );

      return lines.join('\n');
    }

    function generateLiveGasketSVG(it) {
      var margin = Math.max(10, Math.max(it.outerW, it.outerH) * 0.08);
      var sizeW = it.outerW + margin * 2;
      var sizeH = it.outerH + margin * 2;
      var cx = sizeW / 2;
      var cy = sizeH / 2;
      var holes = holeCenters(it);
      var out = '';

      out += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + num(sizeW, 3) + ' ' + num(sizeH, 3) + '" width="' + num(sizeW, 3) + 'mm" height="' + num(sizeH, 3) + 'mm">\n';
      out += '  <title>1x pakking ' + escXml(shapeLabel(it.shape)) + ' ' + escXml(num(it.outerW, 2)) + 'x' + escXml(num(it.outerH, 2)) + ' mm</title>\n';
      out += '  <desc>Lagen: CUT_OD rood, CUT_ID blauw, CUT_HOLES groen, REF_PCD geel. Eenheden zijn millimeters.</desc>\n';

      out += '  <g id="CUT_OD" data-layer="CUT_OD" data-cut="true" stroke="#ff0000" fill="none" stroke-width="0.2">\n';
      if (it.shape === 'circle') {
        out += '    <circle cx="' + num(cx, 6) + '" cy="' + num(cy, 6) + '" r="' + num(it.od / 2, 6) + '" />\n';
      } else {
        out += '    <path d="' + escXml(outerPathForItem(it, cx, cy, 1)) + '" />\n';
      }
      out += '  </g>\n';

      out += '  <g id="CUT_ID" data-layer="CUT_ID" data-cut="true" stroke="#0066ff" fill="none" stroke-width="0.2">\n';
      if (it.innerShape === 'circle') {
        out += '    <circle cx="' + num(cx, 6) + '" cy="' + num(cy, 6) + '" r="' + num(it.innerDia / 2, 6) + '" />\n';
      } else {
        out += '    <path d="' + escXml(innerPathForItem(it, cx, cy, 1)) + '" />\n';
      }
      out += '  </g>\n';

      if (holes.length) {
        out += '  <g id="CUT_HOLES" data-layer="CUT_HOLES" data-cut="true" stroke="#00a651" fill="none" stroke-width="0.2">\n';

        holes.forEach(function (hole) {
          out += '    <circle cx="' + num(cx + hole.x, 6) + '" cy="' + num(cy + hole.y, 6) + '" r="' + num(hole.r, 6) + '" />\n';
        });

        out += '  </g>\n';

        out += '  <g id="REF_PCD" data-layer="REF_PCD" data-cut="false" stroke="#f0b400" fill="none" stroke-width="0.2" stroke-dasharray="4 3">\n';
        out += '    <circle cx="' + num(cx, 6) + '" cy="' + num(cy, 6) + '" r="' + num(it.pcd / 2, 6) + '" />\n';
        out += '  </g>\n';
      }

      out += '</svg>';

      return out;
    }

    function bindEvents() {
      if (els.variant) {
        els.variant.addEventListener('change', applyVariant);
      }

      if (els.addItemBtn) {
        els.addItemBtn.addEventListener('click', function () {
          addItem();
        });
      }

      if (els.calcBtn) {
        els.calcBtn.addEventListener('click', calculatePrice);
      }

      if (els.dxfBtn) {
        els.dxfBtn.addEventListener('click', function () {
          var it = readActiveItemForExport();
          if (!it) return;

          var dxf = generateLiveGasketDXF(it);
          if (dxf) downloadText(dxf, 'application/dxf', exportFilename(it, 'dxf'));
        });
      }

      if (els.svgBtn) {
        els.svgBtn.addEventListener('click', function () {
          var it = readActiveItemForExport();
          if (!it) return;

          var svg = generateLiveGasketSVG(it);
          if (svg) downloadText(svg, 'image/svg+xml', exportFilename(it, 'svg'));
        });
      }
    }

    updateStaticCopy();
    addItem();
    applyVariant();
    bindEvents();
  }
})();
