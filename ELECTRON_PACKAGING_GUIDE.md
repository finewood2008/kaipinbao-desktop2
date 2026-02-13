# Electron EXE Packaging Guide

## 1. Quick Start
This guide provides a step-by-step process to package your React + TypeScript web application into a Windows EXE using Electron and electron-builder.

## 2. Installation Steps
- Ensure you have Node.js installed (version 14 or higher).
- Install Electron and electron-builder by running:
  ```bash
  npm install --save-dev electron electron-builder
  ```

## 3. Project Structure
Your project should have the following structure:
```
my-app/
├── public/
├── src/
│   ├── App.tsx
│   ├── index.tsx
│   └── ...
├── package.json
└── ...
```

## 4. Updating package.json
Add the following to your `package.json`:
```json
"main": "electron.js",
"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build",
  "pack": "electron-builder --dir",
  "dist": "electron-builder"
},
"build": {
  "appId": "com.example.myapp",
  "productName": "MyApp",
  "win": {
    "target": "nsis"
  }
}
```

## 5. Configuring App.tsx with HashRouter
In `App.tsx`, if you're using React Router, ensure you set up HashRouter as:
```jsx
import { HashRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      {/* Your Routes */}
    </Router>
  );
}
``` 

## 6. Packaging Steps
1. Build your React app:
   ```bash
   npm run build
   ```
2. Package your Electron app:
   ```bash
   npm run dist
   ```

## 7. Output File Locations
The output EXE will be located in the `dist/` directory.

## 8. Configuration Explanations
- `appId`: Unique identifier for your application.
- `productName`: The name of your application as it appears to users.
- `win.target`: Specifies the installer type (NSIS, Squirrel, etc.).

## 9. Troubleshooting Common Issues
- Ensure all dependencies are installed correctly.
- Check the console for error messages during packaging.

## 10. Offline Mode Support
To enable offline mode, ensure your assets are bundled correctly, and service workers are implemented if needed.

## 11. Window Configuration
Customize your Electron window setup in `electron.js`:
```javascript
app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });
});
```

## 12. App Icons
Specify icons in the `build` section of the `package.json`:
```json
"build": {
  "icon": "path/to/icon.ico"
}
```

## 13. Code Signing
Use a code-signing certificate to sign your application for Windows. Refer to the [electron-builder documentation](https://www.electron.build/code-signing) for detailed steps.

## 14. Performance Optimization
- Minimize bundle size using tree-shaking.
- Use lazy loading for components.

## 15. Auto-Updates
Configure auto-updates in your app to ensure users get the latest version seamlessly. Refer to the [electron-updater documentation](https://www.electron.build/auto-update) for setup instructions.

## 16. Version Update Workflow
1. Update version in `package.json`.
2. Commit changes.
3. Run `npm run dist`.

## 17. Technical Support Resources
- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build)

## 18. Pre-Packaging Checklist
- [ ] Ensure all files are included in the build.
- [ ] Check `package.json` for accuracy.
- [ ] Test your app in production mode before packaging.
- [ ] Backup your project before packaging!
