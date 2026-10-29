
/* Lampa Ultra: minimal compatibility diagnostic v0.3 */
(function () {
  'use strict';

  if (window.lampa_ultra_test_v03) return;
  window.lampa_ultra_test_v03 = true;

  function init() {
    if (!window.Lampa ||
        !Lampa.SettingsApi ||
        !Lampa.SettingsApi.addComponent) return;

    if (window.lampa_ultra_test_initialized) return;
    window.lampa_ultra_test_initialized = true;

    try {
      Lampa.SettingsApi.addComponent({
        component: 'ultra_test',
        name: 'Ultra Test',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
      });

      Lampa.SettingsApi.addParam({
        component: 'ultra_test',
        param: {
          name: 'ultra_test_info',
          type: 'static'
        },
        field: {
          name: 'Ultra Test v0.3',
          description: 'JavaScript loaded and Lampa SettingsApi initialized.'
        }
      });

      if (Lampa.Noty && Lampa.Noty.show) {
        Lampa.Noty.show('Ultra Test: plugin loaded');
      }

    } catch (e) {
      window.lampa_ultra_test_error =
        String(e && e.message || e);

      if (window.Lampa && Lampa.Noty && Lampa.Noty.show) {
        Lampa.Noty.show('Ultra Test: init error');
      }
    }
  }

  if (window.appready) {
    init();
  } else if (window.Lampa &&
             Lampa.Listener &&
             Lampa.Listener.follow) {
    Lampa.Listener.follow('app', function (event) {
      if (event.type === 'ready') init();
    });
  }
})();
