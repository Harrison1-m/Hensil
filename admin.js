const API_URL = "https://hensil.onrender.com/api";

const loading = document.getElementById("loading");
const table = document.getElementById("bookings-table");
const body = document.getElementById("bookings-body");
const empty = document.getElementById("empty");

async function loadBookings() {
    try {
        const response = await fetch(`${API_URL}/bookings`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load bookings.");
        }

        renderBookings(data.bookings);

    } catch (error) {
        console.error("Failed to load bookings:", error);
        loading.textContent = "Unable to load bookings.";
    }
}


function renderBookings(bookings) {

    loading.hidden = true;

    updateStats(bookings);

    body.innerHTML = "";

    const mobileBookings =
        document.getElementById("mobile-bookings");

    if (mobileBookings) {
        mobileBookings.innerHTML = "";
    }

    if (bookings.length === 0) {
        empty.hidden = false;
        table.hidden = true;

        if (mobileBookings) {
            mobileBookings.hidden = true;
        }

        return;
    }

    empty.hidden = true;
    table.hidden = false;

    if (mobileBookings) {
        mobileBookings.hidden = false;
    }


    bookings.forEach(booking => {

        const date = new Date(booking.booking_date)
            .toLocaleDateString("en-KE", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });


        /*
         * ============================
         * PHONE / WHATSAPP
         * ============================
         */

        const phone = String(booking.phone || "")
            .replace(/[^\d+]/g, "");

        let whatsappNumber = phone;

        // Kenyan local number:
        // 0712345678 -> 254712345678
        if (whatsappNumber.startsWith("0")) {
            whatsappNumber =
                "254" + whatsappNumber.substring(1);
        }

        whatsappNumber =
            whatsappNumber.replace("+", "");

        const whatsappUrl =
            `https://wa.me/${whatsappNumber}`;


        /*
         * ============================
         * DESKTOP TABLE
         * ============================
         */

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                #${booking.id}
            </td>

            <td>
                <strong>
                    ${escapeHtml(booking.name)}
                </strong>
            </td>

            <td>

                ${escapeHtml(booking.email)}

                <br>

                ${escapeHtml(booking.phone || "")}

                <div class="contact-actions">

                    ${
                        booking.phone
                            ? `
                                <a
                                    class="call-btn"
                                    href="tel:${escapeHtml(booking.phone)}"
                                >
                                    <i class="fas fa-phone"></i>
                                    Call
                                </a>
                            `
                            : ""
                    }


                    <a
                        class="email-btn"
                        href="mailto:${escapeHtml(booking.email)}"
                    >
                        <i class="fas fa-envelope"></i>
                        Email
                    </a>


                    ${
                        booking.phone
                            ? `
                                <a
                                    class="whatsapp-btn"
                                    href="${whatsappUrl}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i class="fab fa-whatsapp"></i>
                                    WhatsApp
                                </a>
                            `
                            : ""
                    }

                </div>

            </td>

            <td>
                ${escapeHtml(booking.service)}
            </td>

            <td>
                ${date}
            </td>

            <td>

                <span class="status ${escapeHtml(booking.status)}">
                    ${escapeHtml(booking.status)}
                </span>

            </td>

            <td>

                <select
                    onchange="changeStatus(
                        ${booking.id},
                        this.value
                    )"
                >

                    <option
                        value="pending"
                        ${booking.status === "pending" ? "selected" : ""}
                    >
                        Pending
                    </option>

                    <option
                        value="confirmed"
                        ${booking.status === "confirmed" ? "selected" : ""}
                    >
                        Confirmed
                    </option>

                    <option
                        value="completed"
                        ${booking.status === "completed" ? "selected" : ""}
                    >
                        Completed
                    </option>

                    <option
                        value="cancelled"
                        ${booking.status === "cancelled" ? "selected" : ""}
                    >
                        Cancelled
                    </option>

                </select>


                <button
                    class="delete"
                    onclick="deleteBooking(${booking.id})"
                >
                    <i class="fas fa-trash"></i>
                </button>

            </td>
        `;

        body.appendChild(row);


        /*
         * ============================
         * MOBILE BOOKING CARD
         * ============================
         */

        if (mobileBookings) {

            const card =
                document.createElement("article");

            card.className = "booking-card";

            card.innerHTML = `

                <div class="booking-card-header">

                    <div>

                        <div class="booking-id">
                            BOOKING #${booking.id}
                        </div>

                        <div class="booking-name">
                            ${escapeHtml(booking.name)}
                        </div>

                    </div>


                    <span class="status ${escapeHtml(booking.status)}">
                        ${escapeHtml(booking.status)}
                    </span>

                </div>


                <div class="booking-details">

                    <div class="detail">
                        <i class="fas fa-briefcase"></i>

                        <span>
                            ${escapeHtml(booking.service)}
                        </span>
                    </div>


                    <div class="detail">
                        <i class="fas fa-calendar"></i>

                        <span>
                            ${date}
                        </span>
                    </div>


                    <div class="detail">
                        <i class="fas fa-envelope"></i>

                        <span>
                            ${escapeHtml(booking.email)}
                        </span>
                    </div>


                    ${
                        booking.phone
                            ? `
                                <div class="detail">

                                    <i class="fas fa-phone"></i>

                                    <span>
                                        ${escapeHtml(booking.phone)}
                                    </span>

                                </div>
                            `
                            : ""
                    }

                </div>


                <div class="card-message">

                    ${escapeHtml(booking.message)}

                </div>


                <div class="contact-actions">


                    ${
                        booking.phone
                            ? `
                                <a
                                    class="call-btn"
                                    href="tel:${escapeHtml(booking.phone)}"
                                >
                                    <i class="fas fa-phone"></i>
                                    Call
                                </a>
                            `
                            : ""
                    }


                    <a
                        class="email-btn"
                        href="mailto:${escapeHtml(booking.email)}"
                    >
                        <i class="fas fa-envelope"></i>
                        Email
                    </a>


                    ${
                        booking.phone
                            ? `
                                <a
                                    class="whatsapp-btn"
                                    href="${whatsappUrl}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i class="fab fa-whatsapp"></i>
                                    WhatsApp
                                </a>
                            `
                            : ""
                    }

                </div>


                <div class="card-actions">

                    <select
                        onchange="changeStatus(
                            ${booking.id},
                            this.value
                        )"
                    >

                        <option
                            value="pending"
                            ${booking.status === "pending" ? "selected" : ""}
                        >
                            Pending
                        </option>


                        <option
                            value="confirmed"
                            ${booking.status === "confirmed" ? "selected" : ""}
                        >
                            Confirmed
                        </option>


                        <option
                            value="completed"
                            ${booking.status === "completed" ? "selected" : ""}
                        >
                            Completed
                        </option>


                        <option
                            value="cancelled"
                            ${booking.status === "cancelled" ? "selected" : ""}
                        >
                            Cancelled
                        </option>

                    </select>


                    <button
                        class="delete"
                        onclick="deleteBooking(${booking.id})"
                    >
                        <i class="fas fa-trash"></i>
                    </button>

                </div>

            `;

            mobileBookings.appendChild(card);
        }

    });
}


function updateStats(bookings) {

    document.getElementById("total-count").textContent =
        bookings.length;

    document.getElementById("pending-count").textContent =
        bookings.filter(
            b => b.status === "pending"
        ).length;

    document.getElementById("confirmed-count").textContent =
        bookings.filter(
            b => b.status === "confirmed"
        ).length;

    document.getElementById("completed-count").textContent =
        bookings.filter(
            b => b.status === "completed"
        ).length;
}


async function changeStatus(id, status) {

    try {

        const response = await fetch(
            `${API_URL}/bookings/${id}`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to update booking."
            );
        }


        await loadBookings();

    } catch (error) {

        console.error(
            "Status update error:",
            error
        );

        alert(
            "Unable to update booking."
        );
    }
}


async function deleteBooking(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this booking?"
    );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/bookings/${id}`,
            {
                method: "DELETE"
            }
        );


        const data = await response.json();


        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to delete booking."
            );
        }


        await loadBookings();

    } catch (error) {

        console.error(
            "Delete error:",
            error
        );

        alert(
            "Unable to delete booking."
        );
    }
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}


loadBookings();