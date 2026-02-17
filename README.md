# Sanchay

<div align="center">

**Your Money. Your Data. Your Device.**

*A privacy-first personal finance intelligence app that never leaves your computer*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-40.x-blue.svg)](https://www.electronjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## Why Sanchay?

Most finance apps ask you to trust them with your most sensitive data — your transactions, your income, your spending patterns. They store it on their servers, analyze it, and you never really know who has access.

**Sanchay is different.**

Your financial data never leaves your device. There are no servers. No cloud. No accounts. No tracking. Just you and your data, stored locally in an encrypted database that only you can access.

### Core Principles

- **100% Local** — All data stored on your device using SQLite. Nothing is ever uploaded anywhere.
- **Zero Backend** — There are no servers to hack, no databases to breach, no company to trust.
- **Open Source** — Every line of code is auditable. See exactly what the app does with your data.
- **Offline First** — Works completely offline. Internet is only needed for initial data import.

## Features

- **Smart Transaction Detection** — Automatically categorizes your expenses and income
- **Subscription Tracker** — Never forget what you're paying for monthly
- **Spending Analytics** — Visual breakdown of where your money goes
- **Income Tracking** — Monitor salary, freelance income, and other earnings
- **Financial Insights** — AI-powered observations about your spending patterns
- **Beautiful Dark UI** — Modern glassmorphic interface that's easy on the eyes

## Screenshots

<div align="center">

*Coming soon*

</div>

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

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

Distributable packages will be created in the `release` directory for macOS, Windows, and Linux.

## Tech Stack

- **Desktop Framework**: Electron 40
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Database**: SQLite (better-sqlite3) — local, encrypted, fast
- **Charts**: Recharts
- **Icons**: Lucide React
- **Language**: TypeScript

## Project Structure

```
sanchay/
├── electron/              # Desktop app core
│   ├── main.ts           # Main process
│   ├── preload.ts        # Secure IPC bridge
│   └── lib/              # Core modules
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── types/            # TypeScript definitions
└── public/               # Static assets
```

## Development

```bash
# Development mode with hot reload
npm run electron:dev

# Build Next.js only
npm run build

# Compile Electron TypeScript
npm run electron:compile

# Lint code
npm run lint
```

## Privacy & Security

Sanchay was built with one goal: **your financial data should belong to you.**

| What We Do | What We Don't Do |
|------------|------------------|
| Store everything locally on your device | Send data to any server |
| Use SQLite for fast, reliable storage | Create user accounts |
| Let you export/delete your data anytime | Track usage or analytics |
| Open source every line of code | Sell or share your information |

**Your data. Your control. Always.**

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Steps

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Multiple account support
- [ ] Export to CSV/Excel
- [ ] Budget alerts
- [ ] Investment portfolio tracking
- [ ] Receipt scanning
- [ ] Multi-currency support
- [ ] Bank statement import

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with [Electron](https://www.electronjs.org/), [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Recharts](https://recharts.org/), and [Lucide](https://lucide.dev/).

---

<div align="center">

**[Report Bug](https://github.com/DataOtto/sanchayapp/issues)** · **[Request Feature](https://github.com/DataOtto/sanchayapp/issues)**

<br />

*Your finances are personal. Keep them that way.*

<br />

Made by [DataOtto](https://github.com/DataOtto)

</div>
