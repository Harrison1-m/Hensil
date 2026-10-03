# Hensil

Hensil is a professional creative photography and media production studio web application featuring a responsive frontend client site, a backend REST API (Node.js & Express), and an admin dashboard for managing bookings and inquiries.

## Environment Configuration

1. Navigate to the `back/` directory:
   ```bash
   cd back
   ```
2. Copy the example environment file to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your actual database credentials and secure `ADMIN_TOKEN`.

## Database Setup & Initialization

The backend requires a PostgreSQL database with a `bookings` table.

### 1. Create the Database
Connect to your PostgreSQL server and create a database (e.g., `hensil`):
```sql
CREATE DATABASE hensil;
```

### 2. Apply the Schema
Run the schema script located in `back/schema.sql` against your PostgreSQL database:
```bash
psql -U <username> -d hensil -f back/schema.sql
```

Alternatively, you can copy and execute the contents of `back/schema.sql` using your preferred PostgreSQL management tool (such as pgAdmin, DBeaver, or the CLI).

## Testing

The backend includes an automated test suite verifying API routes (`/api/contact`, `/api/bookings`), input validation, and admin authentication middleware.

To run the tests:
```bash
cd back
npm test
```

