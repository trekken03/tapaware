# Railway Deployment Checklist

TapAware deploys cleanly as three Railway services:

1. MySQL database
2. Backend API from `/backend`
3. Frontend web app from `/`

## Backend API

Create a service from the same repo and set its root directory to:

```text
/backend
```

Use these commands:

```text
Build command: npm install
Start command: npm start
```

Add a public domain for the backend service from Railway's Networking settings.

Set these backend variables:

```text
JWT_SECRET=<use a long random secret>
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
```

If your Railway MySQL service has a different service name, replace `MySQL` in the references above with that service name.

## Frontend

Create a second service from the same repo and set its root directory to:

```text
/
```

Use these commands:

```text
Build command: npm run build
Start command: npm run preview -- --host 0.0.0.0 --port $PORT
```

Set this frontend variable after the backend domain is generated:

```text
VITE_API_URL=https://your-backend-domain.up.railway.app/api
```

Add a public domain for the frontend service from Railway's Networking settings.

## Database

After creating the MySQL service, import:

```text
database/schema.sql
database/seed.sql
```

The seed includes a temporary admin login:

```text
Email: pearson@gmail.com
Password: Admin@12345
```

Change this password after first login. The other sample users still use placeholder password values, so create real users through the app or update the seed with bcrypt hashes if you need seeded staff or resident login accounts.
    