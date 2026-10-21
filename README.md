# Centralized QR Code Center

A factory web portal for finding, generating, downloading, and printing QR codes used by multiple internal systems — without users having to know or type the URL/data inside each code.

## What this project is

Today, each factory system (e-WSL, Matrack, Maintenance, Production Monitoring, Quality, etc.) may create and store QR codes on its own. That makes it hard for operators to find the right label and for admins to update or reprint them.

This app is the **single place** to:

| Who | What they do |
| --- | --- |
| **Viewer** | Search systems, pick a QR item, preview and download |
| **Operator** | Same as Viewer, plus print / reprint |
| **Administrator** | Register systems, QR types, QR items, values, activate/deactivate, audit |
| **System Administrator** | All admin functions, plus user/role management |

Full product requirements live in [`requirement.md`](./requirement.md).

## How it works

### Everyday user flow

```text
Open QR Code Center
        → Select a system (e.g. e-WSL)
        → Select a QR item (e.g. Position 1)
        → App loads the stored QR value and generates the image
        → Preview → Download (PNG) and/or Print
```

Users never edit the encoded URL/text. They only choose system + item.

### Data model (concept)

```text
System
  └── QR Type (category + display label)
        └── QR Item (value/URL, location, status)
              └── Audit history
```

Only **Active** systems and QR items appear on the normal selection screen.

### Current implementation

| Piece | Status |
| --- | --- |
| Frontend | Next.js (App Router) + React + MUI + Tailwind in `frontend/` |
| Backend / DB | Not wired yet — data is **mock seed + browser localStorage** |
| Auth | Demo mode: pick a username + role (no password) |

That means you can explore the full UI and role permissions locally; data resets if you clear site storage or use another browser.

## How to run it

### Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **npm** (comes with Node)

### Setup

```bash
git clone <repo-url>
cd qr-code/frontend
npm install
```

`npm install` also runs `postinstall` to build icon assets.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build (optional)

```bash
npm run build
npm start
```

### Demo login

On the login page, choose a role (or use these seed usernames):

| Username | Role |
| --- | --- |
| `viewer` | Viewer |
| `operator` | Operator |
| `admin` | Administrator |
| `sysadmin` | System Administrator |

No password is required in demo mode.

### Useful npm scripts (`frontend/`)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Project layout

```text
qr-code/
├── requirement.md          # Business & functional requirements
├── README.md               # This file
└── frontend/               # Next.js application
    ├── src/app/            # Routes (center, admin, login, print)
    ├── src/components/     # UI (QR preview, lists, layout)
    ├── src/lib/mock/       # Seed data + local store
    └── package.json
```

## Notes for contributors

- Product intent and acceptance criteria: see `requirement.md`.
- This MVP focuses on the web portal UX; a real API/database and SSO can replace the mock layer later without changing the user flow (select system → select item → QR).
