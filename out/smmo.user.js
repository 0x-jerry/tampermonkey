"use strict";
// ==UserScript==
// @name         Simple MMO
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/smmo.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/smmo.user.js
// @description  try to save the simple mmo world!
// @author       x.jerry.wang@gmail.com
// @match        https://web.simple-mmo.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=simple-mmo.com
// @require      ./utils.js
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==
$u.run(async () => {
    'use strict';
    // @ts-ignore
    GM_addStyle(`
    .agent-action {
      border: 1px solid red;
    }
  `);
    // ---------
    class MimicAgent {
        #playing = false;
        get playing() {
            return this.#playing;
        }
        actions = [];
        #handler = -1;
        detectAction() {
            const actions = this.actions.filter((action) => action.check());
            if (!actions.length)
                return null;
            const action = actions.reduce((prev, cur) => (cur.priority > prev.priority ? cur : prev));
            return action;
        }
        async doze() {
            const thinkChanceList = [
                {
                    chance: 60,
                    data: { min: 800, max: 2000 },
                },
                {
                    chance: 30,
                    data: { min: 2000, max: 4000 },
                },
                {
                    chance: 10,
                    data: { min: 4000, max: 6000 },
                },
            ];
            const data = this.throwDice(thinkChanceList);
            await $u.sleepRandom(data.min, data.max);
        }
        /**
         *
         * @template T
         * @param {{chance: number, data: T}[]} chanceList
         */
        throwDice(chanceList) {
            let value = 0;
            const chances = chanceList.map((n) => {
                value = +n.chance;
                return value;
            });
            const total = value;
            const randomValue = $u.random(0, total);
            const idx = chances.findIndex((chanceLevel) => randomValue < chanceLevel);
            return chanceList[idx].data;
        }
        continue() {
            clearTimeout(this.#handler);
            if (!this.playing) {
                return;
            }
            const checkGap = $u.random(300, 1000);
            this.#handler = window.setTimeout(async () => {
                const action = this.detectAction();
                if (action) {
                    this.highlight(action.check());
                    await this.doze();
                    const ts = new Date().toLocaleTimeString();
                    try {
                        console.debug(ts, 'Execute action:', action.name);
                        action.action();
                    }
                    catch (error) {
                        console.debug(ts, 'Something wrong when execute action:', action.name, error);
                    }
                }
                this.continue();
            }, checkGap);
        }
        #enabledStateKey = 'agent:enabled';
        init() {
            const enabled = localStorage.getItem(this.#enabledStateKey);
            if (enabled) {
                this.start();
            }
        }
        start() {
            localStorage.setItem(this.#enabledStateKey, 'true');
            this.#playing = true;
            this.continue();
        }
        #actionEl;
        highlight(el) {
            const cls = 'agent-action';
            if (this.#actionEl) {
                this.#actionEl?.classList.remove(cls);
            }
            this.#actionEl = el;
            this.#actionEl?.classList.add(cls);
        }
        stop() {
            localStorage.removeItem(this.#enabledStateKey);
            this.#playing = false;
            clearTimeout(this.#handler);
        }
    }
    // -------
    const currentPage = new URL(location.href);
    function isVisible(el) {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && _checkVisibility();
        function _checkVisibility() {
            let p = el;
            while (p) {
                if (p.style.opacity == '0')
                    return false;
                if (p.style.display == 'none')
                    return false;
                // @ts-ignore
                p = p.parentElement;
            }
            return true;
        }
    }
    function getElByContent(text, type) {
        const elements = Array.from(document.querySelectorAll(type));
        return elements.find((el) => isVisible(el) && el.textContent?.trim() === text);
    }
    function getButtonByContent(text) {
        return getElByContent(text, 'button');
    }
    const actions = {
        verify: {
            name: 'Verify',
            priority: Infinity,
            check() {
                return getElByContent("I'm a person! Promise!", 'a');
            },
            action() {
                throw new Error('Detected verify action, stopped!');
            },
        },
        takeStep: createAction('Step', 99, ['Take a step']),
        craft: createAction('Craft', 999, ['Salvage', 'Catch', 'Grab', 'Attack', 'Mine', 'Chop']),
        gather: createAction('Gather', 99, ['Gather', 'Press here to gather']),
        endGather: createAction('End gather', 999, ['Press here to close']),
        attack: createAction('Attack', 99, ['Attack']),
        endAttack: createAction('End Attack', 999, ['End Battle']),
    };
    function createAction(name, priority, btnTexts) {
        function getActionEl() {
            for (const content of btnTexts) {
                let el;
                const btn = getButtonByContent(content);
                if (btn && btn) {
                    el = btn.disabled ? null : btn;
                }
                else {
                    const link = getElByContent(content, 'a');
                    el = link;
                }
                if (el) {
                    return el;
                }
            }
        }
        const action = {
            name,
            priority,
            check() {
                return getActionEl();
            },
            action() {
                const el = getActionEl();
                if (!el) {
                    return;
                }
                const rect = el?.getBoundingClientRect();
                const fakeEvent = new MouseEvent('click', {
                    clientX: Math.round($u.random(rect.x, rect.x + rect.width)),
                    clientY: Math.round($u.random(rect.y, rect.y + rect.height)),
                });
                el?.dispatchEvent(fakeEvent);
            },
        };
        return action;
    }
    const travelPage = {
        check() {
            return currentPage.pathname === '/travel';
        },
        actions: [actions.verify, actions.takeStep, actions.craft],
    };
    const attackPage = {
        check() {
            return currentPage.pathname.startsWith('/npcs/attack/');
        },
        actions: [actions.verify, actions.attack, actions.endAttack],
    };
    const craftItemPage = {
        check() {
            return currentPage.pathname.startsWith('/crafting/material/gather/');
        },
        actions: [actions.verify, actions.gather, actions.endGather],
    };
    const pages = [travelPage, attackPage, craftItemPage];
    const page = pages.find((n) => n.check());
    if (!page) {
        return;
    }
    const agent = new MimicAgent();
    agent.actions = page.actions;
    agent.init();
    // ---- ui
    const $c = document.createElement('div');
    $c.style.position = 'fixed';
    $c.style.top = '50%';
    $c.style.right = '0';
    $c.style.transform = 'translate(0, -50%)';
    $c.style.background = 'white';
    $c.style.border = '1px solid #eee';
    $c.style.padding = '20px';
    document.body.append($c);
    const $enableBtn = document.createElement('button');
    $c.append($enableBtn);
    const updateBtnText = () => ($enableBtn.textContent = agent.playing ? 'Enabled' : 'Disabled');
    updateBtnText();
    $enableBtn.onclick = () => {
        if (agent.playing) {
            agent.stop();
        }
        else {
            agent.start();
        }
        updateBtnText();
    };
});
