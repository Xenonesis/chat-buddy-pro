# Chat Buddy Pro

A modern, feature-rich chat application built with Next.js, React, and TypeScript that enables seamless communication with AI assistants.

![Chat Buddy Pro](https://github.com/Xenonesis/chat-buddy-pro/raw/master/public/screenshot.png)

## Features

- 💬 Real-time chat interface with AI assistants
- 🌓 Light/Dark theme support
- 🌐 Internationalization (i18n) with support for multiple languages
- 📱 Fully responsive design for all device sizes
- 🔐 Secure API key management
- 📊 Personalized suggestions based on chat history
- ⚡ Quick commands for common actions
- 🖼️ Image generation capabilities
- 📄 Code syntax highlighting
- 🔄 Data import/export functionality

## Recent Fixes

- 🔧 Fixed type error in ChatContainer component for onSettingChange prop
- 🔧 Fixed jsPDF compatibility issue in DataManagement component
- 🔧 Improved browser compatibility by removing obsolete msMaxTouchPoints property
- 🔧 Resolved framer-motion type conflicts
- 🔧 Added missing storage keys for conversation management feature

For a complete list of changes, please see the [CHANGELOG.md](CHANGELOG.md) file.

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Xenonesis/chat-buddy-pro.git
cd chat-buddy-pro
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:

```
API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Tech Stack

- **Frontend**: React, Next.js, TypeScript
- **Styling**: TailwindCSS, CSS Modules
- **Internationalization**: next-i18next
- **Code Highlighting**: react-syntax-highlighter
- **Animation**: Framer Motion
- **Icons**: React Icons

## Project Structure

```
chat-buddy-pro/
├── components/      # React components
├── contexts/        # React context providers
├── hooks/           # Custom React hooks
├── locales/         # i18n translation files
├── pages/           # Next.js pages
├── public/          # Static assets
├── styles/          # CSS and styling
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements

- Next.js team for the amazing framework
- React team for the library that powers our UI
- All open-source contributors whose libraries are used in this project
