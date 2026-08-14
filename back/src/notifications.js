const adminClients = new Set();

function addAdminClient(res) {
    adminClients.add(res);

    res.write(`data: ${JSON.stringify({
        type: "connected"
    })}\n\n`);
}

function removeAdminClient(res) {
    adminClients.delete(res);
}

function notifyAdmins(booking) {
    const message = `data: ${JSON.stringify({
        type: "new_booking",
        booking
    })}\n\n`;

    for (const client of adminClients) {
        client.write(message);
    }
}

module.exports = {
    adminClients,
    addAdminClient,
    removeAdminClient,
    notifyAdmins
};
