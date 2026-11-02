# Travel Buddy

A multi-platform social travel & explorer community platform featuring Next.js web application, Node.js/Express backend, Android mobile app, and iOS mobile app.

## 📁 Repository Structure

- **`backend/`**: Node.js & TypeScript backend powered by Express and Socket.io, providing social feed, stories, reels, likes, audio discussions, and stays APIs.
- **`web/`**: Next.js 15 & React 19 web frontend with Tailwind CSS, featuring travel stories, swipeable multi-photo posts, and explorer community interactions.
- **`mobile-android/`**: Native Android app written in Kotlin & Jetpack Compose.
- **`mobile-ios/`**: Native iOS application written in SwiftUI.
- **`docs/`**: Platform architecture and API documentation.

## 🚀 Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```

The backend now requires MongoDB to be available before it starts serving requests. Copy `backend/.env.example` to `backend/.env` and configure the local MongoDB URI and an OTP delivery webhook. The webhook receives a POST JSON payload with `to`, `channel`, `purpose`, `code`, and `expiresInSeconds`; its bearer token must be kept server-side. No OTP is returned to or logged by the application.

To create the first administrator, set the `BOOTSTRAP_ADMIN_*` values in the backend environment, run `npm run admin:bootstrap` once from `backend/`, then clear those bootstrap values. The command refuses to run if a SUPER_ADMIN already exists.

User and admin sessions use an HttpOnly cookie. A new random development signing secret is generated at each backend start unless `JWT_SECRET` is configured; configure a stable secret before using sessions across restarts. Production requires a configured secret of at least 32 characters.

### Web Frontend
```bash
cd web
npm install
npm run dev
```
