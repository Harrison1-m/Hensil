const API_URL = "http://127.0.0.1:5000/api";

const loading = document.getElementById("loading");
const table = document.getElementById("bookings-table");
const body = document.getElementById("bookings-body");
const empty = document.getElementById("empty");

async function loadBookings() {
    try {
        const response = await fetch(`${API_URL}/bookings`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
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

    if (bookings.length === 0) {
        empty.hidden = false;
        table.hidden = true;
        return;
    }

    empty.hidden = true;
    table.hidden = false;

    bookings.forEach(booking => {

        const row = document.createElement("tr");

        const date = new Date(booking.booking_date)
            .toLocaleDateString("en-KE", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });

        row.innerHTML = `
            <td>#${booking.id}</td>

            <td>
                <strong>${escapeHtml(booking.name)}</strong>
            </td>

            <td>
                ${escapeHtml(booking.email)}<br>
                ${escapeHtml(booking.phone || "")}
            </td>

            <td>
                ${escapeHtml(booking.service)}
            </td>

            <td>
                ${date}
            </td>

            <td>
                <span class="status ${booking.status}">
                    ${booking.status}
                </span>
            </td>

            <td>
                <select
                    onchange="changeStatus(${booking.id}, this.value)"
                >
                    <option value="pending"
                        ${booking.status === "pending" ? "selected" : ""}>
                        Pending
                    </option>

                    <option value="confirmed"
                        ${booking.status === "confirmed" ? "selected" : ""}>
                        Confirmed
                    </option>

                    <option value="completed"
                        ${booking.status === "completed" ? "selected" : ""}>
                        Completed
                    </option>

                    <option value="cancelled"
                        ${booking.status === "cancelled" ? "selected" : ""}>
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
    });
}

function updateStats(bookings) {

    document.getElementById("total-count").textContent =
        bookings.length;

    document.getElementById("pending-count").textContent =
        bookings.filter(b => b.status === "pending").length;

    document.getElementById("confirmed-count").textContent =
        bookings.filter(b => b.status === "confirmed").length;

    document.getElementById("completed-count").textContent =
        bookings.filter(b => b.status === "completed").length;
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

                body: JSON.stringify({ status })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        loadBookings();

    } catch (error) {

        console.error(error);

        alert("Unable to update booking.");
    }
}

async function deleteBooking(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this booking?"
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            `${API_URL}/bookings/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        loadBookings();

    } catch (error) {

        console.error(error);

        alert("Unable to delete booking.");
    }
}

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}

loadBookings();
