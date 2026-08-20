/* =========================================================
   MANDALA CHANNEL
   PUBLIC CONTENT
   Supabase → Website Publik
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG =
        window.MANDALA_CONFIG || {};

    const SUPABASE_URL =
        CONFIG.SUPABASE_URL || "";

    const SUPABASE_KEY =
        CONFIG.SUPABASE_PUBLISHABLE_KEY ||
        CONFIG.SUPABASE_ANON_KEY ||
        "";


    if (
        !SUPABASE_URL ||
        !SUPABASE_KEY
    ) {

        console.error(
            "[Mandala Public] Supabase config tidak ditemukan."
        );

        return;
    }


    /* =====================================================
       STATE
    ===================================================== */

    let db = null;

    let playlists = [];

    let playlistIndex = 0;

    let playlistTimer = null;

    let playlistCards = [];


    /* =====================================================
       LOAD SUPABASE
    ===================================================== */

    async function loadSupabase() {

        if (
            window.supabase &&
            typeof window.supabase.createClient ===
                "function"
        ) {

            return window.supabase;
        }


        return new Promise(
            (resolve, reject) => {

                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


                script.onload =
                    () => {

                        if (
                            window.supabase &&
                            typeof window.supabase.createClient ===
                                "function"
                        ) {

                            resolve(
                                window.supabase
                            );

                        } else {

                            reject(
                                new Error(
                                    "Supabase library tidak tersedia."
                                )
                            );
                        }
                    };


                script.onerror =
                    () => {

                        reject(
                            new Error(
                                "Gagal memuat Supabase."
                            )
                        );
                    };


                document.head.appendChild(
                    script
                );
            }
        );
    }


    /* =====================================================
       INIT CLIENT
    ===================================================== */

    async function initClient() {

        if (db) {
            return db;
        }


        const supabase =
            await loadSupabase();


        db =
            supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY,
                {
                    auth: {
                        persistSession: false
                    }
                }
            );


        return db;
    }


    /* =====================================================
       VIDEOS
    ===================================================== */

    async function loadVideos() {

        const client =
            await initClient();


        const result =
            await client
                .from("videos")
                .select(
                    `
                    id,
                    title,
                    slug,
                    youtube_url,
                    youtube_video_id,
                    thumbnail_url,
                    description,
                    category_id,
                    status,
                    featured,
                    published_at,
                    created_at,
                    updated_at
                    `
                )
                .eq(
                    "status",
                    "published"
                )
                .order(
                    "published_at",
                    {
                        ascending: false,
                        nullsFirst: false
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (result.error) {
            throw result.error;
        }


        return result.data || [];
    }


    /* =====================================================
       PLAYLISTS
    ===================================================== */

    async function loadPlaylists() {

        const client =
            await initClient();


        const result =
            await client
                .from("playlists")
                .select(
                    `
                    id,
                    title,
                    slug,
                    youtube_playlist_id,
                    description,
                    cover_image_url,
                    category_id,
                    status,
                    featured,
                    sort_order,
                    created_at,
                    updated_at
                    `
                )
                .eq(
                    "status",
                    "published"
                )
                .order(
                    "sort_order",
                    {
                        ascending: true,
                        nullsFirst: false
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (result.error) {
            throw result.error;
        }


        return result.data || [];
    }


    /* =====================================================
       CATEGORIES
    ===================================================== */

    async function loadCategories() {

        const client =
            await initClient();


        const result =
            await client
                .from("categories")
                .select(
                    `
                    id,
                    name,
                    slug
                    `
                )
                .order(
                    "name",
                    {
                        ascending: true
                    }
                );


        if (result.error) {
            throw result.error;
        }


        return result.data || [];
    }


    /* =====================================================
       CATEGORY MAP
    ===================================================== */

    function categoryMap(
        categories
    ) {

        const map = {};

        categories.forEach(
            category => {

                map[
                    category.id
                ] =
                    category;
            }
        );


        return map;
    }


    /* =====================================================
       YOUTUBE THUMBNAIL
    ===================================================== */

    function youtubeThumbnail(
        video
    ) {

        if (
            video.thumbnail_url
        ) {

            return video.thumbnail_url;
        }


        if (
            video.youtube_video_id
        ) {

            return (
                "https://i.ytimg.com/vi/" +
                encodeURIComponent(
                    video.youtube_video_id
                ) +
                "/hqdefault.jpg"
            );
        }


        return "";
    }


    /* =====================================================
       YOUTUBE ID
    ===================================================== */

    function youtubeId(
        video
    ) {

        if (
            video.youtube_video_id
        ) {

            return video.youtube_video_id;
        }


        const url =
            video.youtube_url;


        if (!url) {
            return "";
        }


        const match =
            String(url).match(
                /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/i
            );


        return match
            ? match[1]
            : "";
    }


    /* =====================================================
       ESCAPE
    ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
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


    /* =====================================================
       HOMEPAGE VIDEOS
    ===================================================== */

    function renderVideos(
        videos,
        categories
    ) {

        const map =
            categoryMap(
                categories
            );


        /*
         * Homepage tidak punya
         * data-render="videos"
         * pada versi lama.
         *
         * Jadi kita cari section
         * video berdasarkan elemen
         * yang tersedia.
         */

        const targets =
            document.querySelectorAll(
                '[data-render="videos"]'
            );


        targets.forEach(
            target => {

                target.innerHTML =
                    videos
                        .map(
                            video => {

                                const category =
                                    map[
                                        video.category_id
                                    ];


                                const id =
                                    youtubeId(
                                        video
                                    );


                                return `

                                    <article
                                        class="card"
                                    >

                                        <a
                                            href="#"
                                            onclick="
                                                openPublicVideo(
                                                    '${escapeHtml(id)}',
                                                    '${escapeHtml(video.title)}'
                                                );
                                                return false;
                                            "
                                        >

                                            <div
                                                class="thumb"
                                            >

                                                <img
                                                    src="${escapeHtml(
                                                        youtubeThumbnail(
                                                            video
                                                        )
                                                    )}"
                                                    alt="${escapeHtml(
                                                        video.title
                                                    )}"
                                                    loading="lazy"
                                                >

                                                <span
                                                    class="badge"
                                                >
                                                    ${escapeHtml(
                                                        category?.name ||
                                                        "VIDEO"
                                                    )}
                                                </span>

                                            </div>


                                            <div
                                                class="meta"
                                            >
                                                VIDEO
                                            </div>


                                            <h3>
                                                ${escapeHtml(
                                                    video.title
                                                )}
                                            </h3>


                                            <p>
                                                Putar video →
                                            </p>

                                        </a>

                                    </article>

                                `;
                            }
                        )
                        .join("");
            }
        );
    }


    /* =====================================================
       PLAYLIST
    ===================================================== */

    function renderPlaylists(
        items,
        categories
    ) {

        const track =
            document.getElementById(
                "playlistTrack"
            );


        const dots =
            document.getElementById(
                "playlistDots"
            );


        if (!track) {
            return;
        }


        playlists =
            items || [];


        if (!playlists.length) {

            track.innerHTML = "";

            if (dots) {
                dots.innerHTML = "";
            }

            return;
        }


        const map =
            categoryMap(
                categories
            );


        track.innerHTML =
            playlists
                .map(
                    (
                        playlist,
                        index
                    ) => {

                        const category =
                            map[
                                playlist.category_id
                            ];


                        const title =
                            escapeHtml(
                                playlist.title ||
                                "Playlist"
                            );


                        let image =
                            playlist.cover_image_url ||
                            "";


                        if (!image) {

                            image =
                                "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85";
                        }


                        return `

                            <article
                                class="play-card"
                                data-index="${index}"
                            >

                                <a
                                    href="${getPlaylistUrl(
                                        playlist
                                    )}"
                                    aria-label="${title}"
                                >

                                    <img
                                        src="${escapeHtml(
                                            image
                                        )}"
                                        alt="${title}"
                                        draggable="false"
                                        onerror="
                                            this.onerror=null;
                                            this.src='https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85';
                                        "
                                    >


                                    <div
                                        class="pc-info"
                                    >

                                        <strong>
                                            ${title}
                                        </strong>


                                        <span>
                                            ${escapeHtml(
                                                category?.name ||
                                                "PLAYLIST"
                                            )}
                                        </span>

                                    </div>

                                </a>

                            </article>

                        `;
                    }
                )
                .join("");


        if (dots) {

            dots.innerHTML =
                playlists
                    .map(
                        (
                            _,
                            index
                        ) => `

                            <button
                                class="play-dot"
                                type="button"
                                data-dot="${index}"
                                aria-label="Ke playlist ${
                                    index + 1
                                }"
                            ></button>

                        `
                    )
                    .join("");
        }


        playlistCards =
            [
                ...track.querySelectorAll(
                    ".play-card"
                )
            ];


        playlistIndex = 0;


        bindPlaylistDots();

        updatePlaylist();

        startPlaylist();
    }


    /* =====================================================
       PLAYLIST URL
    ===================================================== */

    function getPlaylistUrl(
        playlist
    ) {

        if (
            playlist.slug
        ) {

            return (
                "pages/playlist-detail.html?slug=" +
                encodeURIComponent(
                    playlist.slug
                )
            );
        }


        return (
            "pages/playlist-detail.html?id=" +
            encodeURIComponent(
                playlist.id
            )
        );
    }


    /* =====================================================
       PLAYLIST CONTROLS
    ===================================================== */

    function relativePosition(
        index,
        total
    ) {

        let distance =
            index -
            playlistIndex;


        if (
            distance >
            total / 2
        ) {

            distance -= total;
        }


        if (
            distance <
            -total / 2
        ) {

            distance += total;
        }


        return distance;
    }


    function updatePlaylist() {

        const total =
            playlistCards.length;


        if (!total) {
            return;
        }


        playlistCards.forEach(
            (
                card,
                index
            ) => {

                const distance =
                    relativePosition(
                        index,
                        total
                    );


                card.className =
                    "play-card";


                if (
                    distance === 0
                ) {

                    card.classList.add(
                        "pos-0"
                    );

                } else if (
                    distance === 1
                ) {

                    card.classList.add(
                        "pos-1"
                    );

                } else if (
                    distance === -1
                ) {

                    card.classList.add(
                        "pos--1"
                    );

                } else if (
                    distance === 2
                ) {

                    card.classList.add(
                        "pos-2"
                    );

                } else if (
                    distance === -2
                ) {

                    card.classList.add(
                        "pos--2"
                    );

                } else {

                    card.classList.add(
                        "pos-hidden"
                    );
                }
            }
        );


        document
            .querySelectorAll(
                ".play-dot"
            )
            .forEach(
                (
                    dot,
                    index
                ) => {

                    dot.classList.toggle(
                        "active",
                        index ===
                        playlistIndex
                    );
                }
            );
    }


    function goPlaylist(
        index
    ) {

        const total =
            playlistCards.length;


        if (!total) {
            return;
        }


        playlistIndex =
            (
                index +
                total
            ) %
            total;


        updatePlaylist();
    }


    function startPlaylist() {

        clearInterval(
            playlistTimer
        );


        if (
            playlistCards.length >
            1
        ) {

            playlistTimer =
                setInterval(
                    () => {

                        goPlaylist(
                            playlistIndex +
                            1
                        );

                    },
                    5000
                );
        }
    }


    function bindPlaylistDots() {

        document
            .querySelectorAll(
                "[data-dot]"
            )
            .forEach(
                dot => {

                    dot.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            goPlaylist(
                                Number(
                                    dot.dataset.dot
                                )
                            );

                            startPlaylist();
                        }
                    );
                }
            );


        document
            .querySelector(
                "#playlistPrev"
            )
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    goPlaylist(
                        playlistIndex -
                        1
                    );

                    startPlaylist();
                }
            );


        document
            .querySelector(
                "#playlistNext"
            )
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    goPlaylist(
                        playlistIndex +
                        1
                    );

                    startPlaylist();
                }
            );
    }


    /* =====================================================
       PUBLIC VIDEO MODAL
    ===================================================== */

    window.openPublicVideo =
        function (
            id,
            title
        ) {

            if (!id) {
                return;
            }


            const modal =
                document.getElementById(
                    "modal"
                );


            const frame =
                document.getElementById(
                    "videoFrame"
                );


            const modalTitle =
                document.getElementById(
                    "modalTitle"
                );


            if (
                !modal ||
                !frame
            ) {
                return;
            }


            if (modalTitle) {

                modalTitle.textContent =
                    title ||
                    "Mandala Channel";
            }


            frame.src =
                "https://www.youtube-nocookie.com/embed/" +
                encodeURIComponent(id) +
                "?autoplay=1&rel=0";


            modal.classList.add(
                "open"
            );


            document.body.style.overflow =
                "hidden";
        };


    /* =====================================================
       LOAD EVERYTHING
    ===================================================== */

    async function loadPublicContent() {

        try {

            const [
                videos,
                playlistsData,
                categories
            ] = await Promise.all([

                loadVideos(),

                loadPlaylists(),

                loadCategories()

            ]);


            console.log(
                "[Mandala Public] Videos:",
                videos.length
            );


            console.log(
                "[Mandala Public] Playlists:",
                playlistsData.length
            );


            renderVideos(
                videos,
                categories
            );


            renderPlaylists(
                playlistsData,
                categories
            );


            /*
             * Simpan data global supaya
             * halaman lain bisa memakai.
             */

            window.MANDALA_PUBLIC_DATA = {

                videos,

                playlists:
                    playlistsData,

                categories

            };


        } catch (error) {

            console.error(
                "[Mandala Public] Gagal memuat content:",
                error
            );
        }
    }


    /* =====================================================
       START
    ===================================================== */

    function start() {

        loadPublicContent();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            {
                once: true
            }
        );

    } else {

        start();
    }

})();
