console.debug('Utils loaded!');
const $u = (() => {
    class Xorshift {
        x = 1;
        y = 0;
        z = 0;
        w = 0;
        constructor(seed = Date.now()) {
            this.x = seed;
            this.y = 362436069;
            this.z = 521288629;
            this.w = 88675121;
        }
        next() {
            let t = this.x ^ (this.x << 11);
            this.x = this.y;
            this.y = this.z;
            this.z = this.w;
            this.w = this.w ^ (this.w >> 19) ^ (t ^ (t >> 8));
            return this.w / 2 ** 31; // 2^32-1
        }
    }
    function Random(seed = 0) {
        const x = new Xorshift(seed);
        return (min = 0, max = 1) => {
            const r = x.next();
            return min + (max - min) * r;
        };
    }
    const random = Random(Date.now());
    const storagePrefix = '_0x_monkey:';
    const storage = {
        get(key, defaultValue) {
            const _key = storagePrefix + key;
            let v = defaultValue;
            try {
                const s = localStorage.getItem(_key);
                if (s) {
                    v = JSON.parse(s);
                }
            }
            catch (error) {
                console.warn(`Parse storage ${_key} failed`, error);
            }
            return v;
        },
        set(key, value) {
            const _key = storagePrefix + key;
            const v = JSON.stringify(value);
            localStorage.setItem(_key, v);
        },
    };
    const $u = {
        sleep(ts = 100) {
            return new Promise((resolve) => setTimeout(resolve, ts));
        },
        random,
        storage,
        sleepRandom(min = 100, max = 1000) {
            return $u.sleep(random(min, max));
        },
        async waitElement(selector) {
            return $u.when(() => document.querySelector(selector));
        },
        /**
         *
         * @template T
         * @param {() => T } checker
         * @param {number} timeout  default is 10 * 1000 (10s).
         * @returns {Promise<T>}
         */
        async when(checker, timeout = 10 * 1000) {
            const start = Date.now();
            while (Date.now() - start < timeout) {
                const pass = await checker();
                if (pass)
                    return pass;
                await $u.sleep(100);
            }
            throw new Error('Timeout');
        },
        /**
         * @param {MatcherConfig[]} configs
         * @param {string} str
         */
        stringMatcher(str, configs) {
            const hit = configs.find((n) => n.test.test(str));
            return hit?.handler();
        },
        /**
         * @param {() => any} fn
         */
        run(fn) {
            fn();
        },
        addStyle(style) {
            const $style = document.createElement('style');
            $style.innerText = style;
            document.head.appendChild($style);
        },
    };
    return $u;
})();
globalThis.$u = $u;
