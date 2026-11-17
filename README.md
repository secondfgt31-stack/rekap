# 📚 Comic Payroll Management System

A production-ready web application designed for comic scanlation teams to manage translators and editors job reports, automated payroll calculations, Discord bot integration, and comprehensive admin dashboards.

---

## 🌟 Key Features

- **Public Job Report Form (`/laporan`)**: Translators and editors can easily submit their daily chapter completion reports with real-time rate calculation and instant validation.
- **Public Work Logs (`/logs`)**: Transparent viewing of submitted work logs with status badges (Approved, Pending Review, Rejected).
- **Recap & Payroll Overview (`/rekap`)**: Monthly and yearly salary breakdowns, total chapters completed, payment status tracking (Paid/Unpaid), and role-based distributions.
- **Admin Dashboard & Management**:
  - **Analytics**: Key performance metrics, monthly expenditure charts, and role breakdowns.
  - **Work Logs & Verification**: Automated typo detection (`PENDING_REVIEW`) with an interactive verification modal to match with existing employees or register new ones.
  - **Employee Management**: Manage staff profiles (Translators, Editors, Solo), status (Active/Inactive), and earnings history.
  - **Payroll & Rates**: Flexible rate per chapter configuration for each role.
  - **Discord Integration**: Configure Discord webhooks and bot tokens, view simulation logs, and test slash command handlers.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Motion.
- **Backend**: Node.js, Express, Better-SQLite3 (WAL mode).
- **Language**: TypeScript.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- npm

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/secondfgt31-stack/rekap.git
   cd rekap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:3000`.

---

## 📦 Build & Production

To build the application for production:
```bash
npm run build
```

To start the production server:
```bash
npm start
```

---

## 📄 License

MIT License
