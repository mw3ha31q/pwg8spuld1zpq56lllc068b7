// File: src/middleware/staticFilesMiddleware.js
const fs = require("fs");
const path = require("path");
require('dotenv').config({ path: '/root/.env' });

// Environment variables
const RESOURCES_BASE_PATH = process.env.RESOURCES_BASE_PATH || './resources/';

/**
 * Middleware to serve static files for the appropriate domain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const staticFilesMiddleware = (req, res, next) => {
  if (!req.domainInfo) {
    return next();
  }
  
  const { projectId, projectName } = req.domainInfo;
  const sitePath = path.join(RESOURCES_BASE_PATH, `sites/${projectId}/${projectName}`);
  
  // Handle resource paths (/images, /scripts, /styles)
  if (req.path.startsWith('/images/') || req.path.startsWith('/scripts/') || req.path.startsWith('/styles/')) {
    const resourceType = req.path.split('/')[1]; // 'images', 'scripts', or 'styles'
    const resourcePath = req.path.slice(resourceType.length + 2); // Remove '/resourceType/' from path
    const fullResourcePath = path.join(RESOURCES_BASE_PATH, resourceType, resourcePath);
    
    if (fs.existsSync(fullResourcePath) && fs.statSync(fullResourcePath).isFile()) {
      return res.sendFile(fullResourcePath);
    }
  }
  
  // Serve the requested file if it exists
  const requestedPath = path.join(sitePath, req.path);
  
  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    return res.sendFile(requestedPath);
  }
  
  // If path ends with / or has no extension, try to serve index.html
  if (req.path === '/' || req.path.endsWith('/') || !path.extname(req.path)) {
    const indexPath = path.join(sitePath, req.path, 'index.html').replace(/\/+/g, '/');
    
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  next();
};

module.exports = staticFilesMiddleware;