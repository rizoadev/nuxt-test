export default {
    server: {
        port: 3000, // default: 3000
        host: '0.0.0.0' // default: localhost
    },
    watchers: {
        webpack: {
            ignored: ['node_modules/**'], // 'files/**/*.js',
            aggregateTimeout: 300,
            poll: 1000
        }
    },
    env: {
        // API:
        SITE_NAME: 'Jorjoran',
        color: '#e84393',
        CDN_THUMB: 'https://jorjoranth.knvrz.com', // 'https://jorjoranthumb.b-cdn.net',
        CDN_FULL: 'https://jorjoranimg.knvrz.com' // 'https://jorjoran.r.worldssl.net',
    },
    mode: 'spa',
    target: 'server', // static
    head: {
        title: 'Dashboard v1', // process.env.npm_package_name || '',
        meta: [
            { charset: 'utf-8' },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1'
            },
            {
                hid: 'description',
                name: 'description',
                content: process.env.npm_package_description || ''
            }
        ],
        link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
    },
    loading: { color: '#2ecc71', throttle: 0 },
    css: [],
    plugins: [],
    components: false,
    buildModules: ['@nuxtjs/axios', 'nuxt-composition-api'],
    modules: ['nuxt-polyfill'],
    axios: { headers: { 'content-type': 'text/plain' } },
    content: {
        liveEdit: false
    },
    polyfill: {
        features: [
            /* 
                Feature without detect:
 
                Note: 
                  This is not recommended for most polyfills
                  because the polyfill will always be loaded, parsed and executed.
            */
            {
                require: 'url-polyfill' // NPM package or require path of file
            },

            /* 
                Feature with detect:
 
                Detection is better because the polyfill will not be 
                loaded, parsed and executed if it's not necessary.
            */
            {
                require: 'intersection-observer',
                detect: () => 'IntersectionObserver' in window
            },

            /*
                Feature with detect & install:
 
                Some polyfills require a installation step
                Hence you could supply a install function which accepts the require result
            */
            {
                require: 'smoothscroll-polyfill',

                // Detection found in source: https://github.com/iamdustan/smoothscroll/blob/master/src/smoothscroll.js
                detect: () =>
                    'scrollBehavior' in document.documentElement.style &&
                    window.__forceSmoothScrollPolyfill__ !== true,

                // Optional install function called client side after the package is required:
                install: (smoothscroll) => smoothscroll.polyfill()
            }
        ]
    },
    generate: {
        interval: 2000
    },
    build: {
        analyze: false,
        // extend(config, ctx) {},
        extend(config, ctx) {
            if (ctx && ctx.isClient) {
                config.optimization.splitChunks.maxSize = 128000;
            }
        },
        extractCSS: true
    }
};
