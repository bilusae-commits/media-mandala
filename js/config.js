/* =========================================================
   MANDALA CHANNEL
   CONFIG.JS
   ---------------------------------------------------------
   KONFIGURASI WEBSITE

   CATATAN:
   - Hanya berisi konfigurasi publik
   - Tidak menyimpan service_role key
   - Tidak melakukan koneksi otomatis
   - Tidak memanggil CDN
   - Tidak melakukan fetch saat halaman dibuka
   - Aman digunakan pada website publik
   ========================================================= */

(function (window) {

    "use strict";


    /* =====================================================
       NAMESPACE
       ===================================================== */

    window.Mandala =
        window.Mandala || {};


    /* =====================================================
       CONFIG
       ===================================================== */

    const config = {

        /* -----------------------------------------------
           WEBSITE
           ----------------------------------------------- */

        site: {

            name:
                "Mandala",

            description:
                "Media Hindu Jawa dan Nusantara",

            language:
                "id-ID"

        },


        /* -----------------------------------------------
           SUPABASE
           ----------------------------------------------- */

        supabase: {

            /*
             * Masukkan URL project Supabase kamu di sini.
             *
             * Contoh:
             *
             * https://xxxxxxxxxxxx.supabase.co
             */

            url:
                "",


            /*
             * Gunakan Publishable Key / anon key.
             *
             * JANGAN memasukkan:
             *
             * service_role
             *
             * secret key
             *
             * private key
             *
             */

            publishableKey:
                "",


            /*
             * Sengaja FALSE.
             *
             * Nanti akan kita ubah ketika
             * database sudah benar-benar siap.
             */

            autoConnect:
                false

        },


        /* -----------------------------------------------
           CONTENT
           ----------------------------------------------- */

        content: {

            /*
             * Jumlah item default yang boleh ditampilkan
             * pada halaman publik.
             */

            defaultLimit:
                12,


            /*
             * Jumlah item untuk section "terbaru".
             */

            latestLimit:
                6,


            /*
             * Jumlah item untuk section terkait.
             */

            relatedLimit:
                6

        },


        /* -----------------------------------------------
           MEDIA
           ----------------------------------------------- */

        media: {

            /*
             * Default image jika sebuah konten
             * belum mempunyai gambar.
             */

            defaultImage:
                "",


            /*
             * Default video thumbnail.
             */

            defaultVideoThumbnail:
                ""

        },


        /* -----------------------------------------------
           FEATURES
           ----------------------------------------------- */

        features: {

            /*
             * Semua fitur database dibuat FALSE
             * sampai struktur Supabase selesai.
             */

            supabase:
                false,

            authentication:
                false,

            editor:
                false,

            admin:
                false,

            storage:
                false

        },


        /* -----------------------------------------------
           DEVELOPMENT
           ----------------------------------------------- */

        development: {

            /*
             * TRUE hanya jika kita sedang debugging.
             */

            debug:
                false,


            /*
             * Jangan menampilkan error teknis
             * kepada pengunjung website.
             */

            showErrors:
                false

        }

    };



    /* =====================================================
       FREEZE CONFIG
       ===================================================== */

    /*
     * Membantu mencegah konfigurasi berubah
     * secara tidak sengaja ketika website berjalan.
     */

    function deepFreeze(
        object
    ) {

        if (
            !object ||
            typeof object !==
            "object"
        ) {

            return object;

        }


        Object.getOwnPropertyNames(
            object
        ).forEach(
            function (property) {

                const value =
                    object[property];


                if (
                    value &&
                    typeof value ===
                    "object" &&
                    !Object.isFrozen(
                        value
                    )
                ) {

                    deepFreeze(
                        value
                    );

                }

            }
        );


        return Object.freeze(
            object
        );

    }


    deepFreeze(
        config
    );



    /* =====================================================
       EXPOSE CONFIG
       ===================================================== */

    window.Mandala.config =
        config;



    /* =====================================================
       SUPABASE CONFIG
       -----------------------------------------------------
       Kita hanya memberikan konfigurasi kepada
       supabase-client.js.

       Tidak melakukan koneksi.
       ===================================================== */

    function setupSupabaseConfig() {

        const supabase =
            window.Mandala.Supabase;


        if (
            !supabase ||
            typeof supabase.setConfig !==
            "function"
        ) {

            return false;

        }


        const url =
            config.supabase.url;


        const key =
            config.supabase.publishableKey;


        if (
            !url ||
            !key
        ) {

            return false;

        }


        return supabase.setConfig(
            url,
            key
        );

    }


    window.Mandala.setupSupabaseConfig =
        setupSupabaseConfig;



    /* =====================================================
       DEBUG HELPER
       ===================================================== */

    function debug(
        ...args
    ) {

        if (
            !config.development.debug
        ) {

            return;

        }


        console.log(
            "[Mandala]",
            ...args
        );

    }


    window.Mandala.debug =
        debug;



    /* =====================================================
       ERROR HELPER
       ===================================================== */

    function reportError(
        error,
        context
    ) {

        if (
            config.development.debug
        ) {

            console.error(
                "[Mandala]",
                context || "",
                error
            );

        }

    }


    window.Mandala.reportError =
        reportError;



    /* =====================================================
       INITIALIZATION
       ===================================================== */

    /*
     * Sengaja tidak memanggil:
     *
     * setupSupabaseConfig()
     *
     * secara otomatis.
     *
     * Supabase baru akan kita aktifkan setelah:
     *
     * 1. CSS selesai
     * 2. Data selesai
     * 3. Docs selesai
     * 4. Struktur database selesai
     * 5. Role Admin & Editor selesai
     */

})(window);
