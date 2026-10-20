/*!
 * TF Widgets — Contact Form v1
 * Встраивание: <script src=".../embed.js" data-id="CLIENT_ID"></script>
 * Конфиг клиента: configs/CLIENT_ID.json (адреса почты клиента в нём НЕТ — он хранится только на сервере)
 * Два вида: форма прямо на странице (там, где стоит код) или плавающая кнопка, открывающая окно с формой.
 * Заявка уходит на сервер TF Widgets, оттуда письмом на почту клиента.
 * Все стили ограничены классом .tfw-cf, чтобы не спорить с темой сайта.
 */
(function () {
    'use strict';
    var VERSION = '1.0.1';
    var LOG = '[TFW Form]';
    var API = 'https://forms.tf-widgets.com';         // куда отправляются заявки (воркер tfw-orders)
    var PREVIEW_DOMAINS = ['tf-widgets.com', '*.tf-widgets.com', '9ac5za-h1.myshopify.com'];
    var FIELD_KEYS = ['name', 'email', 'phone', 'message', 'extra1', 'extra2'];

    var ICONS = {
        chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 3h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-6.6L7 21.5V18H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4v1.8l2.8-1.8H19a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5zm3 4.5h8v2H8v-2z"/></svg>',
        mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.4V17h16V7.4l-8 5.3-8-5.3zM5.2 7 12 11.5 18.8 7H5.2z"/></svg>',
        close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>',
        check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z"/></svg>',
        arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.2 5.2 11.8 6.6l4.4 4.4H4v2h12.2l-4.4 4.4 1.4 1.4L20 12z"/></svg>'
    };

    var inlineCSS = `
        .tfw-cf, .tfw-cf * { box-sizing: border-box; }
        .tfw-cf { font-family: var(--cf-font); -webkit-font-smoothing: antialiased; color: var(--cf-text); line-height: 1.45; text-align: left; }
        .tfw-cf-card { width: 100%; max-width: var(--cf-w); margin: 0 auto; padding: var(--cf-pad); background: var(--cf-bg); color: var(--cf-text);
            border: 1px solid var(--cf-border); border-radius: var(--cf-r); box-shadow: var(--cf-shadow); }
        .tfw-cf-title { margin: 0 0 6px; font: 700 calc(var(--cf-fs) * 1.45)/1.2 var(--cf-font); color: var(--cf-text); letter-spacing: -.01em; }
        .tfw-cf-sub { margin: 0 0 18px; font-size: var(--cf-fs); color: var(--cf-muted); }
        .tfw-cf-form { display: grid; gap: 12px; margin: 0; }
        .tfw-cf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tfw-cf-f { display: grid; gap: 6px; min-width: 0; margin: 0; }
        .tfw-cf-f > span { font-size: calc(var(--cf-fs) * .86); font-weight: 600; color: var(--cf-text); }
        .tfw-cf-f > span i { font-style: normal; color: var(--cf-accent); margin-left: 2px; }
        .tfw-cf input, .tfw-cf textarea, .tfw-cf select {
            width: 100%; margin: 0; padding: .72em .85em; min-height: 0; font: 400 var(--cf-fs)/1.4 var(--cf-font); color: var(--cf-text);
            background: var(--cf-field); border: 1px solid var(--cf-border); border-radius: calc(var(--cf-r) * .55); outline: none; box-shadow: none;
            -webkit-appearance: none; appearance: none; transition: border-color .15s, box-shadow .15s; }
        .tfw-cf textarea { min-height: 7.5em; resize: vertical; }
        .tfw-cf select { background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
            background-position: calc(100% - 18px) 55%, calc(100% - 13px) 55%; background-size: 5px 5px; background-repeat: no-repeat; padding-right: 2.2em; }
        .tfw-cf input::placeholder, .tfw-cf textarea::placeholder { color: var(--cf-muted); opacity: .8; }
        .tfw-cf input:focus, .tfw-cf textarea:focus, .tfw-cf select:focus { border-color: var(--cf-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--cf-accent) 22%, transparent); }
        .tfw-cf-f.tfw-cf-bad input, .tfw-cf-f.tfw-cf-bad textarea, .tfw-cf-f.tfw-cf-bad select { border-color: #ef4444; }
        .tfw-cf-err { display: none; font-size: calc(var(--cf-fs) * .8); color: #ef4444; }
        .tfw-cf-f.tfw-cf-bad .tfw-cf-err { display: block; }
        .tfw-cf-consent { display: flex; gap: 10px; align-items: flex-start; font-size: calc(var(--cf-fs) * .84); color: var(--cf-muted); cursor: pointer; }
        .tfw-cf-consent input { flex: none; width: 18px; height: 18px; padding: 0; margin: 1px 0 0; border-radius: 5px; cursor: pointer; position: relative; }
        .tfw-cf-consent input:checked { background: var(--cf-accent); border-color: var(--cf-accent); }
        .tfw-cf-consent input:checked::after { content: ''; position: absolute; left: 5px; top: 1px; width: 5px; height: 10px; border: solid var(--cf-accent-text); border-width: 0 2px 2px 0; transform: rotate(45deg); }
        .tfw-cf-consent a { color: inherit; text-decoration: underline; }
        .tfw-cf-consent.tfw-cf-bad { color: #ef4444; }
        .tfw-cf-hp { position: absolute !important; left: -9999px !important; width: 1px !important; height: 1px !important; overflow: hidden !important; }
        .tfw-cf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin: 4px 0 0; padding: .85em 1.2em; min-height: 0;
            font: 700 var(--cf-fs)/1.2 var(--cf-font); color: var(--cf-accent-text); background: var(--cf-accent); border: 0; border-radius: var(--cf-btn-r);
            cursor: pointer; box-shadow: none; text-transform: none; letter-spacing: 0; transition: filter .15s, transform .15s; }
        .tfw-cf-btn:hover { filter: brightness(1.06); }
        .tfw-cf-btn:active { transform: translateY(1px); }
        .tfw-cf-btn svg { width: 1.1em; height: 1.1em; }
        .tfw-cf-btn[disabled] { opacity: .65; cursor: progress; }
        .tfw-cf-status { margin: 0; font-size: calc(var(--cf-fs) * .86); color: #ef4444; }
        .tfw-cf-status:empty { display: none; }
        .tfw-cf-done { display: none; text-align: center; padding: 18px 4px 6px; }
        .tfw-cf-done .tfw-cf-ok { display: inline-grid; place-items: center; width: 54px; height: 54px; margin-bottom: 12px; border-radius: 50%; background: var(--cf-accent); color: var(--cf-accent-text); }
        .tfw-cf-done .tfw-cf-ok svg { width: 28px; height: 28px; }
        .tfw-cf-done h3 { margin: 0 0 6px; font: 700 calc(var(--cf-fs) * 1.3)/1.25 var(--cf-font); color: var(--cf-text); }
        .tfw-cf-done p { margin: 0; color: var(--cf-muted); font-size: var(--cf-fs); }
        .tfw-cf.tfw-cf-sent .tfw-cf-form, .tfw-cf.tfw-cf-sent .tfw-cf-head { display: none; }
        .tfw-cf.tfw-cf-sent .tfw-cf-done { display: block; }
        .tfw-cf-brand { margin: 12px 0 0; text-align: center; font-size: 11px; color: var(--cf-muted); opacity: .7; }

        /* плавающая кнопка + окно */
        .tfw-cf-launch { position: fixed; z-index: 2147482990; bottom: 22px; display: inline-flex; align-items: center; gap: 9px; margin: 0; padding: 13px 18px; min-height: 0;
            font: 700 15px/1 var(--cf-font); color: var(--cf-accent-text); background: var(--cf-accent); border: 0; border-radius: 999px; cursor: pointer;
            box-shadow: 0 12px 30px -8px rgba(0,0,0,.45); transition: transform .2s, filter .2s; }
        .tfw-cf-launch:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .tfw-cf-launch svg { width: 20px; height: 20px; flex: none; }
        .tfw-cf-launch.tfw-cf-right { right: 22px; } .tfw-cf-launch.tfw-cf-left { left: 22px; }
        .tfw-cf-launch.tfw-cf-icon-only { padding: 15px; } .tfw-cf-launch.tfw-cf-icon-only span { display: none; }
        .tfw-cf-modal { position: fixed; inset: 0; z-index: 2147482995; display: flex; align-items: center; justify-content: center; padding: 16px;
            background: rgba(0,0,0,.55); opacity: 0; visibility: hidden; transition: opacity .25s, visibility .25s; }
        .tfw-cf-modal.tfw-cf-open { opacity: 1; visibility: visible; }
        .tfw-cf-modal .tfw-cf-card { position: relative; max-height: calc(100vh - 32px); overflow: auto; transform: translateY(14px) scale(.98); transition: transform .3s cubic-bezier(.2,.8,.2,1); }
        .tfw-cf-modal.tfw-cf-open .tfw-cf-card { transform: none; }
        .tfw-cf-x { position: absolute; top: 12px; right: 12px; display: grid; place-items: center; width: 34px; height: 34px; margin: 0; padding: 0; min-height: 0;
            color: var(--cf-muted); background: transparent; border: 0; border-radius: 50%; cursor: pointer; }
        .tfw-cf-x:hover { background: color-mix(in srgb, var(--cf-text) 8%, transparent); color: var(--cf-text); }
        .tfw-cf-x svg { width: 20px; height: 20px; }
        .tfw-cf-modal .tfw-cf-title { padding-right: 34px; }
        .tfw-cf-inline-box.tfw-cf-preview-pop { position: relative; }
        @media (max-width: 560px) {
            .tfw-cf-row { grid-template-columns: 1fr; }
            .tfw-cf-launch { bottom: 16px; } .tfw-cf-launch.tfw-cf-right { right: 16px; } .tfw-cf-launch.tfw-cf-left { left: 16px; }
            .tfw-cf-modal { align-items: flex-end; padding: 0; }
            .tfw-cf-modal .tfw-cf-card { max-width: none; border-radius: var(--cf-r) var(--cf-r) 0 0; max-height: 92vh; }
        }
        @media (prefers-reduced-motion: reduce) { .tfw-cf *, .tfw-cf-modal, .tfw-cf-launch { transition: none !important; } }
    `;

    /* =========================================================
       ПУБЛИЧНЫЕ API
       ========================================================= */
    window.BusinessHoursWidgets = window.BusinessHoursWidgets || {};
    window.BusinessHoursWidgets.contactForm = window.BusinessHoursWidgets.contactForm || {};

    // Живое превью для конфигуратора: BHWContactForm.render(container, config) -> { update, destroy }
    var api = window.BHWContactForm = window.BHWContactForm || {};
    api.version = VERSION;
    api.defaults = getDefaultConfig;
    api.checkAccess = bhwCheckAccess;
    api.render = function (container, config) {
        var noop = { destroy: function () {}, update: function () {}, el: null };
        if (!bhwCheckAccess({ domains: PREVIEW_DOMAINS }).ok) { console.warn(LOG, 'preview is only available on tf-widgets.com'); return noop; }
        injectBaseStyles();
        if (container._tfwCfDestroy) container._tfwCfDestroy();
        var cls = container.__tfwCfClass || (container.__tfwCfClass = 'tfw-cf-preview-' + Math.random().toString(36).slice(2, 8));
        var widget = null;
        var ctrl = {
            el: null,
            update: function (cfg) {
                var open = widget ? widget.isOpen() : false;
                if (widget) widget.destroy();
                widget = mountWidget(normalizeConfig(cfg || {}), cls, 'preview', { preview: container, open: open });
                ctrl.el = widget.root;
            },
            open: function () { if (widget) widget.open(); },
            destroy: function () { if (widget) widget.destroy(); widget = null; ctrl.el = null; container._tfwCfDestroy = null; }
        };
        ctrl.update(config);
        container._tfwCfDestroy = ctrl.destroy;
        return ctrl;
    };

    /* =========================================================
       АВТОЗАПУСК ПО <script data-id="..."> (только свой тег)
       ========================================================= */
    try {
        var currentScript = document.currentScript || (function () {
            var scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        if (currentScript && currentScript.dataset && currentScript.dataset.id && currentScript.dataset.bhwMounted !== '1') {
            currentScript.dataset.bhwMounted = '1';
            var debug = currentScript.dataset.debug === '1';
            var clientId = normalizeId(currentScript.dataset.id);
            var baseUrl = getBasePath(currentScript.src);
            var apiBase = String(currentScript.dataset.api || API).replace(/\/+$/, '');
            // место для формы на странице: элемент с data-tfw-form="ID" или id="tfw-contact-form", иначе — сразу после тега <script>
            var anchor = document.querySelector('[data-tfw-form="' + clientId + '"]') || document.getElementById('tfw-contact-form');
            var marker = null;
            if (!anchor && currentScript.parentNode && currentScript.parentNode !== document.head) {
                marker = document.createElement('div');
                currentScript.parentNode.insertBefore(marker, currentScript.nextSibling);
            }
            loadConfig(clientId, baseUrl)
                .then(function (fetched) {
                    var access = bhwCheckAccess(fetched);
                    if (!access.ok) {
                        console.warn(LOG, 'widget "' + clientId + '" is not active on ' + (location.hostname || 'this page') + ': ' + access.reason);
                        if (marker) marker.remove();
                        return;
                    }
                    var cfg = normalizeConfig(fetched);
                    if (debug) console.log(LOG, 'config "' + clientId + '":', cfg);
                    injectBaseStyles();
                    var mount = function () {
                        var w = mountWidget(cfg, 'tfw-cf-' + clientId.replace(/[^a-z0-9_-]/gi, '') + '-' + Date.now(), clientId, { anchor: anchor || marker, api: apiBase });
                        window.BusinessHoursWidgets.contactForm[clientId] = w;
                    };
                    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
                })
                .catch(function (error) {
                    console.warn(LOG, 'config "' + clientId + '" not loaded:', error.message);
                });
        }
    } catch (error) {
        console.error(LOG, 'critical error:', error);
    }

    /* =========================================================
       ФУНКЦИИ
       ========================================================= */
    function injectBaseStyles() {
        if (!document.getElementById('tfw-contact-form-styles')) {
            var style = document.createElement('style');
            style.id = 'tfw-contact-form-styles';
            style.textContent = inlineCSS;
            (document.head || document.documentElement).appendChild(style);
        }
    }

    /* ---------------------------------------------------------
       ДОСТУП (общий блок для всех виджетов TF Widgets — копировать без изменений)
       --------------------------------------------------------- */
    function bhwCheckAccess(config) {
        config = config || {};
        if (config.active === false) return { ok: false, reason: 'widget is switched off ("active": false)' };
        var host = String(location.hostname || '').toLowerCase().replace(/^www\./, '');
        if (!host || host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:') return { ok: true };
        var list = config.domains;
        if (typeof list === 'string') list = list.split(/[\s,]+/);
        if (!Array.isArray(list) || !list.length) return { ok: false, reason: 'no "domains" in config' };
        for (var i = 0; i < list.length; i++) {
            var d = String(list[i] || '').trim().toLowerCase()
                .replace(/^[a-z]+:\/\//, '').replace(/[\/:].*$/, '').replace(/^www\./, '');
            if (!d) continue;
            if (d.indexOf('*.') === 0) {
                var base = d.slice(2);
                if (host === base || host.slice(-(base.length + 1)) === '.' + base) return { ok: true };
            } else if (host === d) {
                return { ok: true };
            }
        }
        return { ok: false, reason: 'domain is not in "domains"' };
    }

    function normalizeId(id) { return String(id || 'demo').replace(/\.(json|js)$/i, ''); }
    function getBasePath(src) {
        if (!src) return './';
        try { var url = new URL(src, location.href); return url.origin + url.pathname.replace(/\/[^\/]*$/, '/'); }
        catch (error) { return './'; }
    }
    function loadConfig(clientId, baseUrl) {
        if (clientId === 'local') {
            var el = document.querySelector('#tfw-cf-local-config');
            if (!el) return Promise.reject(new Error('#tfw-cf-local-config not found'));
            try { return Promise.resolve(JSON.parse(el.textContent)); } catch (e) { return Promise.reject(e); }
        }
        var url = baseUrl + 'configs/' + encodeURIComponent(clientId) + '.json?v=' + Date.now();
        return fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }

    function getDefaultConfig() {
        return {
            mode: 'inline',                 // inline — форма на странице; popup — плавающая кнопка + окно
            title: 'Get in touch',
            subtitle: "Send us a message and we'll get back to you soon.",
            submitText: 'Send message',
            successTitle: 'Thank you!',
            successText: "Your message has been sent. We'll reply as soon as we can.",
            fields: {
                name:    { on: true,  required: true,  label: 'Name',    placeholder: 'Your name' },
                email:   { on: true,  required: true,  label: 'Email',   placeholder: 'you@example.com' },
                phone:   { on: false, required: false, label: 'Phone',   placeholder: '+1 555 000 0000' },
                message: { on: true,  required: true,  label: 'Message', placeholder: 'How can we help?' },
                extra1:  { on: false, required: false, label: 'Subject', placeholder: '', type: 'text', options: [] },
                extra2:  { on: false, required: false, label: 'Topic',   placeholder: '', type: 'select', options: ['General question', 'Booking', 'Support'] }
            },
            consent: { on: false, text: 'I agree to the processing of my data to answer this message.', linkText: 'Privacy policy', url: '' },
            launcher: { text: 'Contact us', position: 'right', iconOnly: false, icon: 'chat' },
            style: {
                fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
                colors: {
                    background: '#ffffff',
                    text: '#111111',
                    muted: '#6b7280',
                    field: '#ffffff',
                    border: '#e5e7eb',
                    accent: '#25d366',
                    accentText: '#052e16'
                },
                sizes: { width: 560, radius: 16, buttonRadius: 12, fontSize: 15, padding: 28 },
                shadow: '0 20px 50px -20px rgba(0,0,0,.25)'
            }
        };
    }

    function normalizeConfig(raw) {
        raw = raw || {};
        var def = getDefaultConfig();
        var cfg = mergeDeep(def, raw);
        cfg.mode = cfg.mode === 'popup' ? 'popup' : 'inline';
        var f = {};
        FIELD_KEYS.forEach(function (k) {
            var d = def.fields[k], r = isObj(raw.fields) && isObj(raw.fields[k]) ? raw.fields[k] : {};
            var x = mergeDeep(d, r);
            x.on = !!x.on; x.required = x.on && !!x.required;
            if (k === 'message') x.required = false;            // пустое сообщение можно: сервер подставит стандартный текст
            x.label = String(x.label || d.label).slice(0, 60);
            x.placeholder = String(x.placeholder == null ? '' : x.placeholder).slice(0, 80);
            if (k === 'extra1' || k === 'extra2') {
                x.type = x.type === 'select' ? 'select' : 'text';
                x.options = (Array.isArray(r.options) ? r.options : d.options).map(function (o) { return String(o || '').trim().slice(0, 60); }).filter(Boolean).slice(0, 12);
                if (x.type === 'select' && !x.options.length) x.type = 'text';
            }
            f[k] = x;
        });
        f.email.on = true;                                  // без email клиенту некуда ответить
        cfg.fields = f;
        cfg.consent = mergeDeep(def.consent, isObj(raw.consent) ? raw.consent : {});
        cfg.launcher = mergeDeep(def.launcher, isObj(raw.launcher) ? raw.launcher : {});
        cfg.launcher.position = cfg.launcher.position === 'left' ? 'left' : 'right';
        cfg.launcher.icon = cfg.launcher.icon === 'mail' ? 'mail' : 'chat';
        return cfg;
    }

    function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
    function mergeDeep(base, over) {
        var out = {};
        Object.keys(base || {}).forEach(function (k) { out[k] = isObj(base[k]) ? mergeDeep(base[k], {}) : base[k]; });
        Object.keys(over || {}).forEach(function (k) {
            var v = over[k];
            if (isObj(v) && isObj(out[k])) out[k] = mergeDeep(out[k], v);
            else if (v !== undefined) out[k] = v;
        });
        return out;
    }
    function cssValue(v, fallback) { if (v === undefined || v === null || v === '') return fallback; return String(v).replace(/[;{}<>]/g, ''); }
    function num(v, fallback) { var n = Number(v); return isFinite(n) && v !== '' && v !== null ? n : fallback; }
    function clamp(v, a, b, d) { return Math.min(b, Math.max(a, num(v, d))); }
    function safeUrl(url) {
        var u = String(url || '').trim();
        if (!u) return '';
        if (/^https?:/i.test(u) || /^\/(?!\/)/.test(u)) return u;
        if (/^[\w.-]+\.[a-z]{2,}(\/|$|\?)/i.test(u)) return 'https://' + u;
        return '';
    }
    function escapeHtml(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function applyCustomStyles(uniqueClass, style) {
        var id = 'tfw-cf-style-' + uniqueClass;
        var el = document.getElementById(id);
        if (!el) { el = document.createElement('style'); el.id = id; (document.head || document.documentElement).appendChild(el); }
        var s = style || {}, c = s.colors || {}, z = s.sizes || {};
        var sel = '.' + uniqueClass;
        el.textContent = sel + ',' + sel + '-pop{' +
            '--cf-font:' + cssValue(s.fontFamily, "'Inter', system-ui, sans-serif") + ';' +
            '--cf-bg:' + cssValue(c.background, '#ffffff') + ';' +
            '--cf-text:' + cssValue(c.text, '#111111') + ';' +
            '--cf-muted:' + cssValue(c.muted, '#6b7280') + ';' +
            '--cf-field:' + cssValue(c.field, '#ffffff') + ';' +
            '--cf-border:' + cssValue(c.border, '#e5e7eb') + ';' +
            '--cf-accent:' + cssValue(c.accent, '#25d366') + ';' +
            '--cf-accent-text:' + cssValue(c.accentText, '#052e16') + ';' +
            '--cf-w:' + clamp(z.width, 300, 900, 560) + 'px;' +
            '--cf-r:' + clamp(z.radius, 0, 32, 16) + 'px;' +
            '--cf-btn-r:' + clamp(z.buttonRadius, 0, 999, 12) + 'px;' +
            '--cf-fs:' + clamp(z.fontSize, 13, 19, 15) + 'px;' +
            '--cf-pad:' + clamp(z.padding, 14, 48, 28) + 'px;' +
            '--cf-shadow:' + cssValue(s.shadow, 'none') + ';' +
            '}';
        return id;
    }

    function fieldHtml(key, f, uid) {
        var id = uid + '-' + key;
        var req = f.required ? ' required aria-required="true"' : '';
        var label = '<span>' + escapeHtml(f.label) + (f.required ? '<i aria-hidden="true">*</i>' : '') + '</span>';
        var ph = f.placeholder ? ' placeholder="' + escapeHtml(f.placeholder) + '"' : '';
        var input;
        if (key === 'message') input = '<textarea id="' + id + '" name="' + key + '" maxlength="5000"' + ph + req + '></textarea>';
        else if (f.type === 'select') {
            input = '<select id="' + id + '" name="' + key + '"' + req + '><option value="">' + escapeHtml(f.placeholder || 'Select…') + '</option>' +
                f.options.map(function (o) { return '<option>' + escapeHtml(o) + '</option>'; }).join('') + '</select>';
        } else {
            var type = key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text';
            var ac = key === 'email' ? 'email' : key === 'phone' ? 'tel' : key === 'name' ? 'name' : 'off';
            input = '<input id="' + id + '" name="' + key + '" type="' + type + '" autocomplete="' + ac + '" maxlength="' + (key === 'email' ? 120 : 200) + '"' + ph + req + '>';
        }
        return '<label class="tfw-cf-f" for="' + id + '" data-k="' + key + '">' + label + input + '<em class="tfw-cf-err"></em></label>';
    }

    function cardHtml(cfg, uid, closable) {
        var F = cfg.fields, rows = [];
        var on = function (k) { return F[k] && F[k].on; };
        // имя + email в одну строку на широком экране, телефон + доп. поле тоже
        if (on('name')) rows.push('<div class="tfw-cf-row">' + fieldHtml('name', F.name, uid) + fieldHtml('email', F.email, uid) + '</div>');
        else rows.push(fieldHtml('email', F.email, uid));
        var pair = ['phone', 'extra1', 'extra2'].filter(on);
        for (var i = 0; i < pair.length; i += 2) {
            rows.push(pair[i + 1] ? '<div class="tfw-cf-row">' + fieldHtml(pair[i], F[pair[i]], uid) + fieldHtml(pair[i + 1], F[pair[i + 1]], uid) + '</div>' : fieldHtml(pair[i], F[pair[i]], uid));
        }
        if (on('message')) rows.push(fieldHtml('message', F.message, uid));
        if (cfg.consent.on) {
            var link = safeUrl(cfg.consent.url);
            rows.push('<label class="tfw-cf-consent"><input type="checkbox" name="_consent" required> <span>' + escapeHtml(cfg.consent.text) +
                (link && cfg.consent.linkText ? ' <a href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(cfg.consent.linkText) + '</a>' : '') + '</span></label>');
        }
        return '<div class="tfw-cf-card" role="' + (closable ? 'dialog' : 'region') + '"' + (closable ? ' aria-modal="true"' : '') + ' aria-labelledby="' + uid + '-t">' +
            (closable ? '<button class="tfw-cf-x" type="button" aria-label="Close">' + ICONS.close + '</button>' : '') +
            '<div class="tfw-cf-head">' +
                (cfg.title ? '<h2 class="tfw-cf-title" id="' + uid + '-t">' + escapeHtml(cfg.title) + '</h2>' : '<span id="' + uid + '-t" hidden>Contact form</span>') +
                (cfg.subtitle ? '<p class="tfw-cf-sub">' + escapeHtml(cfg.subtitle) + '</p>' : '') +
            '</div>' +
            '<form class="tfw-cf-form" novalidate>' + rows.join('') +
                '<div class="tfw-cf-hp" aria-hidden="true"><label>Company website<input type="text" name="_website" tabindex="-1" autocomplete="off"></label></div>' +
                '<p class="tfw-cf-status" role="alert" aria-live="assertive"></p>' +
                '<button class="tfw-cf-btn" type="submit"><span>' + escapeHtml(cfg.submitText || 'Send') + '</span>' + ICONS.arrow + '</button>' +
            '</form>' +
            '<div class="tfw-cf-done" role="status" aria-live="polite"><span class="tfw-cf-ok">' + ICONS.check + '</span><h3>' + escapeHtml(cfg.successTitle) + '</h3><p>' + escapeHtml(cfg.successText) + '</p></div>' +
        '</div>';
    }

    function validEmail(v) { return /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(v); }

    function mountWidget(cfg, uniqueClass, id, opts) {
        opts = opts || {};
        var preview = opts.preview || null;
        var popup = cfg.mode === 'popup';
        var styleId = applyCustomStyles(uniqueClass, cfg.style);
        var uid = 'tfwcf' + Math.random().toString(36).slice(2, 7);
        var cleanups = [];
        function on(t, e, h, o) { if (!t) return; t.addEventListener(e, h, o); cleanups.push(function () { t.removeEventListener(e, h, o); }); }

        var root = document.createElement('div');
        root.id = 'tfw-contact-form-' + id;
        root.className = 'tfw-cf ' + uniqueClass;
        var launch = null, modal = null, lastFocus = null;

        if (!popup) {
            root.innerHTML = cardHtml(cfg, uid, false);
            if (preview) preview.appendChild(root);
            else if (opts.anchor) opts.anchor.appendChild(root);
            else document.body.appendChild(root);
        } else {
            var L = cfg.launcher;
            launch = document.createElement('button');
            launch.type = 'button';
            launch.className = 'tfw-cf-launch tfw-cf ' + uniqueClass + ' tfw-cf-' + L.position + (L.iconOnly ? ' tfw-cf-icon-only' : '');
            launch.setAttribute('aria-haspopup', 'dialog');
            launch.setAttribute('aria-label', L.text || 'Contact us');
            launch.innerHTML = ICONS[L.icon] + '<span>' + escapeHtml(L.text || 'Contact us') + '</span>';
            modal = document.createElement('div');
            modal.className = 'tfw-cf-modal';
            root.innerHTML = cardHtml(cfg, uid, true);
            modal.appendChild(root);
            var host = preview || document.body;
            if (preview) { launch.style.position = 'absolute'; modal.style.position = 'absolute'; }
            host.appendChild(launch);
            host.appendChild(modal);
            on(launch, 'click', function () { widget.open(); });
            on(modal, 'click', function (e) { if (e.target === modal) widget.close(); });
            on(root.querySelector('.tfw-cf-x'), 'click', function () { widget.close(); });
            on(document, 'keydown', function (e) {
                if (!modal.classList.contains('tfw-cf-open')) return;
                if (e.key === 'Escape') widget.close();
                if (e.key === 'Tab') {   // фокус не уходит из окна
                    var els = [].slice.call(root.querySelectorAll('button, input, select, textarea, a[href]')).filter(function (x) { return x.offsetParent !== null && !x.closest('.tfw-cf-hp'); });
                    if (!els.length) return;
                    if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
                    else if (!e.shiftKey && document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
                }
            });
        }

        var form = root.querySelector('.tfw-cf-form');
        var status = root.querySelector('.tfw-cf-status');
        var btn = root.querySelector('.tfw-cf-btn');
        var started = Date.now();

        function setBad(k, msg) {
            var box = form.querySelector('[data-k="' + k + '"]');
            if (!box) return;
            box.classList.toggle('tfw-cf-bad', !!msg);
            box.querySelector('.tfw-cf-err').textContent = msg || '';
            var inp = box.querySelector('input,textarea,select');
            if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
        }
        function collect() {
            var data = {}, bad = [];
            FIELD_KEYS.forEach(function (k) {
                var f = cfg.fields[k];
                if (!f.on) return;
                var el = form.elements[k];
                var v = el ? String(el.value || '').trim() : '';
                var err = '';
                if (f.required && !v) err = 'Please fill in this field';
                else if (k === 'email' && v && !validEmail(v)) err = 'Please enter a valid email';
                else if (k === 'phone' && v && !/^[+()\d\s.-]{5,24}$/.test(v)) err = 'Please enter a valid phone number';
                setBad(k, err);
                if (err) bad.push(k);
                if (v) data[k] = v;
            });
            var consentOk = true;
            if (cfg.consent.on) {
                var c = form.elements._consent;
                consentOk = !!(c && c.checked);
                c.closest('.tfw-cf-consent').classList.toggle('tfw-cf-bad', !consentOk);
            }
            return { data: data, bad: bad, consentOk: consentOk };
        }
        on(form, 'input', function (e) { var b = e.target.closest('.tfw-cf-bad'); if (b && b.dataset.k) setBad(b.dataset.k, ''); if (b && !b.dataset.k) b.classList.remove('tfw-cf-bad'); status.textContent = ''; });
        on(form, 'change', function (e) { var b = e.target.closest('.tfw-cf-consent'); if (b) b.classList.remove('tfw-cf-bad'); });

        var sending = false;
        on(form, 'submit', function (e) {
            e.preventDefault();
            if (sending) return;
            var r = collect();
            if (r.bad.length) { var first = form.elements[r.bad[0]]; if (first) first.focus(); return; }
            if (!r.consentOk) { status.textContent = 'Please confirm the checkbox above.'; return; }
            if (preview) { done(); return; }                      // превью в конфигураторе: ничего не отправляем
            sending = true; btn.disabled = true; status.textContent = '';
            var payload = {
                fields: r.data,
                consent: cfg.consent.on ? true : undefined,
                _website: form.elements._website ? form.elements._website.value : '',
                t: Date.now() - started,
                page: location.href.slice(0, 300),
                v: VERSION
            };
            fetch((opts.api || API) + '/f/' + encodeURIComponent(id), {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=UTF-8' },   // простой запрос без preflight
                body: JSON.stringify(payload)
            }).then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok && j.ok, j: j, status: res.status }; });
            }).then(function (x) {
                if (x.ok) { done(); return; }
                status.textContent = x.status === 429 ? 'Too many messages. Please try again in a few minutes.'
                    : x.j && x.j.error === 'fields' ? 'Please check the fields and try again.'
                    : 'Sorry, the message could not be sent. Please try again later.';
            }).catch(function () {
                status.textContent = 'Network error. Please check your connection and try again.';
            }).then(function () { sending = false; btn.disabled = false; });
        });

        function done() {
            root.classList.add('tfw-cf-sent');
            form.reset();
            var d = root.querySelector('.tfw-cf-done'); if (d) d.setAttribute('tabindex', '-1');
            if (preview) setTimeout(function () { root.classList.remove('tfw-cf-sent'); }, 2600);  // превью: форма возвращается
        }

        var widget = {
            root: root, config: cfg, id: id, launcher: launch,
            isOpen: function () { return !!(modal && modal.classList.contains('tfw-cf-open')); },
            open: function () {
                if (!modal) return;
                lastFocus = document.activeElement;
                modal.classList.add('tfw-cf-open');
                if (root.classList.contains('tfw-cf-sent') && !preview) { root.classList.remove('tfw-cf-sent'); started = Date.now(); }
                var f = root.querySelector('input:not([type=hidden]):not([tabindex="-1"]), textarea, select');
                if (f && !preview) setTimeout(function () { f.focus(); }, 60);
            },
            close: function () {
                if (!modal) return;
                modal.classList.remove('tfw-cf-open');
                if (lastFocus && lastFocus.focus && !preview) lastFocus.focus();
            },
            destroy: function () {
                cleanups.forEach(function (f) { try { f(); } catch (e) {} });
                if (launch) launch.remove();
                if (modal) modal.remove(); else root.remove();
                var s = document.getElementById(styleId); if (s) s.remove();
            }
        };
        if (modal && opts.open) { modal.style.transition = 'none'; widget.open(); setTimeout(function () { modal.style.transition = ''; }, 30); }
        return widget;
    }
})();
