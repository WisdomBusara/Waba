# WABA Authentication Module

This document outlines the authentication and session management system implemented in the WABA (Water Billing Application) system.

## Overview

The authentication system uses **JSON Web Tokens (JWT)** for stateless session management and **bcryptjs** for secure password hashing. It is designed to be secure, robust, and easy to use.

## Features

1. **Secure Password Hashing**: All passwords are automatically hashed using `bcryptjs` with a work factor of 10 before being stored in the database.
2. **JWT Session Management**: Upon successful login, the server issues a JWT token valid for 24 hours. This token is used to authenticate subsequent API requests.
3. **Forced Password Change**: New users (including the default admin) are flagged with `mustChangePassword`. They must change their password on their first login before they are granted a full session token.
4. **Auto-Migration**: Existing plain-text passwords in the database are automatically hashed the next time the user logs in successfully.
5. **Audit Logging**: All authentication events (login success, login failure, password changes) are logged in the `audit_logs` table.

## How It Works

### 1. Login Flow (`POST /api/auth/login`)
- The user submits their email (or username) and password.
- The server retrieves the user from the SQLite database.
- The server compares the provided password against the stored hash using `bcrypt.compare()`.
- If successful, the server generates a JWT token signed with `JWT_SECRET`.
- The server responds with the user object, the JWT token, and a `requirePasswordChange` flag.
- The frontend stores the user object and token in `localStorage`.

### 2. Protected Routes
- All API routes (except `/api/auth/*`) are protected by the `authenticateToken` middleware.
- The frontend automatically attaches the JWT token to the `Authorization` header as a Bearer token for every request using the `fetchFromApi` utility.
- If the token is missing, invalid, or expired, the server returns a `401 Unauthorized` or `403 Forbidden` response.
- The frontend catches `401`/`403` responses, clears the local storage, and redirects the user to the login screen.

### 3. Registration / User Creation (`POST /api/users`)
- Only authenticated administrators can create new users.
- When an admin creates a user, the provided password is hashed using `bcryptjs` before insertion.
- The `mustChangePassword` flag is automatically set to `1` (true) for all newly created users.

### 4. Password Change (`POST /api/auth/change-password`)
- Users can change their password by providing their old password and a new password.
- The server verifies the old password, hashes the new password, and updates the database.
- The `mustChangePassword` flag is cleared (`0`).
- A fresh JWT token is issued and returned to the client.

## Setup and Configuration

### Environment Variables
The authentication module relies on a secret key to sign and verify JWT tokens. 

In a production environment, you **must** set the `JWT_SECRET` environment variable to a long, random string.

```env
JWT_SECRET=your_super_secret_random_string_here
```

If `JWT_SECRET` is not set, the system falls back to a default string (`waba_super_secret_key_for_local_dev`) for local development convenience. **Do not use the fallback in production.**

### Default Administrator
When the database is initialized, a default administrator account is created:
- **Email**: `admin@waba.local`
- **Username**: `admin`
- **Password**: A randomly generated temporary password is printed to the server console during the first run.

You must use this temporary password to log in for the first time, after which you will be forced to set a new, permanent password.

## Frontend Integration

The frontend handles authentication transparently:

1. **`lib/api.ts`**: The `fetchFromApi` wrapper automatically retrieves the token from `localStorage` and appends it to the `Authorization` header:
   ```javascript
   headers['Authorization'] = `Bearer ${token}`;
   ```
2. **Session Expiry**: If `fetchFromApi` receives a `401` or `403` status, it clears the session and forces a page reload, returning the user to the login screen.
3. **`App.tsx`**: On application load, it checks for both the `user` object and the `token` in `localStorage` to determine the initial authentication state.
