import "./cms-service.js";

const CMS = window.MandalaCMS;

const container = document.getElementById("videos-container");
const message = document.getElementById("page-message");

let profile = null;

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showMessage(text, type = "info") {
    if (!message) return;
    message.textContent = text;
    message.dataset.type = type;
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function statusClass(status) {
    const value = String(status || "draft").toLowerCase();

    return [
        "draft",
        "review",
        "published",
        "archived"
    ].includes(value)
        ? value
        : "draft";
}

function statusLabel(status) {
    return {
        draft: "Draft",
        review: "Review",
        published: "Published",
        archived: "Archived"
    }[status] || status || "-";
}

async function loadVideos() {

    try {

        showMessage("Memuat video...");

        const data = await CMS.videos();

        renderVideos(data);

        showMessage(
            `${data.length} video ditemukan.`,
            "success"
        );

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty">
                Gagal memuat video.
            </div>
        `;

        showMessage(
            error?.message || "Gagal memuat video.",
            "error"
        );
    }
}

function renderVideos(data) {

    if (!data || !data.length) {

        container.innerHTML = `
            <div class="empty">

                <p>Belum ada video.</p>

                <a
                    class="btn"
                    href="video-edit.html"
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
                        <th>Video</th>
                        <th>Status</th>
                        <th>Dibuat</th>
                        <th>Aksi</th>
                    </tr>
                </thead>

                <tbody>

                    ${data
                        .map(renderRow)
                        .join("")}

                </tbody>

            </table>

        </div>
    `;
}

function renderRow(video) {

    const id =
        escapeHtml(video.id);

    const title =
        escapeHtml(
            video.title ||
            "Tanpa judul"
        );

    const status =
        String(
            video.status ||
            "draft"
        ).toLowerCase();

    let actions = `
        <a
            class="action-link"
            href="video-edit.html?id=${encodeURIComponent(
                video.id
            )}"
        >
            Edit
        </a>
    `;

    if (profile?.role === "admin") {

        if (status !== "published") {

            actions += `
                <button
                    class="action-button"
                    data-action="publish"
                    data-id="${id}"
                >
                    Publish
                </button>
            `;
        }

        if (status !== "archived") {

            actions += `
                <button
                    class="action-button"
                    data-action="archive"
                    data-id="${id}"
                >
                    Arsipkan
                </button>
            `;
        }

    } else {

        if (status === "draft") {

            actions += `
                <button
                    class="action-button"
                    data-action="review"
                    data-id="${id}"
                >
                    Kirim Review
                </button>
            `;
        }

        if (status === "review") {

            actions += `
                <button
                    class="action-button"
                    data-action="archive"
                    data-id="${id}"
                >
                    Arsipkan
                </button>
            `;
        }
    }

    if (status !== "published") {

        actions += `
            <button
                class="action-button danger"
                data-action="delete"
                data-id="${id}"
            >
                Hapus
            </button>
        `;
    }

    return `
        <tr>

            <td>
                <div class="video-title">
                    ${title}
                </div>
            </td>

            <td>
                <span
                    class="status status-${statusClass(status)}"
                >
                    ${escapeHtml(
                        statusLabel(status)
                    )}
                </span>
            </td>

            <td>
                ${formatDate(video.created_at)}
            </td>

            <td>

                <div class="actions">
                    ${actions}
                </div>

            </td>

        </tr>
    `;
}

async function handleAction(action, id) {

    try {

        if (action === "delete") {

            if (
                !confirm(
                    "Yakin ingin menghapus video ini?"
                )
            ) {
                return;
            }

            await CMS.deleteVideo(id);

            showMessage(
                "Video berhasil dihapus.",
                "success"
            );

            await loadVideos();

            return;
        }

        if (action === "publish") {

            if (profile?.role !== "admin") {
                throw new Error(
                    "Hanya Admin yang dapat publish video."
                );
            }

            await CMS.changeStatus(
                "videos",
                id,
                "published"
            );

            showMessage(
                "Video berhasil dipublish.",
                "success"
            );

            await loadVideos();

            return;
        }

        if (action === "review") {

            await CMS.changeStatus(
                "videos",
                id,
                "review"
            );

            showMessage(
                "Video dikirim ke review.",
                "success"
            );

            await loadVideos();

            return;
        }

        if (action === "archive") {

            await CMS.changeStatus(
                "videos",
                id,
                "archived"
            );

            showMessage(
                "Video berhasil diarsipkan.",
                "success"
            );

            await loadVideos();
        }

    } catch (error) {

        console.error(error);

        showMessage(
            error?.message ||
            "Aksi gagal.",
            "error"
        );
    }
}

container?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );

        if (!button) return;

        handleAction(
            button.dataset.action,
            button.dataset.id
        );
    }
);

async function init() {

    try {

        profile =
            await CMS.requireStaff();

        if (!profile) return;

        await loadVideos();

    } catch (error) {

        console.error(error);

        showMessage(
            error?.message ||
            "Gagal membuka video.",
            "error"
        );
    }
}

init();
