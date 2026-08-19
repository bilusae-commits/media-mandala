import {
    requireStaff,
    logout
} from "./cms-service.js";


/* =====================================================
   ELEMENTS
===================================================== */

const userName =
    document.getElementById(
        "user-name"
    );

const userRole =
    document.getElementById(
        "user-role"
    );

const accessRole =
    document.getElementById(
        "access-role"
    );

const welcomeMessage =
    document.getElementById(
        "welcome-message"
    );

const adminMenu =
    document.getElementById(
        "admin-menu"
    );

const logoutButton =
    document.getElementById(
        "logout-button"
    );


/* =====================================================
   INIT
===================================================== */

async function init() {

    try {

        const profile =
            await requireStaff();


        if (!profile) {
            return;
        }


        /* ---------------------------------------------
           PROFILE
        --------------------------------------------- */

        const name =
            profile.full_name ||
            profile.email ||
            "Pengguna";


        const role =
            profile.role ||
            "user";


        userName.textContent =
            name;


        userRole.textContent =
            role;


        accessRole.textContent =
            role;


        welcomeMessage.textContent =
            `Selamat datang, ${name}.`;


        /* ---------------------------------------------
           ADMIN MENU
        --------------------------------------------- */

        if (
            role === "admin"
        ) {

            adminMenu.style.display =
                "";

        } else {

            adminMenu.style.display =
                "none";
        }


    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );


        alert(
            "Gagal memuat dashboard."
        );

    }

}


/* =====================================================
   LOGOUT
===================================================== */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await logout();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


/* =====================================================
   START
===================================================== */

init();
