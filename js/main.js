/* =========================================================
   MANDALA CHANNEL
   MAIN.JS
   ---------------------------------------------------------
   Fungsi global website publik.

   CATATAN:
   - Tidak menggunakan CDN
   - Tidak menggunakan external script
   - Tidak meminta internet access
   - Tidak mengubah tampilan halaman secara paksa
   - Tidak membuat angka 01 / 02 / 03
   - Tidak membuat angka Romawi
   - Aman digunakan sebelum Supabase diaktifkan
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       MANDALA NAMESPACE
       ===================================================== */

    window.Mandala = window.Mandala || {};



    /* =====================================================
       CONFIG DASAR
       ===================================================== */

    const SELECTORS = {

        header: [
            ".site-header",
            ".header",
            "header"
        ],

        menuToggle: [
            ".menu-toggle",
            ".mobile-menu-toggle",
            "[data-menu-toggle]"
        ],

        mobileMenu: [
            ".mobile-menu",
            ".mobile-nav",
            "[data-mobile-menu]"
        ],

        reveal: [
            ".reveal",
            "[data-reveal]"
        ],

        lazyImages: [
            "img[data-src]"
        ],

        video: [
            "video"
        ],

        modalOpen: [
            "[data-modal-open]"
        ],

        modalClose: [
            "[data-modal-close]"
        ],

        tabs: [
            "[data-tab]"
        ],

        tabPanels: [
            "[data-tab-panel]"
        ]

    };



    /* =====================================================
       HELPER
       ===================================================== */

    function qs(selector, parent) {

        return (
            parent || document
        ).querySelector(selector);

    }


    function qsa(selector, parent) {

        return Array.from(
            (
                parent || document
            ).querySelectorAll(selector)
        );

    }


    function firstExisting(selectors) {

        for (
            const selector of selectors
        ) {

            const element =
                qs(selector);

            if (element) {

                return element;

            }

        }

        return null;

    }


    function allExisting(selectors) {

        const elements = [];

        selectors.forEach(
            function (selector) {

                qsa(selector).forEach(
                    function (element) {

                        if (
                            !elements.includes(
                                element
                            )
                        ) {

                            elements.push(
                                element
                            );

                        }

                    }
                );

            }
        );

        return elements;

    }



    /* =====================================================
       PUBLIC HELPERS
       ===================================================== */

    Mandala.qs = qs;

    Mandala.qsa = qsa;

    Mandala.firstExisting =
        firstExisting;

    Mandala.allExisting =
        allExisting;



    /* =====================================================
       DOM READY
       ===================================================== */

    function ready(callback) {

        if (
            document.readyState ===
            "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                callback,
                {
                    once: true
                }
            );

        } else {

            callback();

        }

    }



    /* =====================================================
       HEADER SCROLL
       ===================================================== */

    function initHeader() {

        const header =
            firstExisting(
                SELECTORS.header
            );

        if (!header) {

            return;

        }


        let ticking = false;


        function updateHeader() {

            const scrolled =
                window.scrollY > 24;


            header.classList.toggle(
                "scrolled",
                scrolled
            );


            ticking = false;

        }


        function requestUpdate() {

            if (ticking) {

                return;

            }


            ticking = true;


            window.requestAnimationFrame(
                updateHeader
            );

        }


        window.addEventListener(
            "scroll",
            requestUpdate,
            {
                passive: true
            }
        );


        updateHeader();

    }



    /* =====================================================
       MOBILE MENU
       ===================================================== */

    function initMobileMenu() {

        const toggles =
            allExisting(
                SELECTORS.menuToggle
            );

        const menu =
            firstExisting(
                SELECTORS.mobileMenu
            );


        if (
            !toggles.length ||
            !menu
        ) {

            return;

        }


        function closeMenu() {

            menu.classList.remove(
                "is-open"
            );

            document.body.classList.remove(
                "menu-open"
            );


            toggles.forEach(
                function (toggle) {

                    toggle.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        }


        function openMenu() {

            menu.classList.add(
                "is-open"
            );

            document.body.classList.add(
                "menu-open"
            );


            toggles.forEach(
                function (toggle) {

                    toggle.setAttribute(
                        "aria-expanded",
                        "true"
                    );

                }
            );

        }


        toggles.forEach(
            function (toggle) {

                toggle.setAttribute(
                    "aria-expanded",
                    "false"
                );


                toggle.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        const isOpen =
                            menu.classList.contains(
                                "is-open"
                            );


                        if (isOpen) {

                            closeMenu();

                        } else {

                            openMenu();

                        }

                    }
                );

            }
        );


        menu.addEventListener(
            "click",
            function (event) {

                const link =
                    event.target.closest(
                        "a"
                    );


                if (link) {

                    closeMenu();

                }

            }
        );


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeMenu();

                }

            }
        );


        window.addEventListener(
            "resize",
            function () {

                if (
                    window.innerWidth > 850
                ) {

                    closeMenu();

                }

            },
            {
                passive: true
            }
        );

    }



    /* =====================================================
       SMOOTH ANCHOR
       ===================================================== */

    function initSmoothLinks() {

        const links =
            qsa(
                'a[href^="#"]'
            );


        links.forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function (event) {

                        const href =
                            link.getAttribute(
                                "href"
                            );


                        if (
                            !href ||
                            href === "#"
                        ) {

                            return;

                        }


                        const target =
                            qs(href);


                        if (!target) {

                            return;

                        }


                        event.preventDefault();


                        target.scrollIntoView(
                            {
                                behavior:
                                    window.matchMedia(
                                        "(prefers-reduced-motion: reduce)"
                                    ).matches
                                        ? "auto"
                                        : "smooth",
                                block:
                                    "start"
                            }
                        );


                        if (
                            history.pushState
                        ) {

                            history.pushState(
                                null,
                                "",
                                href
                            );

                        }

                    }
                );

            }
        );

    }



    /* =====================================================
       REVEAL ANIMATION
       ===================================================== */

    function initReveal() {

        const elements =
            allExisting(
                SELECTORS.reveal
            );


        if (
            !elements.length
        ) {

            return;

        }


        const reducedMotion =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;


        if (
            reducedMotion
        ) {

            elements.forEach(
                function (element) {

                    element.classList.add(
                        "visible"
                    );

                }
            );

            return;

        }


        if (
            !("IntersectionObserver" in window)
        ) {

            elements.forEach(
                function (element) {

                    element.classList.add(
                        "visible"
                    );

                }
            );

            return;

        }


        const observer =
            new IntersectionObserver(
                function (entries) {

                    entries.forEach(
                        function (entry) {

                            if (
                                !entry.isIntersecting
                            ) {

                                return;

                            }


                            entry.target.classList.add(
                                "visible"
                            );


                            observer.unobserve(
                                entry.target
                            );

                        }
                    );

                },
                {
                    threshold: .10,
                    rootMargin:
                        "0px 0px -40px 0px"
                }
            );


        elements.forEach(
            function (element) {

                observer.observe(
                    element
                );

            }
        );

    }



    /* =====================================================
       LAZY IMAGE
       -----------------------------------------------------
       Hanya bekerja untuk gambar yang memang
       menggunakan data-src.
       Tidak melakukan request tambahan
       selain URL gambar yang memang diberikan
       oleh halaman.
       ===================================================== */

    function initLazyImages() {

        const images =
            qsa(
                "img[data-src]"
            );


        if (
            !images.length
        ) {

            return;

        }


        function loadImage(image) {

            const source =
                image.getAttribute(
                    "data-src"
                );


            if (!source) {

                return;

            }


            image.setAttribute(
                "src",
                source
            );


            image.removeAttribute(
                "data-src"
            );


            image.classList.add(
                "is-loaded"
            );

        }


        if (
            !("IntersectionObserver" in window)
        ) {

            images.forEach(
                loadImage
            );

            return;

        }


        const observer =
            new IntersectionObserver(
                function (entries) {

                    entries.forEach(
                        function (entry) {

                            if (
                                !entry.isIntersecting
                            ) {

                                return;

                            }


                            loadImage(
                                entry.target
                            );


                            observer.unobserve(
                                entry.target
                            );

                        }
                    );

                },
                {
                    rootMargin:
                        "300px 0px"
                }
            );


        images.forEach(
            function (image) {

                observer.observe(
                    image
                );

            }
        );

    }



    /* =====================================================
       VIDEO
       ===================================================== */

    function initVideo() {

        const videos =
            allExisting(
                SELECTORS.video
            );


        if (
            !videos.length
        ) {

            return;

        }


        videos.forEach(
            function (video) {

                video.setAttribute(
                    "playsinline",
                    ""
                );


                video.addEventListener(
                    "play",
                    function () {

                        videos.forEach(
                            function (other) {

                                if (
                                    other !==
                                    video &&
                                    !other.paused
                                ) {

                                    other.pause();

                                }

                            }
                        );

                    }
                );

            }
        );

    }



    /* =====================================================
       MODAL
       ===================================================== */

    function initModal() {

        const openButtons =
            allExisting(
                SELECTORS.modalOpen
            );

        const closeButtons =
            allExisting(
                SELECTORS.modalClose
            );


        if (
            !openButtons.length
        ) {

            return;

        }


        function getModal(
            button
        ) {

            const target =
                button.getAttribute(
                    "data-modal-open"
                );


            if (!target) {

                return null;

            }


            return qs(
                target
            );

        }


        function openModal(modal) {

            if (!modal) {

                return;

            }


            modal.classList.add(
                "is-open"
            );

            modal.setAttribute(
                "aria-hidden",
                "false"
            );

            document.body.classList.add(
                "modal-open"
            );


            const focusable =
                modal.querySelector(
                    "button, a, input, textarea, select"
                );


            if (focusable) {

                window.setTimeout(
                    function () {

                        focusable.focus();

                    },
                    50
                );

            }

        }


        function closeModal(modal) {

            if (!modal) {

                return;

            }


            modal.classList.remove(
                "is-open"
            );

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

            document.body.classList.remove(
                "modal-open"
            );

        }


        openButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        openModal(
                            getModal(button)
                        );

                    }
                );

            }
        );


        closeButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        const modal =
                            button.closest(
                                '[role="dialog"], .modal'
                            );


                        closeModal(
                            modal
                        );

                    }
                );

            }
        );


        qsa(
            '[role="dialog"], .modal'
        ).forEach(
            function (modal) {

                modal.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target ===
                            modal
                        ) {

                            closeModal(
                                modal
                            );

                        }

                    }
                );

            }
        );


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Escape"
                ) {

                    return;

                }


                const modal =
                    qs(
                        '.modal.is-open, [role="dialog"].is-open'
                    );


                if (modal) {

                    closeModal(
                        modal
                    );

                }

            }
        );

    }



    /* =====================================================
       TABS
       ===================================================== */

    function initTabs() {

        const tabs =
            allExisting(
                SELECTORS.tabs
            );


        if (
            !tabs.length
        ) {

            return;

        }


        function activateTab(
            tab
        ) {

            const group =
                tab.getAttribute(
                    "data-tab-group"
                ) ||
                "default";


            const target =
                tab.getAttribute(
                    "data-tab"
                );


            tabs.forEach(
                function (item) {

                    const itemGroup =
                        item.getAttribute(
                            "data-tab-group"
                        ) ||
                        "default";


                    if (
                        itemGroup !==
                        group
                    ) {

                        return;

                    }


                    const active =
                        item === tab;


                    item.classList.toggle(
                        "active",
                        active
                    );


                    item.setAttribute(
                        "aria-selected",
                        active
                            ? "true"
                            : "false"
                    );

                }
            );


            qsa(
                "[data-tab-panel]"
            ).forEach(
                function (panel) {

                    const panelGroup =
                        panel.getAttribute(
                            "data-tab-group"
                        ) ||
                        "default";


                    const panelTarget =
                        panel.getAttribute(
                            "data-tab-panel"
                        );


                    if (
                        panelGroup !==
                        group
                    ) {

                        return;

                    }


                    const active =
                        panelTarget ===
                        target;


                    panel.classList.toggle(
                        "active",
                        active
                    );


                    panel.hidden =
                        !active;

                }
            );

        }


        tabs.forEach(
            function (tab) {

                tab.addEventListener(
                    "click",
                    function () {

                        activateTab(
                            tab
                        );

                    }
                );

            }
        );


        const firstByGroup =
            new Map();


        tabs.forEach(
            function (tab) {

                const group =
                    tab.getAttribute(
                        "data-tab-group"
                    ) ||
                    "default";


                if (
                    !firstByGroup.has(
                        group
                    )
                ) {

                    firstByGroup.set(
                        group,
                        tab
                    );

                }

            }
        );


        firstByGroup.forEach(
            function (tab) {

                activateTab(
                    tab
                );

            }
        );

    }



    /* =====================================================
       ACTIVE NAVIGATION
       ===================================================== */

    function initActiveNavigation() {

        const links =
            qsa(
                "nav a, .nav-menu a, .mobile-nav a"
            );


        if (
            !links.length
        ) {

            return;

        }


        const current =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        if (!current) {

            return;

        }


        links.forEach(
            function (link) {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !href ||
                    href.startsWith("#") ||
                    href.startsWith("javascript:")
                ) {

                    return;

                }


                let url;


                try {

                    url =
                        new URL(
                            href,
                            window.location.href
                        );

                } catch (
                    error
                ) {

                    return;

                }


                const file =
                    url.pathname
                        .split("/")
                        .pop()
                        .toLowerCase();


                if (
                    file &&
                    file === current
                ) {

                    link.classList.add(
                        "active"
                    );

                }

            }
        );

    }



    /* =====================================================
       BACK TO TOP
       ===================================================== */

    function initBackToTop() {

        const buttons =
            qsa(
                "[data-back-to-top]"
            );


        if (
            !buttons.length
        ) {

            return;

        }


        function update() {

            const visible =
                window.scrollY >
                500;


            buttons.forEach(
                function (button) {

                    button.classList.toggle(
                        "is-visible",
                        visible
                    );

                }
            );

        }


        buttons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        window.scrollTo(
                            {
                                top: 0,
                                behavior:
                                    window.matchMedia(
                                        "(prefers-reduced-motion: reduce)"
                                    ).matches
                                        ? "auto"
                                        : "smooth"
                            }
                        );

                    }
                );

            }
        );


        window.addEventListener(
            "scroll",
            update,
            {
                passive: true
            }
        );


        update();

    }



    /* =====================================================
       EXTERNAL TARGET
       ===================================================== */

    function initExternalTargets() {

        const links =
            qsa(
                'a[target="_blank"]'
            );


        links.forEach(
            function (link) {

                const current =
                    link.getAttribute(
                        "rel"
                    ) || "";


                const values =
                    new Set(
                        current
                            .split(/\s+/)
                            .filter(Boolean)
                    );


                values.add(
                    "noopener"
                );

                values.add(
                    "noreferrer"
                );


                link.setAttribute(
                    "rel",
                    Array.from(
                        values
                    ).join(" ")
                );

            }
        );

    }



    /* =====================================================
       DISABLE EMPTY LINKS
       ===================================================== */

    function initEmptyLinks() {

        const links =
            qsa(
                'a[href="#"]'
            );


        links.forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                    }
                );

            }
        );

    }



    /* =====================================================
       IMAGE ERROR HANDLER
       ===================================================== */

    function initImageFallback() {

        const images =
            qsa(
                "img"
            );


        images.forEach(
            function (image) {

                image.addEventListener(
                    "error",
                    function () {

                        image.classList.add(
                            "image-error"
                        );

                    }
                );

            }
        );

    }



    /* =====================================================
       SAFE JSON
       ===================================================== */

    function parseJSON(
        value,
        fallback
    ) {

        if (
            typeof value !==
            "string"
        ) {

            return fallback;

        }


        try {

            return JSON.parse(
                value
            );

        } catch (
            error
        ) {

            return fallback;

        }

    }


    Mandala.parseJSON =
        parseJSON;



    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHTML(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    Mandala.escapeHTML =
        escapeHTML;



    /* =====================================================
       DATE FORMAT
       ===================================================== */

    function formatDate(
        value,
        options
    ) {

        if (!value) {

            return "";

        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        const settings =
            Object.assign(
                {
                    day:
                        "numeric",

                    month:
                        "long",

                    year:
                        "numeric"
                },
                options || {}
            );


        try {

            return new Intl.DateTimeFormat(
                "id-ID",
                settings
            ).format(
                date
            );

        } catch (
            error
        ) {

            return "";

        }

    }


    Mandala.formatDate =
        formatDate;



    /* =====================================================
       DEBOUNCE
       ===================================================== */

    function debounce(
        callback,
        delay
    ) {

        let timer = null;


        return function () {

            const context =
                this;

            const args =
                arguments;


            window.clearTimeout(
                timer
            );


            timer =
                window.setTimeout(
                    function () {

                        callback.apply(
                            context,
                            args
                        );

                    },
                    delay
                );

        };

    }


    Mandala.debounce =
        debounce;



    /* =====================================================
       THROTTLE
       ===================================================== */

    function throttle(
        callback,
        delay
    ) {

        let lastCall = 0;


        return function () {

            const now =
                Date.now();


            if (
                now - lastCall <
                delay
            ) {

                return;

            }


            lastCall =
                now;


            callback.apply(
                this,
                arguments
            );

        };

    }


    Mandala.throttle =
        throttle;



    /* =====================================================
       PAGE LOADING STATE
       ===================================================== */

    function initPageState() {

        document.documentElement.classList.add(
            "js"
        );


        window.addEventListener(
            "load",
            function () {

                document.documentElement.classList.add(
                    "page-loaded"
                );

            },
            {
                once: true
            }
        );

    }



    /* =====================================================
       PUBLIC INITIALIZATION
       ===================================================== */

    function init() {

        initPageState();

        initHeader();

        initMobileMenu();

        initSmoothLinks();

        initReveal();

        initLazyImages();

        initVideo();

        initModal();

        initTabs();

        initActiveNavigation();

        initBackToTop();

        initExternalTargets();

        initEmptyLinks();

        initImageFallback();

    }


    Mandala.init =
        init;



    /* =====================================================
       START
       ===================================================== */

    ready(
        init
    );


})();
