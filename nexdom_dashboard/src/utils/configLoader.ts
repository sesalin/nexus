/**
 * Configuration Loader
 * Loads dashboard_filter.yaml from /config/nexdom_dashboard/
 */

import { FilterConfig, DEFAULT_FILTER_CONFIG } from './entityFilter';

/**
 * Load filter configuration from backend
 */
export async function loadFilterConfig(): Promise<FilterConfig> {
    try {
        console.log('[ConfigLoader] Loading filter config from backend...');

        // Request config from backend API
        const response = await fetch('/api/config/filter');

        if (!response.ok) {
            console.warn('[ConfigLoader] Failed to load config, using defaults');
            return DEFAULT_FILTER_CONFIG;
        }

        const config = await response.json();
        console.log('[ConfigLoader] Config loaded successfully:', config);

        return config;
    } catch (error) {
        console.error('[ConfigLoader] Error loading config:', error);
        return DEFAULT_FILTER_CONFIG;
    }
}
