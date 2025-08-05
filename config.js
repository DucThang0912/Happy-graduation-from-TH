/**
 * Configuration file for tracking and analytics
 * Update these values according to your setup
 */

const CONFIG = {
    // Google Sheets Integration
    googleSheets: {
        enabled: true, // Set to true after setup
        url: 'https://script.google.com/macros/s/AKfycbw76ojLzsIsrKrgB9weFSBpRED9oNrz--vXaeBBxsJxrCeP5Wft3b7pBxBL6pbX3Nlh/exec', // Your Google Apps Script web app URL
        spreadsheetId: '1WH2hPy8rttJ6wcC5PY9bqmJsyN3xp3BG9WNDoCzoAWA', // Your Google Sheet ID
        sheetName: 'Form Submissions'
    },

    // Analytics
    analytics: {
        googleAnalytics: {
            enabled: false,
            measurementId: '' // GA4 Measurement ID
        },
        facebookPixel: {
            enabled: false,
            pixelId: '' // Facebook Pixel ID
        }
    },

    // Data Storage
    storage: {
        localStorage: {
            enabled: true,
            maxEntries: 100
        },
        pendingSync: {
            enabled: true,
            maxRetries: 3
        }
    },

    // Form Configuration
    form: {
        fields: {
            name: {
                required: true,
                minLength: 2,
                maxLength: 50
            },
            userType: {
                required: true,
                options: ['outsider', 'student']
            }
        },
        validation: {
            showErrors: true,
            autoFocus: true
        }
    },

    // UI Configuration
    ui: {
        showSuccessMessage: true,
        showErrorMessage: true,
        loadingDuration: 800, // ms
        animations: {
            enabled: true,
            duration: 300
        }
    },

    // Debug Mode
    debug: {
        enabled: false,
        logSubmissions: true,
        logErrors: true
    }
};

// Helper functions
const ConfigHelper = {
    /**
     * Get Google Sheets URL
     */
    getGoogleSheetsUrl() {
        return CONFIG.googleSheets.enabled ? CONFIG.googleSheets.url : null;
    },

    /**
     * Check if Google Analytics is enabled
     */
    isGoogleAnalyticsEnabled() {
        return CONFIG.analytics.googleAnalytics.enabled && CONFIG.analytics.googleAnalytics.measurementId;
    },

    /**
     * Check if Facebook Pixel is enabled
     */
    isFacebookPixelEnabled() {
        return CONFIG.analytics.facebookPixel.enabled && CONFIG.analytics.facebookPixel.pixelId;
    },

    /**
     * Get validation rules for form fields
     */
    getValidationRules(fieldName) {
        return CONFIG.form.fields[fieldName] || {};
    },

    /**
     * Log debug message
     */
    log(message, type = 'info') {
        if (CONFIG.debug.enabled) {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
        }
    },

    /**
     * Validate configuration
     */
    validate() {
        const errors = [];

        if (CONFIG.googleSheets.enabled && !CONFIG.googleSheets.url) {
            errors.push('Google Sheets URL is required when Google Sheets is enabled');
        }

        if (CONFIG.analytics.googleAnalytics.enabled && !CONFIG.analytics.googleAnalytics.measurementId) {
            errors.push('Google Analytics Measurement ID is required when Google Analytics is enabled');
        }

        if (CONFIG.analytics.facebookPixel.enabled && !CONFIG.analytics.facebookPixel.pixelId) {
            errors.push('Facebook Pixel ID is required when Facebook Pixel is enabled');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ConfigHelper };
} 