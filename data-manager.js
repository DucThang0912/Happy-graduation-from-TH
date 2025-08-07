/**
 * Data Manager - Handles form data submission to various tracking services
 */

class DataManager {
    constructor() {
        this.googleSheetsUrl = null; // Will be set after deployment
        this.fallbackStorage = 'localStorage';
        this.isOnline = navigator.onLine;
        this.pendingSubmissions = [];
        
        this.init();
    }

    init() {
        // Initialize from config
        this.initFromConfig();
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processPendingSubmissions();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Load pending submissions from localStorage
        this.loadPendingSubmissions();
    }

    /**
     * Set the Google Sheets web app URL
     * @param {string} url - The deployed Google Apps Script web app URL
     */
    setGoogleSheetsUrl(url) {
        this.googleSheetsUrl = url;
    }

    /**
     * Initialize from config
     */
    initFromConfig() {
        if (typeof ConfigHelper !== 'undefined') {
            const sheetsUrl = ConfigHelper.getGoogleSheetsUrl();
            if (sheetsUrl) {
                this.setGoogleSheetsUrl(sheetsUrl);
            }
        }
    }

    /**
     * Submit form data to tracking services
     * @param {Object} data - Form data object
     * @returns {Promise<Object>} - Submission result
     */
    async submitFormData(data) {
        const submissionData = {
            name: data.name,
            userType: data.userType,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        const results = {
            googleSheets: false,
            localStorage: false,
            analytics: false
        };

        try {
            // Save to localStorage immediately (fast)
            results.localStorage = this.saveToLocalStorage(submissionData);

            // Send analytics immediately (fast)
            results.analytics = this.sendAnalytics(submissionData);

            // Try Google Sheets in background (can be slow)
            if (this.googleSheetsUrl && this.isOnline) {
                // Use Promise.race to timeout after 2 seconds
                const sheetsPromise = this.submitToGoogleSheets(submissionData);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 2000)
                );
                
                try {
                    results.googleSheets = await Promise.race([sheetsPromise, timeoutPromise]);
                } catch (error) {
                    if (error.name === 'AbortError') {
                        console.warn('Google Sheets submission likely succeeded, but response is unavailable due to no-cors.');
                    } else {
                        console.log('Google Sheets submission timed out or failed, using localStorage only');
                    }
                    this.addToPendingSubmissions(submissionData);
                }
            }

            return {
                success: true,
                results,
                message: 'Data submitted successfully'
            };

        } catch (error) {
            console.error('Error submitting form data:', error);
            
            // Add to pending submissions if online submission failed
            if (this.googleSheetsUrl) {
                this.addToPendingSubmissions(submissionData);
            }

            return {
                success: false,
                error: error.message,
                results
            };
        }
    }

    /**
     * Submit data to Google Sheets
     * @param {Object} data - Data to submit
     * @returns {Promise<boolean>} - Success status
     */
    async submitToGoogleSheets(data) {
        if (!this.googleSheetsUrl) {
            throw new Error('Google Sheets URL not configured');
        }

        // Add timeout to prevent long waits
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        try {
            const response = await fetch(this.googleSheetsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                mode: 'no-cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('Data sent to Google Sheets (no-cors mode)');
            return true;

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Google Sheets submission error:', error);
            
            // Try alternative method using form data
            try {
                const formData = new FormData();
                formData.append('data', JSON.stringify(data));
                
                const response = await fetch(this.googleSheetsUrl, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors',
                    signal: controller.signal
                });
                
                console.log('Data sent to Google Sheets (form data method)');
                return true;
                
            } catch (formError) {
                console.error('Form data submission also failed:', formError);
                throw error;
            }
        }
    }

    /**
     * Save data to localStorage as backup
     * @param {Object} data - Data to save
     * @returns {boolean} - Success status
     */
    saveToLocalStorage(data) {
        try {
            const submissions = this.getLocalStorageSubmissions();
            submissions.push({
                ...data,
                savedAt: new Date().toISOString()
            });

            // Keep only last 100 submissions to prevent storage overflow
            if (submissions.length > 100) {
                submissions.splice(0, submissions.length - 100);
            }

            localStorage.setItem('graduationFormSubmissions', JSON.stringify(submissions));
            return true;

        } catch (error) {
            console.error('LocalStorage save error:', error);
            return false;
        }
    }

    /**
     * Get submissions from localStorage
     * @returns {Array} - Array of submissions
     */
    getLocalStorageSubmissions() {
        try {
            const stored = localStorage.getItem('graduationFormSubmissions');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    /**
     * Send analytics data (Google Analytics, etc.)
     * @param {Object} data - Data to send
     * @returns {boolean} - Success status
     */
    sendAnalytics(data) {
        try {
            // Google Analytics 4 event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_submission', {
                    event_category: 'graduation_invitation',
                    event_label: data.userType,
                    custom_parameter_1: data.name,
                    custom_parameter_2: data.userType
                });
            }

            // Facebook Pixel event
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Lead', {
                    content_name: 'Graduation Invitation Form',
                    content_category: data.userType
                });
            }

            return true;

        } catch (error) {
            console.error('Analytics error:', error);
            return false;
        }
    }

    /**
     * Add submission to pending queue
     * @param {Object} data - Submission data
     */
    addToPendingSubmissions(data) {
        this.pendingSubmissions.push(data);
        this.savePendingSubmissions();
    }

    /**
     * Save pending submissions to localStorage
     */
    savePendingSubmissions() {
        try {
            localStorage.setItem('pendingSubmissions', JSON.stringify(this.pendingSubmissions));
        } catch (error) {
            console.error('Error saving pending submissions:', error);
        }
    }

    /**
     * Load pending submissions from localStorage
     */
    loadPendingSubmissions() {
        try {
            const stored = localStorage.getItem('pendingSubmissions');
            this.pendingSubmissions = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading pending submissions:', error);
            this.pendingSubmissions = [];
        }
    }

    /**
     * Process pending submissions when back online
     */
    async processPendingSubmissions() {
        if (!this.googleSheetsUrl || this.pendingSubmissions.length === 0) {
            return;
        }

        const submissions = [...this.pendingSubmissions];
        this.pendingSubmissions = [];

        for (const submission of submissions) {
            try {
                await this.submitToGoogleSheets(submission);
                console.log('Pending submission processed successfully');
            } catch (error) {
                console.error('Failed to process pending submission:', error);
                // Add back to pending queue
                this.pendingSubmissions.push(submission);
            }
        }

        this.savePendingSubmissions();
    }

    /**
     * Get submission statistics
     * @returns {Object} - Statistics object
     */
    getStatistics() {
        const localStorageSubmissions = this.getLocalStorageSubmissions();
        const pendingCount = this.pendingSubmissions.length;

        const stats = {
            totalSubmissions: localStorageSubmissions.length,
            pendingSubmissions: pendingCount,
            userTypeBreakdown: {},
            recentSubmissions: localStorageSubmissions.slice(-10)
        };

        // Calculate user type breakdown
        localStorageSubmissions.forEach(submission => {
            const type = submission.userType;
            stats.userTypeBreakdown[type] = (stats.userTypeBreakdown[type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Export data as CSV
     * @returns {string} - CSV string
     */
    exportAsCSV() {
        const submissions = this.getLocalStorageSubmissions();
        
        if (submissions.length === 0) {
            return '';
        }

        const headers = ['Timestamp', 'Name', 'User Type', 'User Agent', 'Screen Resolution', 'Timezone', 'Saved At'];
        const csvRows = [headers.join(',')];

        submissions.forEach(submission => {
            const row = [
                submission.timestamp,
                `"${submission.name}"`,
                submission.userType,
                `"${submission.userAgent}"`,
                submission.screenResolution,
                submission.timezone,
                submission.savedAt
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Download data as CSV file
     */
    downloadCSV() {
        const csv = this.exportAsCSV();
        if (!csv) {
            alert('No data to export');
            return;
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `graduation_form_submissions_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} 