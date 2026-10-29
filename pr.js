
(function () {
    'use strict';

    try {
        window.ultra_test_v04 = true;
        window.ultra_test_v06 = true;

        if (window.Lampa && Lampa.Noty && typeof Lampa.Noty.show === 'function') {
            Lampa.Noty.show('Ultra Test v0.6 OK');
        }

        console.log('Ultra Test v0.6 loaded');
    } catch (e) {
        console.log('Ultra Test error:', e);
    }
})();
