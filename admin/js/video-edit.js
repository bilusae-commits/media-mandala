import "./cms-service.js";

const CMS = window.MandalaCMS;

const form =
    document.getElementById("video-form");

const idInput =
    document.getElementById("video-id");

const titleInput =
    document.getElementById("title");

const slugInput =
    document.getElementById("slug");

const descriptionInput =
    document.getElementById("description");

const videoUrlInput =
    document.getElementById("video_url");

const thumbnailInput =
    document.getElementById("thumbnail_url");

const statusInput =
    document.getElementById("status");

const message =
    document.getElementById("form-message");

const pageTitle =
    document.getElementById("page-title");

const saveButton =
    document.getElementById("save-button");

const draftButton =
    document.getElementById("save-draft-button");

const reviewButton =
    document.getElementById("submit-review-button");

const publishButton =
    document.getElementById("publish-button");

let profile = null;
let currentVideo = null;
let slugEdited = false;

function showMessage(text, type = "info") {

    if (!message) return;

    message.textContent = text;
    message.dataset.type = type;
}

function slugify(value) {

    return String(value || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
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
            /^-|-$/g,
            ""
        );
}

titleInput?.addEventListener(
    "input",
    () => {

        if (!slugEdited) {

            slugInput.value =
                slugify(
                    titleInput.value
                );
        }
    }
);

slugInput?.addEventListener(
    "input",
    () => {
        slugEdited = true;
    }
);

function getId() {

    return new URLSearchParams(
        location.search
    ).get("id");
}

function getPayload() {

    const title =
        titleInput.value.trim();

    if (!title) {
        throw new Error(
            "Judul wajib diisi."
        );
    }

    return {

        title,

        slug:
            slugInput.value.trim() ||
            slugify(title),

        description:
            descriptionInput.value.trim() ||
            null,

        video_url:
            videoUrlInput.value.trim() ||
            null,

        thumbnail_url:
            thumbnailInput.value.trim() ||
            null
    };
}

async function loadVideo(id) {

    showMessage(
        "Memuat video..."
    );

    currentVideo =
        await CMS.video(id);

    idInput.value =
        currentVideo.id || "";

    titleInput.value =
        currentVideo.title || "";

    slugInput.value =
        currentVideo.slug || "";

    descriptionInput.value =
        currentVideo.description || "";

    videoUrlInput.value =
        currentVideo.video_url || "";

    thumbnailInput.value =
        currentVideo.thumbnail_url || "";

    statusInput.value =
        currentVideo.status || "draft";

    slugEdited = true;

    pageTitle.textContent =
        "Edit Video";

    updateUI();

    showMessage(
        "Video berhasil dimuat.",
        "success"
    );
}

function updateUI() {

    const status =
        currentVideo?.status ||
        statusInput.value ||
        "draft";

    if (
        status === "published" &&
        profile?.role !== "admin"
    ) {

        [
            titleInput,
            slugInput,
            descriptionInput,
            videoUrlInput,
            thumbnailInput,
            statusInput
        ].forEach(
            field => {
                if (field) {
                    field.disabled = true;
                }
            }
        );

        if (saveButton) {
            saveButton.style.display = "none";
        }

        if (draftButton) {
            draftButton.style.display = "none";
        }

        if (reviewButton) {
            reviewButton.style.display = "none";
        }

        if (publishButton) {
            publishButton.style.display = "none";
        }

    } else {

        if (publishButton) {

            publishButton.style.display =
                profile?.role === "admin"
                    ? ""
                    : "none";
        }
    }
}

async function save(targetStatus = null) {

    const payload =
        getPayload();

    payload.status =
        targetStatus ||
        currentVideo?.status ||
        "draft";

    if (
        profile.role === "editor" &&
        payload.status === "published"
    ) {
        throw new Error(
            "Editor tidak dapat publish video."
        );
    }

    let result;

    if (currentVideo) {

        result =
            await CMS.updateVideo(
                currentVideo.id,
                payload
            );

    } else {

        const user =
            await CMS.currentUser();

        if (!user) {
            throw new Error(
                "User tidak ditemukan."
            );
        }

        payload.author_id =
            user.id;

        result =
            await CMS.createVideo(
                payload
            );
    }

    currentVideo =
        result;

    idInput.value =
        result.id;

    history.replaceState(
        {},
        "",
        `video-edit.html?id=${encodeURIComponent(
            result.id
        )}`
    );

    pageTitle.textContent =
        "Edit Video";

    statusInput.value =
        result.status ||
        payload.status;

    updateUI();

    showMessage(
        "Video berhasil disimpan.",
        "success"
    );
}

form?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        try {
            await save();
        } catch (error) {
            console.error(error);

            showMessage(
                error?.message ||
                "Gagal menyimpan video.",
                "error"
            );
        }
    }
);

draftButton?.addEventListener(
    "click",
    async () => {

        try {
            await save("draft");
        } catch (error) {
            showMessage(
                error?.message ||
                "Gagal menyimpan draft.",
                "error"
            );
        }
    }
);

reviewButton?.addEventListener(
    "click",
    async () => {

        try {
            await save("review");
        } catch (error) {
            showMessage(
                error?.message ||
                "Gagal mengirim review.",
                "error"
            );
        }
    }
);

publishButton?.addEventListener(
    "click",
    async () => {

        try {

            if (
                profile?.role !== "admin"
            ) {
                throw new Error(
                    "Hanya Admin yang dapat publish video."
                );
            }

            await save("published");

        } catch (error) {

            showMessage(
                error?.message ||
                "Gagal publish video.",
                "error"
            );
        }
    }
);

statusInput?.addEventListener(
    "change",
    () => {

        if (
            profile?.role === "editor" &&
            statusInput.value === "published"
        ) {

            statusInput.value =
                currentVideo?.status ||
                "draft";

            showMessage(
                "Editor tidak dapat memilih Published.",
                "warning"
            );
        }
    }
);

async function init() {

    try {

        profile =
            await CMS.requireStaff();

        if (!profile) return;

        const id =
            getId();

        if (id) {

            await loadVideo(id);

        } else {

            pageTitle.textContent =
                "Video Baru";

            statusInput.value =
                "draft";

            updateUI();

            showMessage(
                "Siap membuat video baru."
            );
        }

    } catch (error) {

        console.error(error);

        showMessage(
            error?.message ||
            "Gagal membuka editor video.",
            "error"
        );
    }
}

init();
