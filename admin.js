// Frontend is hosted on GitHub Pages; the API runs on the VPS over HTTPS.
// When a domain is bought, change the address here and in script.js.
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://178.162.254.195/api';

// Admin token exists only for this page session.
// It is never stored in localStorage or sent to GitHub.
let ADMIN_TOKEN = null;
let allBookings = [];

function getAdminHeaders(extra = {}) {
    return {
        ...extra,
        "Authorization": `Bearer ${ADMIN_TOKEN}`
    };
}

async function authenticateAdmin() {
    const token = prompt("Enter Hensil Admin Token:");

    if (!token) {
        throw new Error("Admin authentication required.");
    }

    ADMIN_TOKEN = token.trim();

    const response = await fetch(`${API_URL}/bookings`, {
        headers: getAdminHeaders()
    });

    if (response.status === 401) {
        ADMIN_TOKEN = null;
        throw new Error("Invalid admin token.");
    }

    if (!response.ok) {
        throw new Error("Unable to authenticate with Hensil API.");
    }

    return response.json();
}

const loading = document.getElementById("loading");
const table = document.getElementById("bookings-table");
const body = document.getElementById("bookings-body");
const mobileBookings = document.getElementById("mobile-bookings");
const empty = document.getElementById("empty");

async function loadBookings() {
    try {
        let data;

        if (!ADMIN_TOKEN) {
            data = await authenticateAdmin();
        } else {
            const response = await fetch(`${API_URL}/bookings`, {
                headers: getAdminHeaders()
            });

            if (response.status === 401) {
                ADMIN_TOKEN = null;
                throw new Error("Admin authentication expired.");
            }

            data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load bookings.");
            }
        }

        allBookings = data.bookings;
        renderBookings(allBookings);

    } catch (error) {
        console.error("Failed to load bookings:", error);
        loading.textContent = error.message || "Unable to load bookings.";
    }
}


function renderBookings(bookings) {

    loading.hidden = true;

    updateStats(bookings);

    body.innerHTML = "";
    mobileBookings.innerHTML = "";

    if (bookings.length === 0) {

        empty.hidden = false;
        table.hidden = true;

        return;
    }

    empty.hidden = true;
    table.hidden = false;


    bookings.forEach(booking => {

        const date = new Date(booking.booking_date)
            .toLocaleDateString("en-KE", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });


        // =========================================
        // DESKTOP TABLE
        // =========================================

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

                    ${booking.phone ? `
                        <a
                            href="tel:${phoneForTel(booking.phone)}"
                            class="call-btn"
                        >
                            <i class="fas fa-phone"></i>
                            Call
                        </a>
                    ` : ""}

                    ${booking.email ? `
                        <a
                            href="mailto:${encodeURIComponent(booking.email)}"
                            class="email-btn"
                        >
                            <i class="fas fa-envelope"></i>
                            Email
                        </a>
                    ` : ""}

                    ${booking.phone ? `
                        <a
                            href="https://wa.me/${phoneForWhatsApp(booking.phone)}"
                            target="_blank"
                            rel="noopener"
                            class="whatsapp-btn"
                        >
                            <i class="fab fa-whatsapp"></i>
                            WhatsApp
                        </a>
                    ` : ""}

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

                <span class="status ${escapeHtml(booking.payment_status || 'pending')}">
                    ${escapeHtml(booking.payment_status || 'pending')}
                </span>

                <div style="margin-top: 6px;">
                    <select
                        onchange="changePaymentStatus(${booking.id}, this.value)"
                        style="font-size: 11px; padding: 4px;"
                    >
                        <option value="pending" ${booking.payment_status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${booking.payment_status === 'paid' ? 'selected' : ''}>Paid</option>
                    </select>
                </div>

                <div style="margin-top: 6px;">
                    <button
                        onclick="downloadAdminInvoice(${booking.id})"
                        style="font-size: 11px; padding: 4px 8px; background: #315b91; color: white;"
                        title="Download Invoice"
                    >
                        <i class="fas fa-file-invoice"></i> Invoice
                    </button>
                </div>

            </td>

            <td>

                <select
                    onchange="changeStatus(${booking.id}, this.value)"
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


        // =========================================
        // MOBILE BOOKING CARD
        // =========================================

        const card = document.createElement("article");

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

                    <i class="fas fa-envelope"></i>

                    <span>
                        ${escapeHtml(booking.email)}
                    </span>

                </div>


                <div class="detail">

                    <i class="fas fa-phone"></i>

                    <span>
                        ${escapeHtml(booking.phone || "No phone number")}
                    </span>

                </div>


                <div class="detail">

                    <i class="fas fa-camera"></i>

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

            </div>


            ${
                booking.message
                    ? `
                        <div class="card-message">
                            <strong>Message</strong>
                            <br>
                            ${escapeHtml(booking.message)}
                        </div>
                    `
                    : ""
            }


            <div class="contact-actions">

                ${
                    booking.phone
                        ? `
                            <a
                                href="tel:${phoneForTel(booking.phone)}"
                                class="call-btn"
                            >
                                <i class="fas fa-phone"></i>
                                Call
                            </a>
                        `
                        : ""
                }


                ${
                    booking.email
                        ? `
                            <a
                                href="mailto:${encodeURIComponent(booking.email)}"
                                class="email-btn"
                            >
                                <i class="fas fa-envelope"></i>
                                Email
                            </a>
                        `
                        : ""
                }


                ${
                    booking.phone
                        ? `
                            <a
                                href="https://wa.me/${phoneForWhatsApp(booking.phone)}"
                                target="_blank"
                                rel="noopener"
                                class="whatsapp-btn"
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
                    onchange="changeStatus(${booking.id}, this.value)"
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
                    title="Delete booking"
                >
                    <i class="fas fa-trash"></i>
                </button>

            </div>

            <div class="card-actions" style="margin-top: 10px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <span class="status ${escapeHtml(booking.payment_status || 'pending')}">
                    ${escapeHtml(booking.payment_status || 'pending')}
                </span>
                <select
                    onchange="changePaymentStatus(${booking.id}, this.value)"
                    style="font-size: 11px; padding: 4px;"
                >
                    <option value="pending" ${booking.payment_status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="paid" ${booking.payment_status === 'paid' ? 'selected' : ''}>Paid</option>
                </select>
                <button
                    onclick="downloadAdminInvoice(${booking.id})"
                    style="font-size: 11px; padding: 4px 8px; background: #315b91; color: white;"
                >
                    <i class="fas fa-file-invoice"></i> Invoice
                </button>
            </div>

        `;

        mobileBookings.appendChild(card);

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


// =========================================
// UPDATE STATUS
// =========================================

async function changeStatus(id, status) {

    try {

        const response = await fetch(
            `${API_URL}/bookings/${id}`,
            {
                method: "PATCH",

                headers: getAdminHeaders({
                    "Content-Type": "application/json"
                }),

                body: JSON.stringify({
                    status
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to update booking."
            );
        }

        await loadBookings();

    } catch (error) {

        console.error(error);

        alert("Unable to update booking.");

    }
}


// =========================================
// DELETE BOOKING
// =========================================

async function deleteBooking(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this booking?"
    );

    if (!confirmed) return;


    try {

        const response = await fetch(
            `${API_URL}/bookings/${id}`,
            {
                method: "DELETE",
                headers: getAdminHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to delete booking."
            );
        }

        await loadBookings();

    } catch (error) {

        console.error(error);

        alert("Unable to delete booking.");

    }
}


// =========================================
// PHONE FORMATTING
// =========================================

function phoneForWhatsApp(phone) {

    let number = String(phone || "")
        .replace(/\D/g, "");

    // Kenyan number: 07XXXXXXXX
    if (number.startsWith("0")) {
        number = "254" + number.substring(1);
    }

    // Kenyan number already supplied as +254...
    if (number.startsWith("254")) {
        return number;
    }

    return number;
}


function phoneForTel(phone) {

    return String(phone || "")
        .trim();
}


// =========================================
// SECURITY
// =========================================

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = String(value ?? "");

    return div.innerHTML;
}


// =========================================
// START
// =========================================

loadBookings();

// =========================================
// LIVE ADMIN DASHBOARD REFRESH
// =========================================

// The booking API requires Authorization headers.
// EventSource cannot send custom Authorization headers,
// so the dashboard uses authenticated polling instead.

const ADMIN_REFRESH_INTERVAL = 30000;

setInterval(async () => {
    if (!ADMIN_TOKEN) return;

    try {
        await loadBookings();
    } catch (error) {
        console.error("Dashboard refresh failed:", error);
    }
}, ADMIN_REFRESH_INTERVAL);


// =========================================
// ADMIN LOGOUT
// =========================================

function adminLogout() {
    ADMIN_TOKEN = null;
    location.reload();
}


// =========================================
// INVOICE & PAYMENT MANAGEMENT
// =========================================

async function changePaymentStatus(id, payment_status) {
    try {
        const response = await fetch(
            `${API_URL}/bookings/${id}`,
            {
                method: "PATCH",
                headers: getAdminHeaders({
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify({
                    payment_status
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to update payment status.");
        }

        await loadBookings();

    } catch (error) {
        console.error(error);
        alert("Unable to update payment status.");
    }
}

function downloadAdminInvoice(id) {
    const booking = allBookings.find(b => b.id === id);
    if (!booking) {
        alert("Booking not found.");
        return;
    }
    downloadInvoice(booking);
}

function downloadInvoice(booking) {
    const invoiceHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Hensil Studio Invoice #${booking.id}</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #111; background: #fff; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
        .invoice-details { margin-top: 20px; display: flex; justify-content: space-between; }
        table { width: 100%; margin-top: 30px; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f9f9f9; }
        .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
        .status { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
        .status.pending { background: #fff3cd; color: #856404; }
        .status.paid { background: #d4edda; color: #155724; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="invoice-box">
        <div class="header">
            <div class="logo">HENSIL STUDIO</div>
            <div>
                <h2>INVOICE #${booking.id}</h2>
                <p>Date: ${new Date(booking.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
        </div>
        <div class="invoice-details">
            <div>
                <strong>Billed To:</strong><br>
                ${escapeHtml(booking.name)}<br>
                Email: ${escapeHtml(booking.email)}<br>
                Phone: ${escapeHtml(booking.phone || 'N/A')}
            </div>
            <div>
                <strong>Payment Status:</strong><br>
                <span class="status ${booking.payment_status || 'pending'}">${booking.payment_status || 'pending'}</span>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Service / Description</th>
                    <th>Date</th>
                    <th>Amount (Ksh)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${escapeHtml(booking.service)}<br><small>${escapeHtml(booking.message || '')}</small></td>
                    <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td>Ksh ${Number(booking.amount || 3800).toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
        <div class="total">
            Total Due: Ksh ${Number(booking.amount || 3800).toLocaleString()}
        </div>
        <div style="margin-top: 30px; font-size: 14px;">
            <p><strong>Payment Instructions:</strong></p>
            <p>50% non-refundable retainer required to confirm booking date. Remaining balance due 7 days prior to execution.</p>
        </div>
        <div class="footer">
            <p>Hencil Creative Photography & Media Production Studio &bull; info@hensilstudio.com</p>
        </div>
    </div>
    <script>
        window.print();
    </script>
</body>
</html>`;

    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hensil_Invoice_${booking.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
