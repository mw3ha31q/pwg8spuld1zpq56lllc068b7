// File: src/utils/deviceDetection.js

/**
 * Detects if the request is coming from a mobile device
 * @param {string} userAgent - The user agent string from the request
 * @returns {boolean} True if the request is from a mobile device, false otherwise
 */
function isMobileDevice(userAgent) {
    if (!userAgent) return false;
    
    // Regular expression to detect common mobile devices
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    
    return mobileRegex.test(userAgent);
  }
  
  /**
   * Detects if the request is coming from a tablet device
   * @param {string} userAgent - The user agent string from the request
   * @returns {boolean} True if the request is from a tablet device, false otherwise
   */
  function isTabletDevice(userAgent) {
    if (!userAgent) return false;
    
    // First check if it's a mobile device
    const isMobile = isMobileDevice(userAgent);
    
    // Then check for common tablet identifiers
    const tabletRegex = /iPad|tablet|Tab/i;
    const isTablet = tabletRegex.test(userAgent);
    
    // Check for iPad specifically (newer iPads may use desktop user agents)
    // Note: navigator is not available in Node.js, so we can't check maxTouchPoints
    const isIPad = /Macintosh/i.test(userAgent) && /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
    return isTablet || isIPad;
  }
  
  /**
   * Determines the device type based on the user agent
   * @param {string} userAgent - The user agent string from the request
   * @returns {string} The device type: 'mobile', 'tablet', or 'desktop'
   */
  function getDeviceType(userAgent) {
    if (isTabletDevice(userAgent)) {
      return 'tablet';
    } else if (isMobileDevice(userAgent)) {
      return 'mobile';
    } else {
      return 'desktop';
    }
  }
  
  module.exports = {
    isMobileDevice,
    isTabletDevice,
    getDeviceType
  };