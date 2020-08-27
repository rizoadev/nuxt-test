

export default () => {
    if (process.server) {
        return;
    }

    const detect = () => 'IntersectionObserver' in window;

    if (detect()) {
        return;
    }

    return new Promise((resolve, reject) => {
        require.ensure([
            "intersection-observer"
        ], function (require) {
            const polyfill = require("intersection-observer");

            resolve();
        });
    });
}