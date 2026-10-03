const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

// Set test environment and mock ADMIN_TOKEN
process.env.ADMIN_TOKEN = 'test-secret-token';

// Mock database pool before loading app/routes
const db = require('../src/db');
const originalQuery = db.query;

// In-memory mock store for bookings
let mockBookings = [];
let nextId = 1;

db.query = async (text, params) => {
    const cleanText = text.replace(/\s+/g, ' ').trim();

    if (cleanText.includes('INSERT INTO bookings')) {
        const [name, email, phone, service, date, message] = params;
        const newBooking = {
            id: nextId++,
            name,
            email,
            phone,
            service,
            booking_date: date,
            message,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        mockBookings.unshift(newBooking);
        return { rows: [newBooking] };
    }
    if (cleanText.includes('SELECT * FROM bookings ORDER BY created_at DESC')) {
        return { rows: [...mockBookings] };
    }
    if (cleanText.includes('SELECT * FROM bookings WHERE id = $1')) {
        const id = params[0];
        const booking = mockBookings.find(b => b.id == id);
        return { rows: booking ? [booking] : [] };
    }
    if (cleanText.includes('UPDATE bookings SET status = $1')) {
        const [status, id] = params;
        const booking = mockBookings.find(b => b.id == id);
        if (!booking) return { rows: [] };
        booking.status = status;
        return { rows: [booking] };
    }
    if (cleanText.includes('DELETE FROM bookings WHERE id = $1')) {
        const id = params[0];
        const index = mockBookings.findIndex(b => b.id == id);
        if (index === -1) return { rows: [] };
        const removed = mockBookings.splice(index, 1);
        return { rows: removed };
    }
    return { rows: [] };
};

const app = require('../src/server');

let server;
let baseUrl;

test.before(async () => {
    await new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(0, () => {
            const port = server.address().port;
            baseUrl = `http://localhost:${port}`;
            resolve();
        });
    });
});

test.after(async () => {
    db.query = originalQuery;
    await new Promise((resolve) => server.close(resolve));
});

test.beforeEach(() => {
    mockBookings = [];
    nextId = 1;
});

test('GET /api/health returns ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'ok');
});

test('POST /api/contact creates a booking when valid', async () => {
    const payload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+254712345678',
        service: 'Wedding',
        date: '2026-11-01',
        message: 'Looking for wedding coverage.'
    };

    const res = await fetch(`${baseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.booking.name, 'Jane Doe');
    assert.strictEqual(data.booking.status, 'pending');
});

test('POST /api/contact rejects missing required fields', async () => {
    const payload = {
        name: 'Jane Doe'
    };

    const res = await fetch(`${baseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
});

test('GET /api/bookings requires authentication', async () => {
    const res = await fetch(`${baseUrl}/api/bookings`);
    assert.strictEqual(res.status, 401);

    const resBadToken = await fetch(`${baseUrl}/api/bookings`, {
        headers: { 'Authorization': 'Bearer wrong-token' }
    });
    assert.strictEqual(resBadToken.status, 401);
});

test('GET /api/bookings succeeds with valid admin token', async () => {
    mockBookings.push({
        id: 1,
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123456',
        service: 'Portrait',
        booking_date: '2026-12-01',
        message: 'Hello',
        status: 'pending',
        created_at: new Date().toISOString()
    });

    const res = await fetch(`${baseUrl}/api/bookings`, {
        headers: { 'Authorization': 'Bearer test-secret-token' }
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.bookings.length, 1);
    assert.strictEqual(data.bookings[0].name, 'Test Client');
});

test('PATCH /api/bookings/:id updates booking status', async () => {
    mockBookings.push({
        id: 10,
        name: 'Update Test',
        email: 'update@example.com',
        service: 'Editorial',
        booking_date: '2026-10-10',
        message: 'Test',
        status: 'pending',
        created_at: new Date().toISOString()
    });

    const res = await fetch(`${baseUrl}/api/bookings/10`, {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer test-secret-token',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'confirmed' })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.booking.status, 'confirmed');
});

test('PATCH /api/bookings/:id rejects invalid status', async () => {
    mockBookings.push({
        id: 10,
        name: 'Update Test',
        email: 'update@example.com',
        service: 'Editorial',
        booking_date: '2026-10-10',
        message: 'Test',
        status: 'pending',
        created_at: new Date().toISOString()
    });

    const res = await fetch(`${baseUrl}/api/bookings/10`, {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer test-secret-token',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'super-invalid' })
    });

    assert.strictEqual(res.status, 400);
});

test('DELETE /api/bookings/:id removes booking', async () => {
    mockBookings.push({
        id: 20,
        name: 'Delete Test',
        email: 'delete@example.com',
        service: 'Wedding',
        booking_date: '2026-10-15',
        message: 'Delete me',
        status: 'pending',
        created_at: new Date().toISOString()
    });

    const res = await fetch(`${baseUrl}/api/bookings/20`, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer test-secret-token'
        }
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(mockBookings.length, 0);
});
