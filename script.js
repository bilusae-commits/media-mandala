/* =========================================================
   MEDIA MANDALA
   GLOBAL JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       MOBILE MENU
       ===================================================== */

    const menuToggle = document.querySelector(".menu-toggle");
    const mainNav = document.querySelector(".main-nav");

    if (menuToggle && mainNav) {

        menuToggle.addEventListener("click", function () {

            const isOpen =
                mainNav.classList.toggle("active");

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

        });


        /* ================================================
           TUTUP MENU SAAT LINK DIKLIK
           ================================================ */

        const navLinks =
            document.querySelectorAll(".main-nav a");

        navLinks.forEach(function (link) {

            link.addEventListener("click", function () {

                mainNav.classList.remove("active");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });


        /* ================================================
           TUTUP MENU SAAT KLIK DI LUAR MENU
           ================================================ */

        document.addEventListener("click", function (event) {

            const clickedInsideMenu =
                mainNav.contains(event.target);

            const clickedToggle =
                menuToggle.contains(event.target);

            if (
                !clickedInsideMenu &&
                !clickedToggle
            ) {

                mainNav.classList.remove("active");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        });


        /* ================================================
           TUTUP MENU SAAT ESC
           ================================================ */

        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    mainNav.classList.remove("active");

                    menuToggle.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }
        );

    }


    /* =====================================================
       HEADER ACTIVE MENU
       ===================================================== */

    const currentPage =
        window.location.pathname
            .split("/")
            .pop() || "index.html";

    const allNavLinks =
        document.querySelectorAll(".main-nav a");

    allNavLinks.forEach(function (link) {

        const linkPage =
            link.getAttribute("href");

        if (
            linkPage &&
            !linkPage.startsWith("#") &&
            linkPage === currentPage
        ) {

            allNavLinks.forEach(function (item) {
                item.classList.remove("active");
            });

            link.classList.add("active");

        }

    });


    /* =====================================================
       ANIMASI SAAT ELEMEN MASUK LAYAR
       ===================================================== */

    const animatedElements =
        document.querySelectorAll(
            ".section-label, " +
            ".section-title, " +
            ".featured-story, " +
            ".story-item, " +
            ".program-card, " +
            ".video-card, " +
            ".event-card"
        );


    /* =====================================================
       REDUCED MOTION
       ===================================================== */

    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    if (!prefersReducedMotion) {

        animatedElements.forEach(function (element) {

            element.classList.add("scroll-hidden");

        });


        const observer =
            new IntersectionObserver(
                function (entries, observer) {

                    entries.forEach(function (entry) {

                        if (entry.isIntersecting) {

                            entry.target.classList.add(
                                "scroll-show"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.12,
                    rootMargin: "0px 0px -40px 0px"
                }
            );


        animatedElements.forEach(function (element) {

            observer.observe(element);

        });

    }


    /* =====================================================
       SMOOTH SCROLL UNTUK LINK ANCHOR
       ===================================================== */

    const anchorLinks =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    anchorLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            function (event) {

                const targetId =
                    this.getAttribute("href");

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


                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    });


    /* =====================================================
       VIDEO CARD
       ===================================================== */

    const videoCards =
        document.querySelectorAll(
            ".video-card[data-youtube-id]"
        );


    videoCards.forEach(function (card) {

        const youtubeId =
            card.getAttribute(
                "data-youtube-id"
            );


        if (!youtubeId) {
            return;
        }


        card.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                const youtubeUrl =
                    "https://www.youtube.com/watch?v=" +
                    youtubeId;


                window.open(
                    youtubeUrl,
                    "_blank",
                    "noopener"
                );

            }
        );

    });


    /* =====================================================
       KLIK GAMBAR VIDEO
       ===================================================== */

    const playButtons =
        document.querySelectorAll(
            ".play-button"
        );


    playButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                const card =
                    this.closest(
                        ".video-card"
                    );


                if (!card) {
                    return;
                }


                const youtubeId =
                    card.getAttribute(
                        "data-youtube-id"
                    );


                if (!youtubeId) {

                    event.preventDefault();

                    return;

                }


                event.preventDefault();
                event.stopPropagation();


                window.open(
                    "https://www.youtube.com/watch?v=" +
                    youtubeId,
                    "_blank",
                    "noopener"
                );

            }
        );

    });


    /* =====================================================
       HEADER SHADOW SAAT SCROLL
       ===================================================== */

    const header =
        document.querySelector(
            ".site-header"
        );


    if (header) {

        function updateHeader() {

            if (window.scrollY > 20) {

                header.classList.add(
                    "header-scrolled"
                );

            } else {

                header.classList.remove(
                    "header-scrolled"
                );

            }

        }


        window.addEventListener(
            "scroll",
            updateHeader,
            {
                passive: true
            }
        );


        updateHeader();

    }


    /* =====================================================
       LOG
       ===================================================== */

    console.log(
        "Media Mandala — JavaScript aktif."
    );

});
