/* Lampa Ultra Probe v0.1 — transparent stream quality tester for Samsung Tizen.
   No torrents, no backend, no bypass of provider access controls.
   Configure a direct HTTPS .m3u8 or .mp4 URL in Settings > Ultra Probe.
*/
(function () {
  'use strict';
  if (window.lampa_ultra_probe_loaded) return;
  window.lampa_ultra_probe_loaded = true;

  var KEY = 'ultra_probe_stream_url';
  var initialized = false;
  function toast(text) { if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(text); }
  function direct(url) { return /^https:\/\//i.test(url) && /\.(m3u8|mp4)(?:[?#]|$)/i.test(url); }
  function title(movie) { return movie && (movie.title || movie.name || movie.original_title || movie.original_name) || 'Ultra Probe'; }
  function inspect(url, callback) {
    if (/\.mp4(?:[?#]|$)/i.test(url)) {
      callback(null, [{ url: url, label: 'MP4 — разрешение не определено', height: 0 }]);
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 12000;
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status < 200 || xhr.status >= 300) {
        callback('Не удалось прочитать HLS (HTTP ' + xhr.status + '). Возможно, CORS или защита источника.');
        return;
      }
      var manifest = xhr.responseText || '';
      if (manifest.indexOf('#EXTM3U') !== 0) { callback('Ответ не похож на плейлист HLS.'); return; }
      var lines = manifest.replace(/\r/g, '').split('\n');
      var variants = [];
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('#EXT-X-STREAM-INF:') !== 0) continue;
        var resolution = /RESOLUTION=(\d+)x(\d+)/i.exec(lines[i]);
        var bandwidth = /(?:AVERAGE-)?BANDWIDTH=(\d+)/i.exec(lines[i]);
        var child = '';
        for (var j = i + 1; j < lines.length; j++) {
          if (!lines[j].trim()) continue;
          if (lines[j].charAt(0) !== '#') child = lines[j].trim();
          break;
        }
        if (!child) continue;
        var height = resolution ? parseInt(resolution[2], 10) : 0;
        var width = resolution ? parseInt(resolution[1], 10) : 0;
        var label = resolution ? (width + '×' + height) : 'Разрешение неизвестно';
        if (bandwidth) label += ' · ~' + (parseInt(bandwidth[1], 10) / 1000000).toFixed(1) + ' Мбит/с';
        var absolute;
        try { absolute = new URL(child, url).href; } catch (e) { continue; }
        if (!/^https:\/\//i.test(absolute)) continue;
        variants.push({ url: absolute, label: label, height: height });
      }
      variants.sort(function(a, b) { return b.height - a.height; });
      if (!variants.length) {
        callback(null, [{ url: url, label: 'HLS — один поток, разрешение не указано', height: 0 }]);
      } else callback(null, variants);
    };
    xhr.onerror = function () { callback('Сетевой запрос блокирован или источник недоступен (возможно CORS).'); };
    xhr.ontimeout = function () { callback('Источник не ответил за 12 секунд.'); };
    try { xhr.send(); } catch (e) { callback('Ошибка запроса: ' + e.message); }
  }
  function play(variant, movie) {
    Lampa.Player.play({ url: variant.url, title: title(movie) + ' / ' + variant.label, card: movie || {} });
  }
  function open(movie) {
    var url = String(Lampa.Storage.get(KEY, '') || '').trim();
    if (!direct(url)) {
      toast('Ultra Probe: укажи прямую HTTPS .m3u8 или .mp4 ссылку в Настройках → Ultra Probe');
      return;
    }
    toast('Ultra Probe: читаем доступные варианты качества...');
    inspect(url, function (error, variants) {
      if (error) {
        Lampa.Select.show({
          title: 'Ultra Probe: проверка недоступна',
          items: [{ title: 'Запустить поток напрямую', subtitle: error, url: url }],
          onSelect: function (item) { play({ url: item.url, label: 'качество не проверено' }, movie); }
        });
        return;
      }
      Lampa.Select.show({
        title: 'Ultra Probe · реальные варианты HLS',
        items: variants.map(function (variant) {
          return { title: variant.label, subtitle: variant.height >= 1440 ? 'Высокое разрешение в манифесте' : 'Данные HLS манифеста', variant: variant };
        }),
        onSelect: function (item) { play(item.variant, movie); }
      });
    });
  }
  function init() {
    if (initialized || !window.Lampa || !Lampa.SettingsApi) return;
    initialized = true;
    Lampa.SettingsApi.addComponent({ component: 'ultra_probe', name: 'Ultra Probe', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4"/></svg>' });
    Lampa.SettingsApi.addParam({
      component: 'ultra_probe',
      param: { name: KEY, type: 'input', default: '', placeholder: 'https://example.org/master.m3u8' },
      field: { name: 'Прямая HTTPS ссылка HLS / MP4', description: 'Ссылка на доступный тебе видеопоток. Плагин не обходит подписки и ограничения.' }
    });
    Lampa.Listener.follow('full', function (event) {
      if (event.type !== 'complite' || !event.data || !event.data.movie || !window.$) return;
      var view = event.object && event.object.activity && event.object.activity.render ? event.object.activity.render() : null;
      if (!view || view.find('.view--ultra-probe').length) return;
      var button = $('<div class="full-start__button selector view--ultra-probe" data-subtitle="HLS / 4K test"><span>Ultra Probe</span></div>');
      button.on('hover:enter', function () { open(event.data.movie); });
      var buttons = view.find('.full-start__buttons');
      if (buttons.length) buttons.append(button);
    });
    window.LampaUltraProbe = { version: '0.1', inspect: inspect, open: open };
    toast('Ultra Probe установлен. Добавь ссылку в настройках.');
  }
  if (window.appready) init();
  else if (window.Lampa && Lampa.Listener) Lampa.Listener.follow('app', function (event) { if (event.type === 'ready') init(); });
})();