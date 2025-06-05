# Issues Pane UI - Test Guide

## What Was Added

### 1. **IssuesPane Component** (`src/components/IssuesPane.tsx`)
- GitHub-style sliding pane from the right
- Transparent/glassy design with backdrop blur
- Issue list with state icons, labels, and metadata
- Issue detail view with comments
- Filter tabs (Open/Closed/All)
- Smooth animations and hover effects

### 2. **Integration in Assistant** (`src/pages/Assistant.tsx`)
- Added "Issues" button in the header (next to Reset button)
- State management for showing/hiding the pane
- Connected to current session's repository URL

## How to Test

### 1. **Start Your Backend**
```bash
# Make sure your FastAPI server is running with the new endpoints
python -m src.main
```

### 2. **Start Your Frontend**
```bash
# In the issue-flow-ai-prompt directory
npm run dev
```

### 3. **Test Steps**
1. **Create a new chat session** with any GitHub repository
2. **Wait for the repo to be cloned and indexed**
3. **Look for the "Issues" button** in the header (next to the reset button)
4. **Click the "Issues" button** - the pane should slide in from the right
5. **Test filtering** - click Open/Closed/All tabs
6. **Click on an issue** - should show full details with comments
7. **Click "Back to issues"** - should return to the list
8. **Click outside or X button** - should close the pane

## Features to Verify

- ✅ Smooth slide-in/out animation
- ✅ Transparent/glassy background with backdrop blur
- ✅ Issue state icons (green circle for open, purple check for closed)
- ✅ Colored labels based on type (bug=red, enhancement=blue, etc.)
- ✅ Comment count display
- ✅ Date formatting
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling
- ✅ Full issue details with comments
- ✅ External link to GitHub

## Troubleshooting

### If Issues Don't Load
- Check browser console for API errors
- Verify backend is running on localhost:8000
- Check if the repository URL is valid
- Ensure GitHub token is configured in backend

### If Styling Looks Wrong
- Make sure Tailwind CSS is properly configured
- Check if all UI components (Button, ScrollArea, Badge) are available
- Verify Lucide icons are imported correctly

### If Animations Don't Work
- Check if CSS transitions are enabled
- Verify z-index values don't conflict
- Test in different browsers

## Expected User Experience

1. **Smooth GitHub-like feel** with professional UI
2. **Fast loading** of issues with pagination
3. **Intuitive navigation** between list and detail views
4. **Responsive design** that works on different screen sizes
5. **Accessible** with proper keyboard navigation and screen reader support 