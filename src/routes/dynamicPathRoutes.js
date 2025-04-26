// File: src/routes/dynamicPathRoutes.js
const fs = require('fs');
const path = require('path');
const { isMobileDevice } = require('../utils/deviceDetection');
require('dotenv').config({ path: '/root/.env' });

// Environment variables
const DATABASE_JSON = process.env.DATABASE_JSON_PATH || './database.json';
const RESOURCES_BASE_PATH = process.env.RESOURCES_BASE_PATH || './resources/';
const ALLOWED_TAGS = (process.env.ALLOWED_TAGS || '').split(',');

// Helper functions
function findDomainInProject(database, host) {
  const { ids } = database;
  
  for (const projectId in ids) {
    const projectData = ids[projectId];
    for (const projectName in projectData.projects) {
      const project = projectData.projects[projectName];
      if (project.domains && project.domains[host]) {
        return {
          projectId,
          projectName,
          domainData: project.domains[host],
          project: project
        };
      }
    }
  }
  
  return null;
}

function isMultilangEnabled(projectTags) {
  return Array.isArray(projectTags) 
    ? projectTags.includes('multilang')
    : projectTags === 'multilang';
}

// Configure dynamic routes
function setupDynamicRoutes(app) {
  // Route for dynamic path with device detection
  app.get('/:dynamicPath([a-zA-Z0-9]{24})', async (req, res, next) => {
    try {
      const database = JSON.parse(fs.readFileSync(DATABASE_JSON).toString("utf-8"));
      const domainInfo = findDomainInProject(database, req.headers["host"]);
      
      if (!domainInfo) {
        return next();
      }
      
      const projectTags = database.ids[domainInfo.projectId].projects[domainInfo.projectName].tags || [];
      const hasAllowedTag = Array.isArray(projectTags) 
        ? projectTags.some(tag => ALLOWED_TAGS.includes(tag))
        : ALLOWED_TAGS.includes(projectTags);
      
      if (!hasAllowedTag) {
        return next();
      }
      
      // Detect if user is on mobile
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = isMobileDevice(userAgent);
      
      // Choose appropriate file path based on device type
      let fileToServe = 'index.html';
      if (isMobile) {
        fileToServe = 'mobile.html';
      } else {
        fileToServe = 'desktop.html';
      }
      
      // Check for multilang support
      if (isMultilangEnabled(projectTags)) {
        const deviceSpecificPath = path.join(
          RESOURCES_BASE_PATH,
          'safeguard/html_files',
          fileToServe
        );
        
        if (fs.existsSync(deviceSpecificPath)) {
          let pageContent = fs.readFileSync(deviceSpecificPath, { encoding: 'utf-8' });
          res.set('Content-Type', 'text/html');
          res.send(Buffer.from(pageContent));
          return;
        }
      }
      
      // Fallback to sites directory
      const fallbackOrder = [
        // Device-specific file in device subdirectory
        path.join(RESOURCES_BASE_PATH, `sites/${domainInfo.projectId}/${domainInfo.projectName}/${isMobile ? 'mobile' : 'desktop'}/${fileToServe}`),
        // Device-specific file in root
        path.join(RESOURCES_BASE_PATH, `sites/${domainInfo.projectId}/${domainInfo.projectName}/${fileToServe}`),
        // Default index.html
        path.join(RESOURCES_BASE_PATH, `sites/${domainInfo.projectId}/${domainInfo.projectName}/index.html`)
      ];
      
      for (const filePath of fallbackOrder) {
        if (fs.existsSync(filePath)) {
          let pageContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
          res.set('Content-Type', 'text/html');
          res.send(Buffer.from(pageContent));
          return;
        }
      }
      
      // If we reached here, no file was found
      next();
      
    } catch (err) {
      console.error('Error serving dynamic path HTML:', err);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Route for specific HTML files with dynamic paths
  app.get('/:dynamicPath([a-zA-Z0-9]{24})/:filename([a-zA-Z0-9]{24}_[^/]+).html', async (req, res, next) => {
    try {
      const database = JSON.parse(fs.readFileSync(DATABASE_JSON).toString("utf-8"));
      const domainInfo = findDomainInProject(database, req.headers["host"]);
      
      if (!domainInfo) {
        return next();
      }
      
      const projectTags = database.ids[domainInfo.projectId].projects[domainInfo.projectName].tags || [];
      const hasAllowedTag = Array.isArray(projectTags) 
        ? projectTags.some(tag => ALLOWED_TAGS.includes(tag))
        : ALLOWED_TAGS.includes(projectTags);
      
      if (!hasAllowedTag) {
        return next();
      }
      
      // Extract original filename
      const originalFilename = req.params.filename.split('_')[1] + '.html';
      
      // Detect if user is on mobile
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = isMobileDevice(userAgent);
      
      // Modify filename based on device type
      let deviceSpecificFilename;
      if (isMobile) {
        // For mobile, use mobile_ prefix
        deviceSpecificFilename = 'mobile_' + originalFilename;
      } else {
        // For desktop, use desktop_ prefix
        deviceSpecificFilename = 'desktop_' + originalFilename;
      }
      
      // Check for multilang support
      if (isMultilangEnabled(projectTags)) {
        // First try device-specific file
        const deviceFilePath = path.join(
          RESOURCES_BASE_PATH,
          'safeguard/html_files',
          deviceSpecificFilename
        );
        
        // Then try original file
        const originalFilePath = path.join(
          RESOURCES_BASE_PATH,
          'safeguard/html_files',
          originalFilename
        );
        
        // Check if either file exists
        let htmlPath = null;
        
        if (fs.existsSync(deviceFilePath)) {
          htmlPath = deviceFilePath;
        } else if (fs.existsSync(originalFilePath)) {
          htmlPath = originalFilePath;
        }
        
        if (htmlPath) {
          let pageContent = fs.readFileSync(htmlPath, { encoding: 'utf-8' });
          res.set('Content-Type', 'text/html');
          res.send(Buffer.from(pageContent));
          return;
        }
      }
      
      // Fallback to sites directory with device-specific files
      const fallbackOrder = [
        // Device-specific file
        path.join(RESOURCES_BASE_PATH, `sites/${domainInfo.projectId}/${domainInfo.projectName}/${deviceSpecificFilename}`),
        // Original filename
        path.join(RESOURCES_BASE_PATH, `sites/${domainInfo.projectId}/${domainInfo.projectName}/${originalFilename}`)
      ];
      
      for (const filePath of fallbackOrder) {
        if (fs.existsSync(filePath)) {
          let pageContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
          res.set('Content-Type', 'text/html');
          res.send(Buffer.from(pageContent));
          return;
        }
      }
      
      // If we reached here, no file was found
      next();
      
    } catch (err) {
      console.error('Error serving dynamic HTML file:', err);
      res.status(500).send('Internal Server Error');
    }
  });
}

module.exports = {
  setupDynamicRoutes
};