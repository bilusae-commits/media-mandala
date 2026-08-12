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

            const isOpen = mainNav.classList.toggle("active");

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

        });


        /* Tutup menu ketika link diklik */

        mainNav.querySelectorAll("a").forEach(function (link) {

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
       HEADER SCROLL EFFECT
       ===================================================== */

    const header = document.querySelector(".site-header");

    if (header) {

        function updateHeader() {

            if (window.scrollY > 20) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }

        }

        window.addEventListener("scroll", updateHeader);

        updateHeader();

    }


    /* =====================================================
       ACTIVE NAVIGATION
       ===================================================== */

    const navLinks = document.querySelectorAll(
        ".main-nav a[href^='#']"
    );

    const sections = document.querySelectorAll(
        "main section[id]"
    );

    if (navLinks.length && sections.length) {

        const observer = new IntersectionObserver(
            function (entries) {

                entries.forEach(function (entry) {

                    if (entry.isIntersecting) {

                        const currentId =
                            entry.target.getAttribute("id");

                        navLinks.forEach(function (link) {

                            link.classList.remove("active");

                            if (
                                link.getAttribute("href") ===
                                "#" + currentId
                            ) {
                                link.classList.add("active");
                            }

                        });

                    }

                });

            },
            {
                rootMargin: "-35% 0px -55% 0px",
                threshold: 0
            }
        );

        sections.forEach(function (section) {

            observer.observe(section);

        });

    }


    /* =====================================================
       VIDEO CARD
       ===================================================== */

    const videoCards =
        document.querySelectorAll(".video-card");

    videoCards.forEach(function (card) {

        card.addEventListener("click", function (event) {

            const youtubeId =
                card.getAttribute("data-youtube-id");

            /*
             Jika ID YouTube belum diisi,
             jangan lakukan apa-apa.
            */

            if (!youtubeId) {
                return;
            }

            event.preventDefault();

            const youtubeURL =
                "https://www.youtube.com/watch?v=" +
                youtubeId;

            window.open(
                youtubeURL,
                "_blank",
                "noopener,noreferrer"
            );

        });

    });


    /* =====================================================
       CLOSE MOBILE MENU KETIKA KLIK DI LUAR MENU
       ===================================================== */

    document.addEventListener("click", function (event) {

        if (!menuToggle || !mainNav) {
            return;
        }

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


    /* =====================================================
       ESC UNTUK MENUTUP MENU
       ===================================================== */

    document.addEventListener("keydown", function (event) {

        if (event.key !== "Escape") {
            return;
        }

        if (!mainNav || !menuToggle) {
            return;
        }

        mainNav.classList.remove("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

    });

});
