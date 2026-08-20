import {
    getVideos,
    getCategories,
    deleteVideo,
    getCurrentAuth,
    logout
} from "./cms-service.js";


const container =
    document.getElementById(
        "videos-container"
    );

const message =
    document.getElementById(
        "page-message"
    );


let videos = [];
let categories = [];


/* =====================================================
   INIT
===================================================== */

async function init() {

    try {

        if (!container) {
            throw new Error(
                "Container video tidak ditemukan."
            );
        }


        const auth =
            await getCurrentAuth();


        if (!auth?.authenticated) {

            window.location.href =
                "index.html";

            return;
        }


        videos =
            await getVideos();


        categories =
            await getCategories();


        render();


    } catch (error) {

        console.error(
            "VIDEOS INIT ERROR:",
            error
        );


        if (message) {

            message.textContent =
                error.message ||
                "Gagal memuat video.";
        }


        if (container) {

            container.innerHTML = `
                <div class="empty">
                    Gagal memuat video.
                    <br>
                    <small>
                        ${escapeHtml(
                            error.message
                        )}
                    </small>
                </div>
            `;
        }
    }
}


/* =====================================================
   RENDER
===================================================== */

function render() {

    if (!container) {
        return;
    }


    if (!videos.length) {

        container.innerHTML = `
            <div class="empty">
                Belum ada video.
                <br><br>

                <a
                    href="video-edit.html"
                    class="btn"
                >
                    + Buat Video
                </a>
            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div class="table-wrapper">

            <table>

                <thead>

                    <tr>

                        <th>
                            Thumbnail
                        </th>

                        <th>
                            Judul
                        </th>

                        <th>
                            Kategori
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Dibuat
                        </th>

                        <th>
                            Aksi
                        </th>

                    </tr>

                </thead>

                <tbody id="video-table-body">
                </tbody>

            </table>

        </div>

    `;


    const tbody =
        document.getElementById(
            "video-table-body"
        );


    videos.forEach(
        video => {

            const category =
                categories.find(
                    item =>
                        item.id ===
                        video.category_id
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    ${
                        video.thumbnail_url
                            ? `
                            <img
                                src="${escapeAttribute(
                                    video.thumbnail_url
                                )}"
                                alt=""
                                style="
                                    width:110px;
                                    height:65px;
                                    object-fit:cover;
                                    border-radius:6px;
                                    display:block;
                                "
                            >
                            `
                            : `
                            <div
                                style="
                                    width:110px;
                                    height:65px;
                                    background:#eee;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    border-radius:6px;
                                    font-size:10px;
                                    color:#777;
                                "
                            >
                                No thumbnail
                            </div>
                            `
                    }

                </td>


                <td>

                    <div class="video-title">
                        ${escapeHtml(
                            video.title
                        )}
                    </div>

                    ${
                        video.featured
                            ? `
                            <div
                                style="
                                    margin-top:5px;
                                    font-size:10px;
                                "
                            >
                                ⭐ Unggulan
                            </div>
                            `
                            : ""
                    }

                </td>


                <td>
                    ${escapeHtml(
                        category?.name ||
                        "-"
                    )}
                </td>


                <td>

                    <span
                        class="status status-${escapeAttribute(
                            video.status
                        )}"
                    >
                        ${escapeHtml(
                            video.status
                        )}
                    </span>

                </td>


                <td>
                    ${formatDate(
                        video.created_at
                    )}
                </td>


                <td>

                    <div class="actions">

                        <a
                            class="action-link"
                            href="video-edit.html?id=${encodeURIComponent(
                                video.id
                            )}"
                        >
                            Edit
                        </a>


                        <button
                            class="action-button danger"
                            type="button"
                            data-delete="${escapeAttribute(
                                video.id
                            )}"
                        >
                            Hapus
                        </button>

                    </div>

                </td>

            `;


            tbody.appendChild(
                row
            );
        }
    );


    bindDelete();
}


/* =====================================================
   DELETE
===================================================== */

function bindDelete() {

    document
        .querySelectorAll(
            "[data-delete]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset.delete;


                        if (
                            !confirm(
                                "Yakin ingin menghapus video ini?"
                            )
                        ) {
                            return;
                        }


                        try {

                            button.disabled =
                                true;


                            await deleteVideo(
                                id
                            );


                            videos =
                                videos.filter(
                                    video =>
                                        video.id !==
                                        id
                                );


                            render();


                        } catch (error) {

                            console.error(
                                "DELETE VIDEO ERROR:",
                                error
                            );


                            alert(
                                error.message ||
                                "Gagal menghapus video."
                            );


                            button.disabled =
                                false;
                        }
                    }
                );
            }
        );
}


/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById("logout")
    ?.addEventListener(
        "click",
        async () => {

            try {

                await logout();

            } catch (error) {

                console.error(
                    error
                );
            }
        }
    );


/* =====================================================
   HELPERS
===================================================== */

function escapeHtml(value) {

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


function escapeAttribute(value) {

    return escapeHtml(
        value
    );
}


function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =====================================================
   START
===================================================== */

init();
