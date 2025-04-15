
# Code Snippet Explorer

A modern web application for managing, editing, and executing JavaScript/TypeScript code snippets in real-time. This project provides a seamless development environment with features like live code execution, snippet management, and user authentication.

## 🚀 Features

- **Live Code Execution**: Write and execute JavaScript/TypeScript code in real-time
- **Snippet Management**: Create, edit, and organize your code snippets
- **User Authentication**: Secure login and registration system
- **Cloud Sync**: Save your snippets to the cloud when logged in
- **Local Storage**: Work offline with local snippet storage
- **Resizable Layout**: Customizable workspace with draggable panels
- **Console Output**: Built-in console for viewing code execution results
- **Modern UI**: Clean and responsive design with dark mode support

## 🛠️ Tech Stack

### Frontend
- **React**: UI library for building the user interface
- **TypeScript**: Type-safe development
- **Vite**: Modern build tool for faster development
- **TanStack Query**: Data fetching and state management
- **Monaco Editor**: Powerful code editor (same as VS Code)
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components
- **React Router**: Client-side routing
- **Lucide Icons**: Beautiful, consistent icons

### Backend & Infrastructure
- **Supabase**: Backend as a Service
  - Authentication
  - PostgreSQL Database
  - Real-time subscriptions
- **GitHub Pages**: Hosting and deployment

### Development Tools
- **ESLint**: Code linting
- **GitHub Actions**: CI/CD pipeline
- **npm**: Package management

## 🏗️ Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/      # React contexts
├── hooks/         # Custom React hooks
├── integrations/  # Third-party integrations
├── lib/          # Utility functions
├── pages/        # Route components
└── types/        # TypeScript type definitions
```

## 🚦 Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:8080](http://localhost:8080) in your browser

## 🌐 Deployment

The project is automatically deployed to GitHub Pages using GitHub Actions when changes are pushed to the main branch. The deployment process:
1. Builds the project
2. Optimizes assets
3. Deploys to the gh-pages branch
4. Makes the site available at the configured domain

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

