// File: src/middleware/domainMiddleware.js

const fs = require("fs");
const path = require("path");
const { findDomainInProject, handleHealthRedirect, loadDatabase } = require('../services/domainService');
const { sendTelegramMessage } = require('../utils/telegram');
require('dotenv').config({ path: '/root/.env' });

// Environment variables
const DATABASE_JSON = process.env.DATABASE_JSON_PATH || './database.json';
const BOT_TOKEN = process.env.INDEX_NEW_BOT_TOKEN;
const GROUP_CHAT_ID = process.env.INDEX_NEW_GROUP_CHAT_ID;

/**
 * Middleware to handle domain mapping and redirection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const domainMiddleware = async (req, res, next) => {
  try {
    // Skip domain checking for static assets and API routes if needed
    if (req.path.startsWith('/api/') || req.path.startsWith('/static/')) {
      return next();
    }
    
    // Get host from request
    const host = req.get('host');
    
    if (!host) {
      return next();
    }
    
    // Read database
    let database;
    try {
      database = loadDatabase(DATABASE_JSON);
    } catch (error) {
      console.error(`Error reading database: ${error.message}`);
      return res.status(500).send('Server configuration error');
    }
    
    // Find domain info
    const domainInfo = findDomainInProject(database, host);
    
    if (!domainInfo) {
      console.log(`Domain not found in database: ${host}`);
      return next();
    }
    
    // Check if redirection is needed
    const redirectDomain = handleHealthRedirect(domainInfo);
    
    if (redirectDomain && redirectDomain !== host) {
      console.log(`Redirecting from ${host} to ${redirectDomain}`);
      
      // Log the redirect
      await sendTelegramMessage(
        `🔄 Redirecting request:\n` +
        `- From: <code>${host}</code>\n` +
        `- To: <code>${redirectDomain}</code>\n` +
        `- Path: <code>${req.path}</code>\n` +
        `- Project: <code>${domainInfo.projectId}/${domainInfo.projectName}</code>`,
        GROUP_CHAT_ID,
        BOT_TOKEN
      );
      
      return res.redirect(301, `https://${redirectDomain}${req.originalUrl}`);
    }
    
    // Store domain info in the request object for use in other middleware
    req.domainInfo = domainInfo;
    
    // Continue processing
    next();
  } catch (error) {
    console.error('Error in domain mapping middleware:', error);
    next();
  }
};

module.exports = domainMiddleware;