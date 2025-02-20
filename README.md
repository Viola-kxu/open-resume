# Open Resume Project Setup Guide

This guide will help you set up and run the Open Resume project, including the backend server, Prisma database, and the autofill extension.

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn
- Chrome/Chromium-based browser (for the extension)

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install the required dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration settings.

## Prisma Setup

1. Make sure you have the Prisma CLI installed:
```bash
npm install -g prisma
```

2. Navigate to the prisma directory:
```bash
cd prisma
```

3. Initialize your database (if not already done):
```bash
prisma db push
```

4. Generate Prisma Client:
```bash
prisma generate
```

## Autofill Extension Setup

1. Navigate to the autofill-extension directory:
```bash
cd autofill-extension
```

2. Install dependencies (if any):
```bash
npm install
```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `autofill-extension` directory

## Running the Application

1. Start the backend server:
```bash
# From the backend directory, with venv activated
python main.py
```

2. The extension should now be ready to use in your browser.

## Development Notes

- The backend server runs on `http://localhost:8000` by default
- Make sure to keep your database schema in sync using Prisma
- For extension development, any changes require reloading the extension in Chrome

## Troubleshooting

If you encounter any issues:

1. Ensure all dependencies are correctly installed
2. Check that environment variables are properly set
3. Verify that the backend server is running
4. Make sure the database is properly initialized
5. For extension issues, try reloading it in Chrome

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Chrome Extension Development Guide](https://developer.chrome.com/docs/extensions/) 