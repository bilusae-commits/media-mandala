/* =========================================================
   MANDALA CHANNEL
   MANDALA-PUBLIC.JS
   ---------------------------------------------------------
   PUBLIC DATA LAYER

   Fungsi:
   - Menyiapkan fondasi data publik
   - Helper untuk artikel, topic, video, podcast, dll
   - Tidak melakukan request internet otomatis
   - Tidak memanggil Supabase saat halaman dibuka
   - Tidak mengubah tampilan halaman secara paksa
   - Siap dihubungkan ke Supabase pada tahap berikutnya
   ========================================================= */

(function (window) {

    "use strict";


    /* =====================================================
       NAMESPACE
       ===================================================== */

    window.Mandala =
        window.Mandala || {};


    const Public =
        window.Mandala.Public =
        window.Mandala.Public || {};



    /* =====================================================
       STATUS
       ===================================================== */

    Public.status = {

        initialized: false,

        connected: false,

        loading: false

    };



    /* =====================================================
       DEFAULT DATA STRUCTURE
       ===================================================== */

    Public.emptyData = {

        articles: [],

        topics: [],

        videos: [],

        podcasts: [],

        playlists: [],

        figures: [],

        traditions: [],

        locations: [],

        categories: []

    };



    /* =====================================================
       LOCAL DATA STORE
       ===================================================== */

    let store =
        Object.assign(
            {},
            Public.emptyData
        );


    Public.store =
        store;



    /* =====================================================
       INITIALIZE
       ===================================================== */

    function init() {

        if (
            Public.status.initialized
        ) {

            return;

        }


        Public.status.initialized =
            true;


        /*
         * Penting:
         * Tidak ada fetch()
         * Tidak ada request CDN
         * Tidak ada koneksi Supabase
         * pada tahap ini.
         */


        return Public;

    }


    Public.init =
        init;



    /* =====================================================
       RESET STORE
       ===================================================== */

    function reset() {

        store =
            Object.assign(
                {},
                Public.emptyData
            );


        Public.store =
            store;


        return store;

    }


    Public.reset =
        reset;



    /* =====================================================
       SET DATA
       ===================================================== */

    function set(
        key,
        data
    ) {

        if (
            !Object.prototype.hasOwnProperty.call(
                Public.emptyData,
                key
            )
        ) {

            return false;

        }


        if (
            !Array.isArray(data)
        ) {

            data = [];

        }


        store[key] =
            data;


        Public.store =
            store;


        return true;

    }


    Public.set =
        set;



    /* =====================================================
       GET DATA
       ===================================================== */

    function get(
        key
    ) {

        if (
            !Object.prototype.hasOwnProperty.call(
                Public.emptyData,
                key
            )
        ) {

            return [];

        }


        return store[key] || [];

    }


    Public.get =
        get;



    /* =====================================================
       GET ALL DATA
       ===================================================== */

    function getAll() {

        return Object.assign(
            {},
            store
        );

    }


    Public.getAll =
        getAll;



    /* =====================================================
       FIND BY ID
       ===================================================== */

    function findById(
        key,
        id
    ) {

        const data =
            get(key);


        if (
            id === null ||
            id === undefined
        ) {

            return null;

        }


        return (
            data.find(
                function (item) {

                    return (
                        String(
                            item.id
                        ) ===
                        String(id)
                    );

                }
            ) || null
        );

    }


    Public.findById =
        findById;



    /* =====================================================
       FIND BY SLUG
       ===================================================== */

    function findBySlug(
        key,
        slug
    ) {

        const data =
            get(key);


        if (
            !slug
        ) {

            return null;

        }


        const normalized =
            String(slug)
                .trim()
                .toLowerCase();


        return (
            data.find(
                function (item) {

                    if (
                        !item.slug
                    ) {

                        return false;

                    }


                    return (
                        String(
                            item.slug
                        )
                        .trim()
                        .toLowerCase() ===
                        normalized
                    );

                }
            ) || null
        );

    }


    Public.findBySlug =
        findBySlug;



    /* =====================================================
       FILTER
       ===================================================== */

    function filter(
        key,
        callback
    ) {

        const data =
            get(key);


        if (
            typeof callback !==
            "function"
        ) {

            return data;

        }


        return data.filter(
            callback
        );

    }


    Public.filter =
        filter;



    /* =====================================================
       SEARCH
       ===================================================== */

    function search(
        key,
        query,
        fields
    ) {

        const data =
            get(key);


        if (
            !query
        ) {

            return data;

        }


        const normalizedQuery =
            String(query)
                .trim()
                .toLowerCase();


        if (
            !normalizedQuery
        ) {

            return data;

        }


        const searchableFields =
            Array.isArray(fields) &&
            fields.length
                ? fields
                : [
                    "title",
                    "name",
                    "description",
                    "excerpt",
                    "content",
                    "category",
                    "topic"
                ];


        return data.filter(
            function (item) {

                return searchableFields.some(
                    function (field) {

                        const value =
                            item[field];


                        if (
                            value ===
                            null ||
                            value ===
                            undefined
                        ) {

                            return false;

                        }


                        return String(value)
                            .toLowerCase()
                            .includes(
                                normalizedQuery
                            );

                    }
                );

            }
        );

    }


    Public.search =
        search;



    /* =====================================================
       SORT BY DATE
       ===================================================== */

    function sortByDate(
        data,
        field,
        descending
    ) {

        if (
            !Array.isArray(data)
        ) {

            return [];

        }


        const dateField =
            field ||
            "published_at";


        const result =
            [...data];


        result.sort(
            function (a, b) {

                const first =
                    new Date(
                        a[dateField] || 0
                    ).getTime();


                const second =
                    new Date(
                        b[dateField] || 0
                    ).getTime();


                return descending === false
                    ? first - second
                    : second - first;

            }
        );


        return result;

    }


    Public.sortByDate =
        sortByDate;



    /* =====================================================
       SORT BY ORDER
       ===================================================== */

    function sortByOrder(
        data,
        field
    ) {

        if (
            !Array.isArray(data)
        ) {

            return [];

        }


        const orderField =
            field ||
            "sort_order";


        return [...data].sort(
            function (a, b) {

                const first =
                    Number(
                        a[orderField]
                    ) || 0;


                const second =
                    Number(
                        b[orderField]
                    ) || 0;


                return first -
                    second;

            }
        );

    }


    Public.sortByOrder =
        sortByOrder;



    /* =====================================================
       LIMIT
       ===================================================== */

    function limit(
        data,
        amount
    ) {

        if (
            !Array.isArray(data)
        ) {

            return [];

        }


        const number =
            Number(amount);


        if (
            !Number.isFinite(number) ||
            number < 1
        ) {

            return [];

        }


        return data.slice(
            0,
            number
        );

    }


    Public.limit =
        limit;



    /* =====================================================
       PAGINATION
       ===================================================== */

    function paginate(
        data,
        page,
        perPage
    ) {

        if (
            !Array.isArray(data)
        ) {

            return {

                items: [],

                page: 1,

                perPage: 0,

                total: 0,

                totalPages: 0

            };

        }


        const currentPage =
            Math.max(
                1,
                Number(page) || 1
            );


        const amount =
            Math.max(
                1,
                Number(perPage) || 10
            );


        const total =
            data.length;


        const totalPages =
            Math.ceil(
                total /
                amount
            );


        const start =
            (
                currentPage -
                1
            ) *
            amount;


        return {

            items:
                data.slice(
                    start,
                    start + amount
                ),

            page:
                currentPage,

            perPage:
                amount,

            total:
                total,

            totalPages:
                totalPages

        };

    }


    Public.paginate =
        paginate;



    /* =====================================================
       NORMALIZE ARTICLE
       ===================================================== */

    function normalizeArticle(
        item
    ) {

        if (
            !item ||
            typeof item !==
            "object"
        ) {

            return null;

        }


        return {

            id:
                item.id ??
                null,

            title:
                item.title ??
                "",

            slug:
                item.slug ??
                "",

            excerpt:
                item.excerpt ??
                "",

            content:
                item.content ??
                "",

            image:
                item.image ??
                item.cover_image ??
                item.thumbnail ??
                "",

            category:
                item.category ??
                "",

            topic:
                item.topic ??
                "",

            author:
                item.author ??
                "",

            published_at:
                item.published_at ??
                item.created_at ??
                null,

            updated_at:
                item.updated_at ??
                null

        };

    }


    Public.normalizeArticle =
        normalizeArticle;



    /* =====================================================
       NORMALIZE VIDEO
       ===================================================== */

    function normalizeVideo(
        item
    ) {

        if (
            !item ||
            typeof item !==
            "object"
        ) {

            return null;

        }


        return {

            id:
                item.id ??
                null,

            title:
                item.title ??
                "",

            slug:
                item.slug ??
                "",

            description:
                item.description ??
                "",

            thumbnail:
                item.thumbnail ??
                item.cover_image ??
                "",

            video_url:
                item.video_url ??
                item.url ??
                "",

            duration:
                item.duration ??
                "",

            category:
                item.category ??
                "",

            published_at:
                item.published_at ??
                item.created_at ??
                null

        };

    }


    Public.normalizeVideo =
        normalizeVideo;



    /* =====================================================
       NORMALIZE PODCAST
       ===================================================== */

    function normalizePodcast(
        item
    ) {

        if (
            !item ||
            typeof item !==
            "object"
        ) {

            return null;

        }


        return {

            id:
                item.id ??
                null,

            title:
                item.title ??
                "",

            slug:
                item.slug ??
                "",

            description:
                item.description ??
                "",

            thumbnail:
                item.thumbnail ??
                item.cover_image ??
                "",

            audio_url:
                item.audio_url ??
                item.url ??
                "",

            duration:
                item.duration ??
                "",

            host:
                item.host ??
                "",

            guest:
                item.guest ??
                "",

            published_at:
                item.published_at ??
                item.created_at ??
                null

        };

    }


    Public.normalizePodcast =
        normalizePodcast;



    /* =====================================================
       NORMALIZE TOPIC
       ===================================================== */

    function normalizeTopic(
        item
    ) {

        if (
            !item ||
            typeof item !==
            "object"
        ) {

            return null;

        }


        return {

            id:
                item.id ??
                null,

            title:
                item.title ??
                item.name ??
                "",

            slug:
                item.slug ??
                "",

            description:
                item.description ??
                "",

            image:
                item.image ??
                item.cover_image ??
                "",

            type:
                item.type ??
                "topic",

            active:
                item.active !==
                    undefined
                    ? Boolean(
                        item.active
                    )
                    : true

        };

    }


    Public.normalizeTopic =
        normalizeTopic;



    /* =====================================================
       NORMALIZE PLAYLIST
       ===================================================== */

    function normalizePlaylist(
        item
    ) {

        if (
            !item ||
            typeof item !==
            "object"
        ) {

            return null;

        }


        return {

            id:
                item.id ??
                null,

            title:
                item.title ??
                "",

            slug:
                item.slug ??
                "",

            description:
                item.description ??
                "",

            thumbnail:
                item.thumbnail ??
                item.cover_image ??
                "",

            type:
                item.type ??
                "playlist",

            item_count:
                Number(
                    item.item_count
                ) || 0

        };

    }


    Public.normalizePlaylist =
        normalizePlaylist;



    /* =====================================================
       NORMALIZE GENERIC CONTENT
       ===================================================== */

    function normalize(
        type,
        item
    ) {

        switch (
            type
        ) {

            case "article":

            case "articles":

                return normalizeArticle(
                    item
                );


            case "video":

            case "videos":

                return normalizeVideo(
                    item
                );


            case "podcast":

            case "podcasts":

                return normalizePodcast(
                    item
                );


            case "topic":

            case "topics":

                return normalizeTopic(
                    item
                );


            case "playlist":

            case "playlists":

                return normalizePlaylist(
                    item
                );


            default:

                return item;

        }

    }


    Public.normalize =
        normalize;



    /* =====================================================
       NORMALIZE LIST
       ===================================================== */

    function normalizeList(
        type,
        data
    ) {

        if (
            !Array.isArray(data)
        ) {

            return [];

        }


        return data
            .map(
                function (item) {

                    return normalize(
                        type,
                        item
                    );

                }
            )
            .filter(
                Boolean
            );

    }


    Public.normalizeList =
        normalizeList;



    /* =====================================================
       GET TOPIC
       ===================================================== */

    function getTopic(
        slug
    ) {

        return findBySlug(
            "topics",
            slug
        );

    }


    Public.getTopic =
        getTopic;



    /* =====================================================
       GET ARTICLE
       ===================================================== */

    function getArticle(
        slug
    ) {

        return findBySlug(
            "articles",
            slug
        );

    }


    Public.getArticle =
        getArticle;



    /* =====================================================
       GET VIDEO
       ===================================================== */

    function getVideo(
        slug
    ) {

        return findBySlug(
            "videos",
            slug
        );

    }


    Public.getVideo =
        getVideo;



    /* =====================================================
       GET PODCAST
       ===================================================== */

    function getPodcast(
        slug
    ) {

        return findBySlug(
            "podcasts",
            slug
        );

    }


    Public.getPodcast =
        getPodcast;



    /* =====================================================
       GET PLAYLIST
       ===================================================== */

    function getPlaylist(
        slug
    ) {

        return findBySlug(
            "playlists",
            slug
        );

    }


    Public.getPlaylist =
        getPlaylist;



    /* =====================================================
       CONTENT TYPE CHECK
       ===================================================== */

    function isPublished(
        item
    ) {

        if (
            !item ||
            typeof item !==
            "object"
        ) {

            return false;

        }


        if (
            item.published ===
            false
        ) {

            return false;

        }


        if (
            item.status &&
            String(
                item.status
            ).toLowerCase() ===
            "draft"
        ) {

            return false;

        }


        return true;

    }


    Public.isPublished =
        isPublished;



    /* =====================================================
       FILTER PUBLISHED
       ===================================================== */

    function published(
        data
    ) {

        if (
            !Array.isArray(data)
        ) {

            return [];

        }


        return data.filter(
            isPublished
        );

    }


    Public.published =
        published;



    /* =====================================================
       IMAGE URL
       ===================================================== */

    function imageURL(
        item,
        fallback
    ) {

        if (
            typeof item ===
            "string"
        ) {

            return item;

        }


        if (
            !item ||
            typeof item !==
            "object"
        ) {

            return fallback ||
                "";

        }


        return (
            item.image ||
            item.thumbnail ||
            item.cover_image ||
            item.cover ||
            fallback ||
            ""
        );

    }


    Public.imageURL =
        imageURL;



    /* =====================================================
       VIDEO URL
       ===================================================== */

    function videoURL(
        item
    ) {

        if (
            typeof item ===
            "string"
        ) {

            return item;

        }


        if (
            !item ||
            typeof item !==
            "object"
        ) {

            return "";

        }


        return (
            item.video_url ||
            item.video ||
            item.url ||
            ""
        );

    }


    Public.videoURL =
        videoURL;



    /* =====================================================
       AUDIO URL
       ===================================================== */

    function audioURL(
        item
    ) {

        if (
            typeof item ===
            "string"
        ) {

            return item;

        }


        if (
            !item ||
            typeof item !==
            "object"
        ) {

            return "";

        }


        return (
            item.audio_url ||
            item.audio ||
            item.url ||
            ""
        );

    }


    Public.audioURL =
        audioURL;



    /* =====================================================
       SLUGIFY
       ===================================================== */

    function slugify(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)

            .toLowerCase()

            .trim()

            .normalize(
                "NFD"
            )

            .replace(
                /[\u0300-\u036f]/g,
                ""
            )

            .replace(
                /[^a-z0-9\s-]/g,
                ""
            )

            .replace(
                /\s+/g,
                "-"
            )

            .replace(
                /-+/g,
                "-"
            )

            .replace(
                /^-+|-+$/g,
                ""
            );

    }


    Public.slugify =
        slugify;



    /* =====================================================
       TEXT TRUNCATE
       ===================================================== */

    function truncate(
        text,
        length
    ) {

        if (
            text === null ||
            text === undefined
        ) {

            return "";

        }


        const value =
            String(text)
                .trim();


        const max =
            Number(length) ||
            150;


        if (
            value.length <=
            max
        ) {

            return value;

        }


        return (
            value
                .slice(
                    0,
                    max
                )
                .trimEnd()
            +
            "…"
        );

    }


    Public.truncate =
        truncate;



    /* =====================================================
       EVENT SYSTEM
       ===================================================== */

    const events = {};


    function on(
        name,
        callback
    ) {

        if (
            typeof callback !==
            "function"
        ) {

            return;

        }


        if (
            !events[name]
        ) {

            events[name] = [];

        }


        events[name].push(
            callback
        );

    }


    function off(
        name,
        callback
    ) {

        if (
            !events[name]
        ) {

            return;

        }


        events[name] =
            events[name].filter(
                function (item) {

                    return item !==
                        callback;

                }
            );

    }


    function emit(
        name,
        data
    ) {

        if (
            !events[name]
        ) {

            return;

        }


        events[name].forEach(
            function (callback) {

                try {

                    callback(
                        data
                    );

                } catch (
                    error
                ) {

                    console.error(
                        "[Mandala Public]",
                        error
                    );

                }

            }
        );

    }


    Public.on =
        on;

    Public.off =
        off;

    Public.emit =
        emit;



    /* =====================================================
       SUPABASE CONNECTION PLACEHOLDER
       ===================================================== */

    /*
     * Fungsi ini sengaja belum melakukan koneksi.
     *
     * Nanti setelah struktur CSS + DATA selesai,
     * fungsi ini akan dihubungkan ke:
     *
     * js/supabase-client.js
     *
     * sehingga halaman publik bisa membaca:
     *
     * - artikel
     * - topics
     * - video
     * - podcast
     * - playlist
     * - tokoh
     * - tradisi
     * - dan konten lainnya
     *
     * tanpa perlu mengubah struktur halaman lagi.
     */


    Public.connect =
        function () {

            Public.status.connected =
                false;

            return false;

        };



    /* =====================================================
       DISCONNECT PLACEHOLDER
       ===================================================== */

    Public.disconnect =
        function () {

            Public.status.connected =
                false;

        };



    /* =====================================================
       LOAD PLACEHOLDER
       ===================================================== */

    Public.load =
        async function () {

            /*
             * Sengaja tidak melakukan request.
             */

            return getAll();

        };



    /* =====================================================
       INITIALIZE
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function () {

                init();

            },
            {
                once: true
            }
        );

    } else {

        init();

    }


})(window);
