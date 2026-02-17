# Sanchay

<div align="center">

**AI Financial Intelligence Layer**

*Your personal financial clarity engine powered by Gmail insights*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-40.x-blue.svg)](https://www.electronjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## Overview

Sanchay is a privacy-first desktop application that transforms your Gmail inbox into actionable financial intelligence. By analyzing transaction emails from banks, UPI services, and merchants, it provides a comprehensive view of your spending habits, subscriptions, and income — all while keeping your data completely local.

### Key Features

- **Transaction Detection** — Automatically extracts transactions from bank alerts, UPI receipts, and payment confirmations
- **Subscription Tracker** — Identifies and monitors recurring payments (Netflix, Spotify, AWS, etc.)
- **Spending Breakdown** — Visual breakdown of expenses by category with trends
- **Income Summary** — Track salary credits, freelance payments, and investment returns
- **Smart Insights** — AI-powered observations about your financial patterns
- **Privacy First** — Zero backend, all data stored locally using SQLite

## Screenshots

<div align="center">

*Coming soon*

</div>

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Desktop**: Electron 40
- **Database**: SQLite (better-sqlite3)
- **Gmail Integration**: Google OAuth2 (read-only access)
- **Charts**: Recharts
- **Icons**: Lucide React

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- A Google Cloud project with Gmail API enabled

### Quick Start

```bash
# Clone the repository
git clone https://github.com/DataOtto/sanchayapp.git
cd sanchayapp

# Install dependencies
npm install

# Run in development mode
npm run electron:dev
```

### Build for Production

```bash
# Build the application
npm run electron:build
```

This will create distributable packages in the `release` directory.

## Gmail API Setup

To connect Sanchay to your Gmail account, you'll need to set up Google OAuth credentials:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Gmail API** for your project
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Select **Desktop app** as the application type
6. Download the credentials JSON file
7. Rename it to `credentials.json` and place it in the project root

> **Note**: Sanchay only requests read-only access to your Gmail. It never modifies, deletes, or sends emails.

### Required OAuth Scopes

```
https://www.googleapis.com/auth/gmail.readonly
```

## Project Structure

```
sanchay/
├── electron/              # Electron main process
│   ├── main.ts           # Main process entry
│   ├── preload.ts        # Preload script for IPC
│   └── lib/              # Gmail, database, and parser modules
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/              # Shared utilities
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
└── package.json
```

## Development

```bash
# Run Next.js development server only
npm run dev

# Run Electron in development mode (with hot reload)
npm run electron:dev

# Build Next.js
npm run build

# Compile Electron TypeScript
npm run electron:compile

# Lint code
npm run lint
```

## Supported Email Formats

Sanchay currently parses transaction emails from:

**Banks**
- HDFC Bank
- ICICI Bank
- Axis Bank
- SBI
- Kotak Mahindra Bank

**UPI Services**
- Google Pay
- PhonePe
- Paytm
- BHIM UPI

**Payment Platforms**
- Razorpay
- Instamojo

**Subscriptions**
- Netflix, Amazon Prime, Spotify
- AWS, Google Cloud, Azure
- Adobe Creative Cloud
- And many more...

> Want to add support for more banks/services? Contributions are welcome!

## Privacy & Security

- **100% Local Storage** — All your financial data stays on your device
- **No Backend** — Sanchay doesn't have servers; there's nowhere to send your data
- **Read-Only Access** — Gmail integration only reads emails, never modifies them
- **Open Source** — Audit the code yourself

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Multiple Gmail account support
- [ ] Export to CSV/Excel
- [ ] Budget setting and alerts
- [ ] Investment tracking integration
- [ ] Receipt/invoice attachment parsing
- [ ] Multi-currency support
- [ ] Bank statement PDF import

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/) and [Next.js](https://nextjs.org/)
- UI components powered by [Tailwind CSS](https://tailwindcss.com/)
- Charts by [Recharts](https://recharts.org/)
- Icons from [Lucide](https://lucide.dev/)

---

<div align="center">

**[Report Bug](https://github.com/DataOtto/sanchayapp/issues)** · **[Request Feature](https://github.com/DataOtto/sanchayapp/issues)**

Made with ❤️ by [DataOtto](https://github.com/DataOtto)

</div>
