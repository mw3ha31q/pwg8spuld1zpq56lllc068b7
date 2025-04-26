// File: src/services/domainService.js
const fs = require("fs");

/**
 * Finds domain information in the database
 * @param {Object} database - The database object
 * @param {string} host - The hostname to look up
 * @returns {Object|null} Domain information or null if not found
 */
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

/**
 * Finds a healthy domain for redirection if needed
 * @param {Object} project - The project object containing domains
 * @returns {string|null} A healthy domain or null if none found
 */
function findHealthyDomain(project) {
  for (const [domain, domainData] of Object.entries(project.domains)) {
    if (domainData.healthy === true || domainData.healthy === "true") {
      return domain;
    }
  }
  return null;
}

/**
 * Handles redirection if the current domain is not healthy
 * @param {Object} domainInfo - Domain information object
 * @returns {string|false} Target domain to redirect to or false if no redirection needed
 */
function handleHealthRedirect(domainInfo) {
  const { project, domainData } = domainInfo;
  
  // Don't redirect if redirection is not enabled for this project
  if (!project.redirect) {
    return false;
  }
  
  // Don't redirect if the current domain is healthy
  if (domainData.healthy === true || domainData.healthy === "true") {
    return false;
  }
  
  // Find a healthy domain to redirect to
  const healthyDomain = findHealthyDomain(project);
  if (healthyDomain) {
    return healthyDomain;
  }
  
  // If we have a currentDomain field, use that as a fallback
  if (project.currentDomain) {
    return project.currentDomain;
  }
  
  return false;
}

/**
 * Loads the database from the filesystem
 * @param {string} databasePath - Path to the database JSON file
 * @returns {Object} The parsed database object
 */
function loadDatabase(databasePath) {
  try {
    return JSON.parse(fs.readFileSync(databasePath));
  } catch (error) {
    console.error(`Error reading database: ${error.message}`);
    throw new Error('Failed to load database');
  }
}

module.exports = {
  findDomainInProject,
  findHealthyDomain,
  handleHealthRedirect,
  loadDatabase
};