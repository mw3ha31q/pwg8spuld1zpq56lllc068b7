// File: src/server.js
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 80;
const { sendTelegramMessage } = require("./utils/telegram");
const domainMiddleware = require("./middleware/domainMiddleware");
const staticFilesMiddleware = require("./middleware/staticFilesMiddleware");
const createDeviceRedirectMiddleware = require("./middleware/deviceRedirectMiddleware");
const { setupDynamicRoutes } = require("./routes/dynamicPathRoutes");
const errorHandlers = require("./utils/errorHandlers");
require('dotenv').config({ path: '/root/.env' });

// Environment variables
const BOT_TOKEN = process.env.INDEX_NEW_BOT_TOKEN;
const GROUP_CHAT_ID = process.env.INDEX_NEW_GROUP_CHAT_ID;
const RESOURCES_BASE_PATH = process.env.RESOURCES_BASE_PATH || './resources/';

// Middleware for JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(domainMiddleware);

// Device detection middleware for dynamic paths
// This will match paths that start with '/detect/' followed by any pattern
app.use(createDeviceRedirectMiddleware({
  pathPattern: /^\/detect\/.*$/,
  getMobilePath: (req) => {
    // Extract the dynamic part after '/detect/'
    const dynamicPath = req.path.replace(/^\/detect\//, '');
    return `/mobile/${dynamicPath}`;
  },
  getDesktopPath: (req) => {
    // Extract the dynamic part after '/detect/'
    const dynamicPath = req.path.replace(/^\/detect\//, '');
    return `/desktop/${dynamicPath}`;
  },
  preserveQueryParams: true,
  preserveParams: ['token', 'jwt', 'auth'] // Specifically preserve these params for security
}));

// Setup dynamic routes for handling device-specific content
setupDynamicRoutes(app);

app.use(staticFilesMiddleware);

// Set up common resource paths
app.use('/images', express.static(path.join(RESOURCES_BASE_PATH, 'images')));
app.use('/scripts', express.static(path.join(RESOURCES_BASE_PATH, 'scripts')));
app.use('/styles', express.static(path.join(RESOURCES_BASE_PATH, 'styles')));

// Routes for mobile and desktop specific paths with dynamic segments
app.get('/mobile/*', (req, res) => {
  if (req.domainInfo) {
    const { projectId, projectName } = req.domainInfo;
    const fs = require("fs");
    
    // Extract the dynamic path segment
    const dynamicPath = req.path.replace(/^\/mobile\//, '');
    
    // Try three possibilities in order of specificity:
    // 1. A specific mobile file for this path
    // 2. The generic mobile.html
    // 3. The default index.html
    const specificMobilePath = path.join(RESOURCES_BASE_PATH, `sites/${projectId}/${projectName}/mobile/${dynamicPath}.html`);
    const genericMobilePath = path.join(RESOURCES_BASE_PATH, `sites/${projectId}/${projectName}/mobile.html`);
    const fallbackPath = path.join(RESOURCES_BASE_PATH, `sites/${projectId}/${projectName}/index.html`);
    
    if (fs.existsSync(specificMobilePath)) {
      return res.sendFile(specificMobilePath);
    } else if (fs.existsSync(genericMobilePath)) {
      return res.sendFile(genericMobilePath);
    } else if (fs.existsSync(fallbackPath)) {
      return res.sendFile(fallbackPath);
    }
  }
  
  res.status(404).send('Mobile version not found');
});

app.get('/desktop/*', (req, res) => {
  if (req.domainInfo) {
    const { projectId, projectName } = req.domainInfo;
    const fs = require("fs");
    
    // Extract the dynamic path segment
    const dynamicPath = req.path.replace(/^\/desktop\//, '');
    
    // Try three possibilities in order of specificity:
    // 1. A specific desktop file for this path
    // 2. The generic desktop.html
    // 3. The default index.html
    const specificDesktopPath = path.join(RESOURCES_BASE_PATH, `sites/${projectId}/${projectName}/desktop/${dynamicPath}.html`);
    const genericDesktopPath = path.join(RESOURCES_BASE_PATH, `sites/${projectId}/${projectName}/desktop.html`);
    const fallbackPath = path.join(RESOURCES_BASE_PATH, `sites/${projectId}/${projectName}/index.html`);
    
    if (fs.existsSync(specificDesktopPath)) {
      return res.sendFile(specificDesktopPath);
    } else if (fs.existsSync(genericDesktopPath)) {
      return res.sendFile(genericDesktopPath);
    } else if (fs.existsSync(fallbackPath)) {
      return res.sendFile(fallbackPath);
    }
  }
  
  res.status(404).send('Desktop version not found');
});

// Default route handler
app.get('/', (req, res) => {
  if (req.domainInfo) {
    const { projectId, projectName } = req.domainInfo;
    const fs = require("fs");
    const indexPath = path.join(RESOURCES_BASE_PATH, `sites/${projectId}/${projectName}/index.html`);
    
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  res.status(404).send('Not Found');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  sendTelegramMessage(
    `🚀 Server started on port ${port} at ${new Date().toISOString()}`,
    GROUP_CHAT_ID,
    BOT_TOKEN
  );
});

// Set up global error handlers
errorHandlers.setupErrorHandlers(BOT_TOKEN, GROUP_CHAT_ID);