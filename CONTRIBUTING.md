# Contributing to Sanchay

First off, thank you for considering contributing to Sanchay! It's people like you that make Sanchay such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, scenarios, etc.)
- **Describe the behavior you observed and what you expected**
- **Include screenshots** if applicable
- **Include your environment details** (OS, Node.js version, Electron version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions you've considered**

### Adding Support for New Data Sources

One of the most valuable contributions is adding support for parsing transactions from new sources. To do this:

1. Identify the data format and structure
2. Create parsing logic in the appropriate module
3. Add test cases for the new patterns
4. Submit a PR with documentation

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** following our coding standards
4. **Test your changes**: `npm run lint` and test in Electron dev mode
5. **Commit your changes** with a clear commit message
6. **Push to your fork** and submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/sanchayapp.git
cd sanchayapp

# Install dependencies
npm install

# Start development mode
npm run electron:dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types/interfaces (avoid `any`)
- Use meaningful variable and function names

### React Components

- Use functional components with hooks
- Keep components focused and single-purpose
- Use the existing theme system (`useTheme` hook)

### Styling

- Use Tailwind CSS classes
- Follow the existing glassmorphism design patterns
- Use the theme colors from `src/lib/theme.tsx`

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Keep the first line under 72 characters
- Reference issues and pull requests when relevant

Example:
```
Add transaction categorization for retail purchases

- Parse merchant names to identify category
- Add mapping for common retailers
- Implement fuzzy matching for variations

Fixes #123
```

## Project Structure

```
sanchay/
├── electron/              # Electron main process
│   ├── main.ts           # Main process entry point
│   ├── preload.ts        # Preload script (IPC bridge)
│   └── lib/              # Core modules
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Shared utilities
│   └── types/            # TypeScript type definitions
└── public/               # Static assets
```

## Testing

Currently, we test manually in development mode. We welcome contributions to add automated testing!

```bash
# Run in development mode with hot reload
npm run electron:dev

# Build for production (to test production build)
npm run electron:build
```

## Privacy Considerations

When contributing, please keep our core privacy principles in mind:

- **Never add telemetry or analytics**
- **Never add network calls that send user data**
- **All data must remain on the user's device**
- **Any new features must work offline**

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

## License

By contributing to Sanchay, you agree that your contributions will be licensed under the MIT License.
