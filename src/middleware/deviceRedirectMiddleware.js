// File: src/middleware/deviceRedirectMiddleware.js
const { isMobileDevice } = require('../utils/deviceDetection');

/**
 * Creates middleware that redirects users based on their device type
 * @param {Object} options - Configuration options
 * @param {RegExp|string} options.pathPattern - Path pattern that triggers the redirection
 * @param {Function} options.getMobilePath - Function to get mobile path (receives req as parameter)
 * @param {Function} options.getDesktopPath - Function to get desktop path (receives req as parameter)
 * @param {boolean} options.preserveQueryParams - Whether to preserve query parameters in the redirect
 * @param {Array<string>} options.preserveParams - Specific params to preserve (like JWT tokens)
 * @returns {Function} Express middleware function
 */
function createDeviceRedirectMiddleware(options) {
  const {
    pathPattern,
    getMobilePath,
    getDesktopPath,
    preserveQueryParams = true,
    preserveParams = []
  } = options;

  return (req, res, next) => {
    const pattern = pathPattern instanceof RegExp ? 
      pathPattern : 
      new RegExp(`^${pathPattern.replace(/\//g, '\\/').replace(/\*/g, '.*')}$`);
    
    // Only apply redirection if the path matches the pattern
    if (!pattern.test(req.path)) {
      return next();
    }

    const userAgent = req.get('user-agent');
    const isMobile = isMobileDevice(userAgent);
    
    // Determine target path based on device type
    const targetPathFn = isMobile ? getMobilePath : getDesktopPath;
    const targetPath = typeof targetPathFn === 'function' ? 
      targetPathFn(req) : 
      (isMobile ? getMobilePath : getDesktopPath);
    
    // Add any query parameters if needed
    let redirectUrl = targetPath;
    
    if (preserveQueryParams && Object.keys(req.query).length > 0) {
      // Convert target path to URL object to handle query params properly
      const url = new URL(targetPath, `http://${req.get('host')}`);
      
      // Add all query params from original request
      Object.entries(req.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
      
      // Use only the pathname and search parts (ignore the base URL)
      redirectUrl = `${url.pathname}${url.search}`;
    } else if (preserveParams.length > 0) {
      // If we're only preserving specific params
      const paramsToKeep = {};
      preserveParams.forEach(param => {
        if (req.query[param] !== undefined) {
          paramsToKeep[param] = req.query[param];
        }
      });
      
      if (Object.keys(paramsToKeep).length > 0) {
        const queryString = new URLSearchParams(paramsToKeep).toString();
        redirectUrl = `${targetPath}${targetPath.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    // Log device and redirection
    console.log(`Device detected as ${isMobile ? 'mobile' : 'desktop'}, redirecting to: ${redirectUrl}`);
    
    // Perform the redirect
    res.redirect(302, redirectUrl);
  };
}

module.exports = createDeviceRedirectMiddleware;