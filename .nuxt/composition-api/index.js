import Vue from 'vue';
import CompositionApi, { ref, computed, shallowRef, onServerPrefetch, isRef, getCurrentInstance, toRefs, watch, reactive, onBeforeMount } from '@vue/composition-api';
export { computed, createComponent, createElement, getCurrentInstance, inject, isReactive, isRef, markRaw, nextTick, onActivated, onBeforeMount, onBeforeUnmount, onBeforeUpdate, onDeactivated, onErrorCaptured, onMounted, onServerPrefetch, onUnmounted, onUpdated, provide, reactive, ref, set, shallowReactive, shallowRef, toRaw, toRef, toRefs, triggerRef, unref, watch, watchEffect } from '@vue/composition-api';
import defu from 'defu';

const globalNuxt = '$nuxt'.includes('options')
    ? '$nuxt'
    : '$nuxt';
const globalContext = '__NUXT__'.includes('options')
    ? '__NUXT__'
    : '__NUXT__';
const isFullStatic = 'false'.includes('options')
    ? false
    : 'false' === 'true';

function validateKey(key) {
    if (!key) {
        throw new Error("You must provide a key. You can have it generated automatically by adding 'nuxt-composition-api/babel' to your Babel plugins.");
    }
}

function getValue(value) {
    if (value instanceof Function)
        return value();
    return value;
}
let data = {};
function setSSRContext(ssrContext) {
    data = Object.assign({}, {});
    ssrContext.nuxt.ssrRefs = data;
}
const isProxyable = (val) => val && typeof val === 'object';
const sanitise = (val) => (val && JSON.parse(JSON.stringify(val))) || val;
const ssrValue = (value, key) => {
    var _a, _b, _c, _d;
    if (process.client) {
        if (process.env.NODE_ENV === 'development' && ((_a = window[globalNuxt]) === null || _a === void 0 ? void 0 : _a.context.isHMR)) {
            return getValue(value);
        }
        return (_d = (_c = (_b = window[globalContext]) === null || _b === void 0 ? void 0 : _b.ssrRefs) === null || _c === void 0 ? void 0 : _c[key]) !== null && _d !== void 0 ? _d : getValue(value);
    }
    return getValue(value);
};
/**
 * `ssrRef` will automatically add ref values to `window.__NUXT__` on SSR if they have been changed from their initial value. It can be used outside of components, such as in shared utility functions, and it supports passing a factory function that will generate the initial value of the ref. **At the moment, an `ssrRef` is only suitable for one-offs, unless you provide your own unique key.**
 * @param value This can be an initial value or a factory function that will be executed on server-side to get the initial value.
 * @param key Under the hood, `ssrRef` requires a key to ensure that the ref values match between client and server. If you have added `nuxt-composition-api` to your `buildModules`, this will be done automagically by an injected Babel plugin. If you need to do things differently, you can specify a key manually or add `nuxt-composition-api/babel` to your Babel plugins.
 * @example
  ```ts
  import { ssrRef } from 'nuxt-composition-api'

  const val = ssrRef('')

  // When hard-reloaded, `val` will be initialised to 'server set'
  if (process.server) val.value = 'server set'

  // When hard-reloaded, the result of myExpensiveSetterFunction() will
  // be encoded in nuxtState and used as the initial value of this ref.
  // If client-loaded, the setter function will run to come up with initial value.
  const val2 = ssrRef(myExpensiveSetterFunction)
  ```
 */
const ssrRef = (value, key) => {
    validateKey(key);
    const val = ssrValue(value, key);
    if (process.client)
        return ref(val);
    const _ref = ref(val);
    if (value instanceof Function)
        data[key] = sanitise(val);
    const getProxy = (observable) => new Proxy(observable, {
        get(target, prop) {
            if (isProxyable(target[prop]))
                return getProxy(target[prop]);
            return Reflect.get(target, prop);
        },
        set(obj, prop, val) {
            const result = Reflect.set(obj, prop, val);
            data[key] = sanitise(_ref.value);
            return result;
        },
    });
    const proxy = computed({
        get: () => (isProxyable(_ref.value) ? getProxy(_ref.value) : _ref.value),
        set: v => {
            data[key] = sanitise(v);
            _ref.value = v;
        },
    });
    return proxy;
};
/**
 * This helper creates a [`shallowRef`](https://vue-composition-api-rfc.netlify.app/api.html#shallowref) (a ref that tracks its own .value mutation but doesn't make its value reactive) that is synced between client & server.
 * @param value This can be an initial value or a factory function that will be executed on server-side to get the initial value.
 * @param key Under the hood, `shallowSsrRef` requires a key to ensure that the ref values match between client and server. If you have added `nuxt-composition-api` to your `buildModules`, this will be done automagically by an injected Babel plugin. If you need to do things differently, you can specify a key manually or add `nuxt-composition-api/babel` to your Babel plugins.

 * @example
  ```ts
  import { shallowSsrRef, onMounted } from 'nuxt-composition-api'

  const shallow = shallowSsrRef({ v: 'init' })
  if (process.server) shallow.value = { v: 'changed' }

  // On client-side, shallow.value will be { v: changed }
  onMounted(() => {
    // This and other changes outside of setup won't trigger component updates.
    shallow.value.v = 'Hello World'
  })
  ```
 */
const shallowSsrRef = (value, key) => {
    var _a, _b, _c, _d;
    validateKey(key);
    if (process.client) {
        if (process.env.NODE_ENV === 'development' && ((_a = window[globalNuxt]) === null || _a === void 0 ? void 0 : _a.context.isHMR)) {
            return shallowRef(getValue(value));
        }
        return shallowRef((_d = (_c = (_b = window[globalContext]) === null || _b === void 0 ? void 0 : _b.ssrRefs) === null || _c === void 0 ? void 0 : _c[key]) !== null && _d !== void 0 ? _d : getValue(value));
    }
    let _val = getValue(value);
    if (value instanceof Function) {
        data[key] = sanitise(_val);
    }
    return computed({
        get: () => _val,
        set: v => {
            data[key] = sanitise(v);
            _val = v;
        },
    });
};
/**
 * `ssrPromise` runs a promise on the server and serialises the result as a resolved promise for the client. It needs to be run within the `setup()` function but note that it returns a promise which will require special handling. (For example, you cannot just return a promise from setup and use it in the template.)
 * @param value This can be an initial value or a factory function that will be executed on server-side to get the initial value.
 * @param key Under the hood, `ssrPromise` requires a key to ensure that the ref values match between client and server. If you have added `nuxt-composition-api` to your `buildModules`, this will be done automagically by an injected Babel plugin. If you need to do things differently, you can specify a key manually or add `nuxt-composition-api/babel` to your Babel plugins.
 * @example

    ```ts
    import {
      defineComponent,
      onBeforeMount,
      ref,
      ssrPromise,
    } from 'nuxt-composition-api'

    export default defineComponent({
      setup() {
        const _promise = ssrPromise(async () => myAsyncFunction())
        const resolvedPromise = ref(null)

        onBeforeMount(async () => {
          resolvedPromise.value = await _promise
        })

        return {
          // On the server, this will be null until the promise resolves.
          // On the client, if server-rendered, this will always be the resolved promise.
          resolvedPromise,
        }
      },
    })
    ```
 */
const ssrPromise = (value, key) => {
    validateKey(key);
    const val = ssrValue(value, key);
    if (process.client)
        return Promise.resolve(val);
    onServerPrefetch(async () => {
        data[key] = sanitise(await val);
    });
    return val;
};

/**
 * You can create reactive values that depend on asynchronous calls with `useAsync`.
 * On the server, this helper will inline the result of the async call in your HTML and automatically inject them into your client code. Much like `asyncData`, it _won't_ re-run these async calls client-side.
 *
 * However, if the call hasn't been carried out on SSR (such as if you have navigated to the page after initial load), it returns a `null` ref that is filled with the result of the async call when it resolves.
 *
 * **At the moment, `useAsync` is only suitable for one-offs, unless you provide your own unique key.**
 * @param cb The async function that will populate the ref this function returns.
 * @param key Under the hood, `useAsync` requires a key to ensure that the ref values match between client and server. If you have added `nuxt-composition-api` to your `buildModules`, this will be done automagically by an injected Babel plugin. If you need to do things differently, you can specify a key manually or add `nuxt-composition-api/babel` to your Babel plugins.
 *
 * @example
  ```ts
  import { defineComponent, useAsync, computed } from 'nuxt-composition-api'
  import axios from 'axios'

  export default defineComponent({
    setup() {
      const posts = useAsync(() => axios.get('/api/posts'))

      return { posts }
    },
  })
  ```
 */
const useAsync = (cb, key) => {
    var _a;
    validateKey(key);
    const _ref = isRef(key) ? key : ssrRef(null, key);
    if (!_ref.value ||
        (process.env.NODE_ENV === 'development' &&
            process.client && ((_a = window[globalNuxt]) === null || _a === void 0 ? void 0 : _a.context.isHMR))) {
        const p = cb();
        if (p instanceof Promise) {
            if (process.server) {
                onServerPrefetch(async () => {
                    _ref.value = (await p);
                });
            }
            else {
                // eslint-disable-next-line
                p.then(res => (_ref.value = res));
            }
        }
        else {
            _ref.value = p;
        }
    }
    return _ref;
};

function assign(target, source) {
    Object.entries(source).forEach(([key, value]) => {
        Vue.set(target, key, value);
    });
    return target;
}
function createEmptyMeta() {
    return {
        __dangerouslyDisableSanitizers: [],
        __dangerouslyDisableSanitizersByTagID: {},
        title: undefined,
        titleTemplate: undefined,
        htmlAttrs: {},
        headAttrs: {},
        bodyAttrs: {},
        base: undefined,
        meta: [],
        link: [],
        style: [],
        script: [],
        noscript: [],
        changed: undefined,
        afterNavigation: undefined,
    };
}
const getHeadOptions = (options) => {
    const _head = options.head instanceof Function
        ? reactive({})
        : reactive(options.head);
    const head = options.head instanceof Function
        ? () => defu(_head, options.head())
        : () => _head;
    return { _head, head };
};
/**
 * `useMeta` lets you interact directly with [`head()` properties](https://nuxtjs.org/api/pages-head/) in `setup`. **Make sure you set `head: {}` in your component options.**
 * @example
    ```ts
    import { defineComponent, useMeta, computed } from 'nuxt-composition-api'

    export default defineComponent({
      head: {},
      setup() {
        const { title } = useMeta()
        title.value = 'My page'
      })
    })
    ```
 * @param init Whatever defaults you want to set for `head` properties.
 */
const useMeta = (init) => {
    const vm = getCurrentInstance();
    if (!vm)
        throw new Error('useMeta must be called within a component.');
    if (!('_head' in vm.$options))
        throw new Error('In order to enable `useMeta`, please make sure you include `head: {}` within your component definition, and you are using the `defineComponent` exported from nuxt-composition-api.');
    const { _head } = vm.$options;
    assign(_head, createEmptyMeta());
    assign(_head, init || {});
    const refs = toRefs(_head);
    if (process.client)
        watch(Object.values(refs), vm.$meta().refresh, { immediate: true });
    return refs;
};

/**
 * If you want to enable `useMeta`, make sure to include `head: {}` in your component definition.
 * @example
  ```ts
  import { defineComponent } from 'nuxt-composition-api'

  export default defineComponent({
    head: {},
    setup() {
      ...
    }
  })
  ```
 */
const defineComponent = (options) => {
    if (!('head' in options))
        return options;
    return {
        ...options,
        ...getHeadOptions(options),
    };
};

/**
 * @deprecated
 * Recommend using `useContext` instead
 */
const withContext = (callback) => {
    const vm = getCurrentInstance();
    if (!vm)
        throw new Error('This must be called within a setup function.');
    callback(vm[globalNuxt].context);
};
/**
 * `useContext` will return the Nuxt context.
 * @example
  ```ts
  import { defineComponent, ref, useContext } from 'nuxt-composition-api'

  export default defineComponent({
    setup() {
      const { store } = useContext()
      store.dispatch('myAction')
    },
  })
  ```
 */
const useContext = () => {
    const vm = getCurrentInstance();
    if (!vm)
        throw new Error('This must be called within a setup function.');
    return {
        ...vm[globalNuxt].context,
        route: computed(() => vm.$route),
        query: computed(() => vm.$route.query),
        from: computed(() => vm.$route.redirectedFrom),
        params: computed(() => vm.$route.params),
    };
};

function normalizeError(err) {
    let message;
    if (!(err.message || typeof err === 'string')) {
        try {
            message = JSON.stringify(err, null, 2);
        }
        catch (e) {
            message = `[${err.constructor.name}]`;
        }
    }
    else {
        message = err.message || err;
    }
    return {
        ...err,
        message,
        statusCode: err.statusCode ||
            err.status ||
            (err.response && err.response.status) ||
            500,
    };
}
const fetches = new WeakMap();
const fetchPromises = new Map();
const isSsrHydration = (vm) => { var _a, _b, _c; return (_c = (_b = (_a = vm.$vnode) === null || _a === void 0 ? void 0 : _a.elm) === null || _b === void 0 ? void 0 : _b.dataset) === null || _c === void 0 ? void 0 : _c.fetchKey; };
const nuxtState = process.client && window[globalContext];
function registerCallback(vm, callback) {
    const callbacks = fetches.get(vm) || [];
    fetches.set(vm, [...callbacks, callback]);
}
async function callFetches() {
    const fetchesToCall = fetches.get(this);
    if (!fetchesToCall)
        return;
    this[globalNuxt].nbFetching++;
    this.$fetchState.pending = true;
    this.$fetchState.error = null;
    this._hydrated = false;
    let error = null;
    const startTime = Date.now();
    try {
        await Promise.all(fetchesToCall.map(fetch => {
            if (fetchPromises.has(fetch))
                return fetchPromises.get(fetch);
            const promise = Promise.resolve(fetch(this)).finally(() => fetchPromises.delete(fetch));
            fetchPromises.set(fetch, promise);
            return promise;
        }));
    }
    catch (err) {
        error = normalizeError(err);
    }
    const delayLeft = (this._fetchDelay || 0) - (Date.now() - startTime);
    if (delayLeft > 0) {
        await new Promise(resolve => setTimeout(resolve, delayLeft));
    }
    this.$fetchState.error = error;
    this.$fetchState.pending = false;
    this.$fetchState.timestamp = Date.now();
    this.$nextTick(() => this[globalNuxt].nbFetching--);
}
const setFetchState = (vm) => {
    vm.$fetchState =
        vm.$fetchState ||
            Vue.observable({
                error: null,
                pending: false,
                timestamp: 0,
            });
};
const loadFullStatic = (vm) => {
    // Check if component has been fetched on server
    const { fetchOnServer } = vm.$options;
    const fetchedOnServer = typeof fetchOnServer === 'function'
        ? fetchOnServer.call(vm) !== false
        : fetchOnServer !== false;
    const nuxt = vm.$nuxt;
    if (!fetchedOnServer || (nuxt === null || nuxt === void 0 ? void 0 : nuxt.isPreview) || !(nuxt === null || nuxt === void 0 ? void 0 : nuxt._pagePayload)) {
        return;
    }
    vm._hydrated = true;
    nuxt._payloadFetchIndex = (nuxt._payloadFetchIndex || 0) + 1;
    vm._fetchKey = nuxt._payloadFetchIndex;
    const data = nuxt._pagePayload.fetch[vm._fetchKey];
    // If fetch error
    if (data && data._error) {
        vm.$fetchState.error = data._error;
        return;
    }
    // Merge data
    for (const key in data) {
        Vue.set(vm.$data, key, data[key]);
    }
};
async function serverPrefetch(vm) {
    if (!vm._fetchOnServer)
        return;
    // Call and await on $fetch
    setFetchState(vm);
    try {
        await callFetches.call(vm);
    }
    catch (err) {
        vm.$fetchState.error = normalizeError(err);
    }
    vm.$fetchState.pending = false;
    // Define an ssrKey for hydration
    vm._fetchKey = vm.$ssrContext.nuxt.fetch.length;
    // Add data-fetch-key on parent element of Component
    if (!vm.$vnode.data)
        vm.$vnode.data = {};
    const attrs = (vm.$vnode.data.attrs = vm.$vnode.data.attrs || {});
    attrs['data-fetch-key'] = vm._fetchKey;
    // Add to ssrContext for window.__NUXT__.fetch
    vm.$ssrContext.nuxt.fetch.push(vm.$fetchState.error
        ? { _error: vm.$fetchState.error }
        : JSON.parse(JSON.stringify(vm._data)));
}
/**
 * Versions of Nuxt newer than v2.12 support a [custom hook called `fetch`](https://nuxtjs.org/api/pages-fetch/) that allows server-side and client-side asynchronous data-fetching.

 * @param callback The async function you want to run.
 * @example

  ```ts
  import { defineComponent, ref, useFetch } from 'nuxt-composition-api'
  import axios from 'axios'

  export default defineComponent({
    setup() {
      const name = ref('')

      const { fetch, fetchState } = useFetch(async () => {
        name.value = await axios.get('https://myapi.com/name')
      })

      // Manually trigger a refetch
      fetch()

      // Access fetch error, pending and timestamp
      fetchState

      return { name }
    },
  })
  ```
 */
const useFetch = (callback) => {
    var _a;
    const vm = getCurrentInstance();
    if (!vm)
        throw new Error('This must be called within a setup function.');
    registerCallback(vm, callback);
    if (typeof vm.$options.fetchOnServer === 'function') {
        vm._fetchOnServer = vm.$options.fetchOnServer.call(vm) !== false;
    }
    else {
        vm._fetchOnServer = vm.$options.fetchOnServer !== false;
    }
    setFetchState(vm);
    onServerPrefetch(() => serverPrefetch(vm));
    function result() {
        return {
            fetch: vm.$fetch,
            fetchState: vm.$fetchState,
            $fetch: vm.$fetch,
            $fetchState: vm.$fetchState,
        };
    }
    vm._fetchDelay =
        typeof vm.$options.fetchDelay === 'number' ? vm.$options.fetchDelay : 200;
    vm.$fetch = callFetches.bind(vm);
    onBeforeMount(() => !vm._hydrated && callFetches.call(vm));
    if (process.server || !isSsrHydration(vm)) {
        if (isFullStatic)
            onBeforeMount(() => loadFullStatic(vm));
        return result();
    }
    // Hydrate component
    vm._hydrated = true;
    vm._fetchKey = +((_a = vm.$vnode.elm) === null || _a === void 0 ? void 0 : _a.dataset.fetchKey);
    const data = nuxtState.fetch[vm._fetchKey];
    // If fetch error
    if (data && data._error) {
        vm.$fetchState.error = data._error;
        return result();
    }
    onBeforeMount(() => {
        // Merge data
        for (const key in data) {
            try {
                if (key in vm && typeof vm[key] === 'function') {
                    continue;
                }
                Vue.set(vm, key, data[key]);
            }
            catch (e) {
                if (process.env.NODE_ENV === 'development')
                    // eslint-disable-next-line
                    console.warn(`Could not hydrate ${key}.`);
            }
        }
    });
    return result();
};

const globalSetup = new Set();
/**
 * Run a callback function in the global setup function. This should be called from a Nuxt plugin.
 * @param fn The function to run in the setup function. It receives the global props and context.
 * @example
    ```ts
    import { onGlobalSetup } from 'nuxt-composition-api'

    export default () => {
      onGlobalSetup(() => {
        provide('globalKey', true)
      })
    }
    ```
 */
const onGlobalSetup = (fn) => {
    globalSetup.add(fn);
};
/**
 * @private
 */
const globalPlugin = context => {
    const { setup } = context.app;
    context.app.setup = (...args) => {
        let result = {};
        if (setup instanceof Function) {
            result = setup(...args);
        }
        for (const fn of globalSetup) {
            result = { ...result, ...(fn(...args) || {}) };
        }
        return result;
    };
    if (!process.server)
        return;
    if (context.app.context.ssrContext) {
        setSSRContext(context.app.context.ssrContext);
    }
};

const staticPath = '/home/rizoa/Projects/LABS/nuxt-btn/a/.nuxt/static-json';
const staticCache = {};
function writeFile(key, value) {
    if (process.client || !process.static)
        return;
    const { writeFileSync } = process.client
        ? ''
        : require('fs');
    const { join } = process.client ? '' : require('path');
    try {
        writeFileSync(join(staticPath, `${key}.json`), value);
    }
    catch (e) {
        console.log(e);
    }
}
/**
 * You can pre-run expensive functions using `useStatic`.
 *
 * __SSG__
 * If you are generating the whole app (or just prerendering some routes with `nuxt build && nuxt generate --no-build`) the following behaviour will be unlocked:

    1. On generate, the result of a `useStatic` call will be saved to a JSON file and copied into the `/dist` directory.
    2. On hard-reload of a generated page, the JSON will be inlined into the page and cached.
    3. On client navigation to a generated page, this JSON will be fetched - and once fetched it will be cached for subsequent navigations. If for whatever reason this JSON doesn't exist, such as if the page *wasn't* pre-generated, the original factory function will be run on client-side.

  If you are pregenerating some pages in your app note that you may need to increase `generate.interval`. (See [setup instructions](https://composition-api.now.sh/setup.html).)

  *
  * __SSR__
  * If the route is not pre-generated (including in dev mode), then:

    1. On a hard-reload, the server will run the factory function and inline the result in `nuxtState` - so the client won't rerun the API request. The result will be cached between requests.
    2. On client navigation, the client will run the factory function.

  In both of these cases, the return result of `useStatic` is a `null` ref that is filled with the result of the factory function or JSON fetch when it resolves.

 * @param factory The async function that will populate the ref this function returns. It receives the param and keyBase (see below) as parameters.
 * @param param A an optional param (such as an ID) to distinguish multiple API fetches using the same factory function.
 * @param keyBase A key that should be unique across your project. If not provided, this will be auto-generated by `nuxt-composition-api`.
 * @example
  ```ts
  import { defineComponent, useContext, useStatic, computed } from 'nuxt-composition-api'
  import axios from 'axios'

  export default defineComponent({
    setup() {
      const { params } = useContext()
      const id = computed(() => params.value.id)
      const post = useStatic(
        id => axios.get(`https://jsonplaceholder.typicode.com/posts/${id}`),
        id,
        'post'
      )

      return { post }
    },
  })
  ```
 */
const useStatic = (factory, param = ref(''), keyBase) => {
    const key = computed(() => `${keyBase}-${param.value}`);
    const result = ssrRef(null, key.value);
    if (result.value)
        staticCache[key.value] = result.value;
    if (process.client) {
        const onFailure = () => factory(param.value, key.value).then(r => {
            staticCache[key.value] = r;
            result.value = r;
            return;
        });
        watch(key, key => {
            if (key in staticCache) {
                result.value = staticCache[key];
                return;
            }
            /* eslint-disable promise/always-return */
            if (!process.static)
                onFailure();
            else
                fetch(`/${key}.json`)
                    .then(response => {
                    if (!response.ok)
                        throw new Error('Response invalid.');
                    return response.json();
                })
                    .then(json => {
                    staticCache[key] = json;
                    result.value = json;
                })
                    .catch(onFailure);
            /* eslint-enable */
        }, {
            immediate: true,
        });
    }
    else {
        if (key.value in staticCache) {
            result.value = staticCache[key.value];
            return result;
        }
        onServerPrefetch(async () => {
            const [_key, _param] = [key.value, param.value];
            result.value = (await factory(_param, _key));
            staticCache[_key] = result.value;
            writeFile(_key, JSON.stringify(result.value));
        });
    }
    return result;
};

const defineNuxtPlugin = (plugin) => plugin;
const defineNuxtMiddleware = (middleware) => middleware;
const defineNuxtModule = (module) => module;
const defineNuxtServerMiddleware = (serverMiddleware) => serverMiddleware;

Vue.use(CompositionApi);

export { defineComponent, defineNuxtMiddleware, defineNuxtModule, defineNuxtPlugin, defineNuxtServerMiddleware, globalPlugin, onGlobalSetup, setSSRContext, shallowSsrRef, ssrPromise, ssrRef, useAsync, useContext, useFetch, useMeta, useStatic, withContext };
