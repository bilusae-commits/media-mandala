/* =========================================================
   MEDIA MANDALA
   MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   1. MOBILE MENU
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const menuToggle = document.querySelector(".menu-toggle");
    const mainNav = document.querySelector(".main-nav");

    if (menuToggle && mainNav) {

        menuToggle.addEventListener("click", function () {

            const isOpen = mainNav.classList.toggle("active");

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

        });


        /* Tutup menu setelah memilih menu */

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


        /* Tutup menu jika klik di luar */

        document.addEventListener("click", function (event) {

            const clickedInsideMenu =
                mainNav.contains(event.target);

            const clickedToggle =
                menuToggle.contains(event.target);

            if (
                !clickedInsideMenu &&
                !clickedToggle &&
                mainNav.classList.contains("active")
            ) {

                mainNav.classList.remove("active");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        });

    }


    /* =====================================================
       2. ACTIVE MENU SAAT SCROLL
       ===================================================== */

    const sections = document.querySelectorAll(
        "main section[id], footer[id]"
    );

    const navLinks = document.querySelectorAll(
        ".main-nav a"
    );


    function updateActiveMenu() {

        const scrollPosition =
            window.scrollY + 150;

        let currentSection = "";

        sections.forEach(function (section) {

            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (
                scrollPosition >= sectionTop &&
                scrollPosition < sectionTop + sectionHeight
            ) {

                currentSection = section.getAttribute("id");

            }

        });


        navLinks.forEach(function (link) {

            link.classList.remove("active");

            const href =
                link.getAttribute("href");

            if (
                href &&
                href === "#" + currentSection
            ) {

                link.classList.add("active");

            }

        });


        /* Jika berada paling atas */

        if (window.scrollY < 100) {

            navLinks.forEach(function (link) {

                link.classList.remove("active");

            });

            const homeLink =
                document.querySelector(
                    '.main-nav a[href="#"]'
                );

            if (homeLink) {
                homeLink.classList.add("active");
            }

        }

    }


    window.addEventListener(
        "scroll",
        updateActiveMenu,
        { passive: true }
    );


    updateActiveMenu();


    /* =====================================================
       3. SMOOTH SCROLL
       ===================================================== */

    document
        .querySelectorAll('a[href^="#"]')
        .forEach(function (link) {

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

                const header =
                    document.querySelector(".site-header");

                const headerHeight =
                    header
                        ? header.offsetHeight
                        : 0;

                const targetPosition =
                    target.getBoundingClientRect().top +
                    window.scrollY -
                    headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth"
                });

            });

        });


    /* =====================================================
       4. VIDEO YOUTUBE
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

        card.addEventListener("click", function (event) {

            event.preventDefault();

            const youtubeUrl =
                "https://www.youtube.com/watch?v=" +
                youtubeId;

            window.open(
                youtubeUrl,
                "_blank",
                "noopener,noreferrer"
            );

        });

    });


    /* =====================================================
       5. HEADER SCROLL EFFECT
       ===================================================== */

    const header =
        document.querySelector(".site-header");


    function updateHeader() {

        if (!header) {
            return;
        }

        if (window.scrollY > 20) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }

    }


    window.addEventListener(
        "scroll",
        updateHeader,
        { passive: true }
    );


    updateHeader();


    /* =====================================================
       6. CLOSE MOBILE MENU SAAT RESIZE
       ===================================================== */

    window.addEventListener("resize", function () {

        if (
            window.innerWidth > 700 &&
            mainNav
        ) {

            mainNav.classList.remove("active");

            if (menuToggle) {

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }

    });


    /* =====================================================
       7. IMAGE ERROR HANDLING
       ===================================================== */

    const images =
        document.querySelectorAll("img");


    images.forEach(function (image) {

        image.addEventListener(
            "error",
            function () {

                this.classList.add(
                    "image-error"
                );

            }
        );

    });


});
