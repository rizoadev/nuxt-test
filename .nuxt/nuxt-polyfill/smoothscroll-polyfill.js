

export default () => {
    if (process.server) {
        return;
    }

    const detect = () =>
                    'scrollBehavior' in document.documentElement.style &&
                    window.__forceSmoothScrollPolyfill__ !== true;

    if (detect()) {
        return;
    }

    return new Promise((resolve, reject) => {
        require.ensure([
            "smoothscroll-polyfill"
        ], function (require) {
            const polyfill = require("smoothscroll-polyfill");

            const install = (smoothscroll) => smoothscroll.polyfill();

            install(polyfill);

            resolve();
        });
    });
}