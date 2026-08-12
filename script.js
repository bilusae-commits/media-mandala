/* =========================================================
   MEDIA MANDALA
   MAIN JAVASCRIPT
   Responsive + Navigation + Animation
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENT
    ===================================================== */

    const menuToggle = document.querySelector(".menu-toggle");
    const mainNav = document.querySelector(".main-nav");

    /* =====================================================
       MOBILE MENU
    ===================================================== */

    if (menuToggle && mainNav) {

        menuToggle.addEventListener("click", () => {

            const isOpen = mainNav.classList.toggle("active");

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

        });


        /* Tutup menu ketika link diklik */

        mainNav.querySelectorAll("a").forEach(link => {

            link.addEventListener("click", () => {

                mainNav.classList.remove("active");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });

    }


    /* =====================================================
       HEADER SCROLL EFFECT
    ===================================================== */

    const header = document.querySelector(".site-header");

    if (header) {

        let lastScroll = 0;

        window.addEventListener(
            "scroll",
            () => {

                const currentScroll = window.scrollY;

                if (currentScroll > 40) {
                    header.classList.add("scrolled");
                } else {
                    header.classList.remove("scrolled");
                }

                lastScroll = currentScroll;

            },
            { passive: true }
        );

    }


    /* =====================================================
       ACTIVE NAVIGATION
    ===================================================== */

    const navLinks =
        document.querySelectorAll(".main-nav a");

    const sections =
        document.querySelectorAll("main section[id]");

    if (navLinks.length && sections.length) {

        const updateActiveNav = () => {

            let currentSection = "";

            sections.forEach(section => {

                const sectionTop =
                    section.offsetTop - 150;

                const sectionHeight =
                    section.offsetHeight;

                if (
                    window.scrollY >= sectionTop &&
                    window.scrollY < sectionTop + sectionHeight
                ) {
                    currentSection = section.id;
                }

            });


            navLinks.forEach(link => {

                link.classList.remove("active");

                const target =
                    link.getAttribute("href");

                if (
                    target &&
                    target === `#${currentSection}`
                ) {
                    link.classList.add("active");
                }

            });

        };


        window.addEventListener(
            "scroll",
            updateActiveNav,
            { passive: true }
        );

        updateActiveNav();

    }


    /* =====================================================
       REVEAL ANIMATION
    ===================================================== */

    const revealElements =
        document.querySelectorAll(
            ".section-label, " +
            ".section-title, " +
            ".featured-story, " +
            ".story-item, " +
            ".program-card, " +
            ".video-card, " +
            ".event-card"
        );


    if ("IntersectionObserver" in window) {

        const revealObserver =
            new IntersectionObserver(
                (entries, observer) => {

                    entries.forEach(entry => {

                        if (!entry.isIntersecting) {
                            return;
                        }

                        entry.target.classList.add(
                            "is-visible"
                        );

                        observer.unobserve(
                            entry.target
                        );

                    });

                },
                {
                    threshold: 0.12,
                    rootMargin: "0px 0px -40px 0px"
                }
            );


        revealElements.forEach(element => {

            element.classList.add(
                "reveal"
            );

            revealObserver.observe(
                element
            );

        });

    } else {

        revealElements.forEach(element => {
            element.classList.add("is-visible");
        });

    }


    /* =====================================================
       STAGGER ANIMATION
    ===================================================== */

    const staggerGroups = [
        ".story-list",
        ".program-grid",
        ".video-grid"
    ];


    staggerGroups.forEach(selector => {

        const group =
            document.querySelector(selector);

        if (!group) return;

        const children =
            group.children;

        Array.from(children).forEach(
            (child, index) => {

                child.style.setProperty(
                    "--delay",
                    `${index * 90}ms`
                );

            }
        );

    });


    /* =====================================================
       SMOOTH ANCHOR SCROLL
    ===================================================== */

    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const targetId =
                    link.getAttribute("href");

                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }

                const target =
                    document.querySelector(
                        targetId
                    );

                if (!target) {
                    return;
                }

                event.preventDefault();

                const headerHeight =
                    header
                        ? header.offsetHeight
                        : 0;

                const targetPosition =
                    target.getBoundingClientRect().top +
                    window.scrollY -
                    headerHeight -
                    20;


                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth"
                });

            }
        );

    });


    /* =====================================================
       IMAGE LOAD EFFECT
    ===================================================== */

    const images =
        document.querySelectorAll(
            "img"
        );


    images.forEach(img => {

        if (img.complete) {

            img.classList.add(
                "image-loaded"
            );

        } else {

            img.addEventListener(
                "load",
                () => {

                    img.classList.add(
                        "image-loaded"
                    );

                },
                { once: true }
            );

        }

    });


    /* =====================================================
       YOUTUBE VIDEO CARD
       Jika data-youtube-id diisi,
       klik akan membuka YouTube.
    ===================================================== */

    document.querySelectorAll(
        ".video-card[data-youtube-id]"
    ).forEach(card => {

        const youtubeId =
            card.dataset.youtubeId;

        if (!youtubeId) {
            return;
        }

        card.style.cursor = "pointer";

        card.addEventListener(
            "click",
            () => {

                window.open(
                    `https://www.youtube.com/watch?v=${youtubeId}`,
                    "_blank",
                    "noopener,noreferrer"
                );

            }
        );

    });


    /* =====================================================
       BUTTON HOVER MAGNETIC EFFECT
       Hanya desktop
    ===================================================== */

    const buttons =
        document.querySelectorAll(
            ".btn"
        );


    if (window.matchMedia(
        "(pointer: fine)"
    ).matches) {

        buttons.forEach(button => {

            button.addEventListener(
                "mousemove",
                event => {

                    const rect =
                        button.getBoundingClientRect();

                    const x =
                        event.clientX -
                        rect.left -
                        rect.width / 2;

                    const y =
                        event.clientY -
                        rect.top -
                        rect.height / 2;

                    button.style.transform =
                        `translate(${x * 0.08}px, ${y * 0.08}px)`;

                }
            );


            button.addEventListener(
                "mouseleave",
                () => {

                    button.style.transform =
                        "";

                }
            );

        });

    }


    /* =====================================================
       PREVENT EMPTY LINKS FROM JUMPING
    ===================================================== */

    document.querySelectorAll(
        'a[href="#"]'
    ).forEach(link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();

            }
        );

    });


    /* =====================================================
       CURRENT YEAR
    ===================================================== */

    const yearElements =
        document.querySelectorAll(
            "[data-current-year]"
        );


    yearElements.forEach(element => {

        element.textContent =
            new Date().getFullYear();

    });


    /* =====================================================
       REDUCED MOTION
    ===================================================== */

    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    if (prefersReducedMotion) {

        document.documentElement.classList.add(
            "reduce-motion"
        );

    }


    /* =====================================================
       PAGE READY
    ===================================================== */

    document.body.classList.add(
        "page-ready"
    );

});
