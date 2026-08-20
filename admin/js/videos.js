import {
    getVideos,
    getCategories,
    deleteVideo,
    getCurrentAuth,
    logout
} from "./cms-service.js";


const tableBody =
    document.getElementById("video-table-body");

const emptyState =
    document.getElementById("empty-state");

const loading =
    document.getElementById("loading");

const categoryFilter =
    document.getElementById("category-filter");

const statusFilter =
    document.getElementById("status-filter");

const searchInput =
    document.getElementById("search");

let videos = [];
let categories = [];


async function init() {

    try {

        if (loading) {
            loading.style.display = "block";
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


        renderCategories();

        render();


    } catch (error) {

        console.error(
            "VIDEOS ERROR:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        Gagal memuat video:
                        ${escapeHtml(
                            error.message
                        )}
                    </td>
                </tr>
            `;
        }


    } finally {

        if (loading) {
            loading.style.display = "none";
        }
    }
}


function renderCategories() {

    if (!categoryFilter) return;


    categoryFilter.innerHTML = `
        <option value="">
            Semua Kategori
        </option>
    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category.id;

            option.textContent =
                category.name;

            categoryFilter.appendChild(
                option
            );
        }
    );
}


function render() {

    if (!tableBody) return;


    const search =
        (
            searchInput?.value ||
            ""
        )
            .toLowerCase()
            .trim();


    const status =
        statusFilter?.value ||
        "";


    const category =
        categoryFilter?.value ||
        "";


    const filtered =
        videos.filter(
            video => {

                return (

                    (
                        !search ||
                        String(
                            video.title || ""
                        )
                            .toLowerCase()
                            .includes(search)
                    )

                    &&

                    (
                        !status ||
                        video.status === status
                    )

                    &&

                    (
                        !category ||
                        video.category_id === category
                    )

                );
            }
        );


    tableBody.innerHTML = "";


    if (!filtered.length) {

        if (emptyState) {
            emptyState.style.display =
                "block";
        }

        return;
    }


    if (emptyState) {
        emptyState.style.display =
            "none";
    }


    filtered.forEach(
        video => {

            const categoryName =
                categories.find(
                    category =>
                        category.id ===
                        video.category_id
                )?.name || "-";


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <img
                        src="${
                            escapeHtml(
                                video.thumbnail_url || ""
                            )
                        }"
                        alt=""
                        style="
                            width:100px;
                            height:60px;
                            object-fit:cover;
                            border-radius:6px;
                        "
                    >

                </td>


                <td>
                    <strong>
                        ${escapeHtml(
                            video.title
                        )}
                    </strong>

                    ${
                        video.featured
                            ? " ⭐"
                            : ""
                    }
                </td>


                <td>
                    ${escapeHtml(
                        categoryName
                    )}
                </td>


                <td>
                    ${escapeHtml(
                        video.status
                    )}
                </td>


                <td>
                    ${formatDate(
                        video.created_at
                    )}
                </td>


                <td>

                    <a
                        href="./video-edit.html?id=${
                            encodeURIComponent(
                                video.id
                            )
                        }"
                    >
                        Edit
                    </a>

                    <button
                        type="button"
                        data-delete="${
                            escapeHtml(
                                video.id
                            )
                        }"
                    >
                        Hapus
                    </button>

                </td>

            `;


            tableBody.appendChild(
                row
            );
        }
    );


    bindDelete();
}


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
                                "Hapus video ini?"
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
                                error
                            );


                            alert(
                                error.message
                            );


                            button.disabled =
                                false;
                        }
                    }
                );
            }
        );
}


searchInput?.addEventListener(
    "input",
    render
);

statusFilter?.addEventListener(
    "change",
    render
);

categoryFilter?.addEventListener(
    "change",
    render
);


document
    .getElementById("logout")
    ?.addEventListener(
        "click",
        logout
    );


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


function formatDate(value) {

    if (!value) return "-";


    return new Date(
        value
    ).toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


init();
