/* =========================================================
   MEDIA MANDALA
   MAIN JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       MOBILE MENU
       ===================================================== */

    const menuToggle = document.querySelector(".menu-toggle");
    const mainNav = document.querySelector(".main-nav");

    if (menuToggle && mainNav) {

        menuToggle.addEventListener("click", function () {

            mainNav.classList.toggle("active");

            const isOpen = mainNav.classList.contains("active");

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen
            );

        });


        /* ================================================
           TUTUP MENU SETELAH LINK DIKLIK
           ================================================ */

        const navLinks = mainNav.querySelectorAll("a");

        navLinks.forEach(function (link) {

            link.addEventListener("click", function () {

                mainNav.classList.remove("active");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });

    }


    /* =====================================================
       HEADER SAAT SCROLL
       ===================================================== */

    const header = document.querySelector(".site-header");

    if (header) {

        window.addEventListener("scroll", function () {

            if (window.scrollY > 20) {

                header.classList.add("scrolled");

            } else {

                header.classList.remove("scrolled");

            }

        });

    }


    /* =====================================================
       SMOOTH SCROLL
       ===================================================== */

    const anchorLinks = document.querySelectorAll(
        'a[href^="#"]'
    );

    anchorLinks.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId =
                this.getAttribute("href");

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }

            const target =
                document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });


    /* =====================================================
       ACTIVE MENU SAAT SCROLL
       ===================================================== */

    const sections = document.querySelectorAll(
        "main section[id]"
    );

    const sectionLinks =
        document.querySelectorAll(".main-nav a");

    if (sections.length > 0 && sectionLinks.length > 0) {

        const sectionObserver =
            new IntersectionObserver(
                function (entries) {

                    entries.forEach(function (entry) {

                        if (entry.isIntersecting) {

                            const sectionId =
                                entry.target.getAttribute("id");

                            sectionLinks.forEach(function (link) {

                                link.classList.remove("active");

                                const linkTarget =
                                    link.getAttribute("href");

                                if (
                                    linkTarget ===
                                    "#" + sectionId
                                ) {

                                    link.classList.add("active");

                                }

                            });

                        }

                    });

                },
                {
                    rootMargin: "-30% 0px -60% 0px",
                    threshold: 0
                }
            );

        sections.forEach(function (section) {

            sectionObserver.observe(section);

        });

    }


    /* =====================================================
       VIDEO YOUTUBE
       ===================================================== */

    const videoCards =
        document.querySelectorAll(
            ".video-card[data-youtube-id]"
        );

    videoCards.forEach(function (card) {

        const youtubeId =
            card.getAttribute("data-youtube-id");

        if (!youtubeId) {
            return;
        }

        const link = card.querySelector("a");

        if (!link) {
            return;
        }

        link.addEventListener("click", function (event) {

            event.preventDefault();

            window.open(
                "https://www.youtube.com/watch?v=" +
                youtubeId,
                "_blank"
            );

        });

    });


    /* =====================================================
       ANIMASI SAAT ELEMEN MASUK LAYAR
       ===================================================== */

    const animatedElements =
        document.querySelectorAll(
            ".program-card, .video-card, .event-card, .story-item, .featured-story"
        );

    if (
        animatedElements.length > 0 &&
        "IntersectionObserver" in window
    ) {

        const animationObserver =
            new IntersectionObserver(
                function (entries, observer) {

                    entries.forEach(function (entry) {

                        if (entry.isIntersecting) {

                            entry.target.classList.add(
                                "is-visible"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.12
                }
            );

        animatedElements.forEach(function (element) {

            animationObserver.observe(element);

        });

    }


    /* =====================================================
       ESCAPE KEY
       ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key !== "Escape") {
                return;
            }

            if (mainNav && menuToggle) {

                mainNav.classList.remove("active");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


});
