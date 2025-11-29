/**
 * Entity Filter Utility
 * Filters Home Assistant entities based on configuration rules
 */

export interface FilterConfig {
    allowed_domains?: string[];
    hide_patterns?: string[];
    force_show_patterns?: string[];
    force_hide?: string[];
    filter_options?: {
        show_main_entities_only?: boolean;
        require_area?: boolean;
        hide_disabled?: boolean;
        hide_hidden?: boolean;
        hide_unavailable?: boolean;
        hide_without_friendly_name?: boolean;
    };
    attribute_filters?: {
        hide_device_classes?: string[];
        show_only_device_classes?: string[];
    };
    display_options?: {
        max_entities_per_zone?: number;
        sort_by?: 'name' | 'state' | 'last_changed' | 'domain';
        sort_order?: 'asc' | 'desc';
    };
}

export interface HAEntity {
    entity_id: string;
    state: string;
    attributes: {
        friendly_name?: string;
        device_class?: string;
        hidden?: boolean;
        disabled?: boolean;
        area_id?: string;
        [key: string]: any;
    };
    last_changed?: string;
    last_updated?: string;
}

/**
 * Check if a string matches a pattern with wildcards
 */
function matchesPattern(str: string, pattern: string): boolean {
    const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
        .replace(/\*/g, '.*'); // Replace * with .*
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(str);
}

/**
 * Check if entity matches any pattern in the list
 */
function matchesAnyPattern(entityId: string, patterns: string[]): boolean {
    return patterns.some(pattern => matchesPattern(entityId, pattern));
}

/**
 * Determine if an entity is a "main" entity (not auxiliary like battery, signal, etc.)
 */
function isMainEntity(entity: HAEntity): boolean {
    const auxiliaryPatterns = [
        '*_battery*',
        '*_signal*',
        '*_linkquality*',
        '*_rssi*',
        '*_update*',
        '*_last_seen*',
        '*_device_temperature*',
    ];

    return !matchesAnyPattern(entity.entity_id, auxiliaryPatterns);
}

/**
 * Filter entities based on configuration
 */
export function filterEntities(
    entities: HAEntity[],
    config: FilterConfig
): HAEntity[] {
    console.log(`[EntityFilter] Filtering ${entities.length} entities with config:`, config);

    let filtered = [...entities];

    // Step 1: Filter by allowed domains
    if (config.allowed_domains && config.allowed_domains.length > 0) {
        filtered = filtered.filter(entity => {
            const domain = entity.entity_id.split('.')[0];
            return config.allowed_domains!.includes(domain);
        });
        console.log(`[EntityFilter] After domain filter: ${filtered.length} entities`);
    }

    // Step 2: Apply hide patterns
    if (config.hide_patterns && config.hide_patterns.length > 0) {
        filtered = filtered.filter(entity => {
            return !matchesAnyPattern(entity.entity_id, config.hide_patterns!);
        });
        console.log(`[EntityFilter] After hide patterns: ${filtered.length} entities`);
    }

    // Step 3: Apply filter options
    if (config.filter_options) {
        const opts = config.filter_options;

        // Show main entities only
        if (opts.show_main_entities_only) {
            filtered = filtered.filter(isMainEntity);
            console.log(`[EntityFilter] After main entities filter: ${filtered.length} entities`);
        }

        // Require area
        if (opts.require_area) {
            filtered = filtered.filter(entity => entity.attributes.area_id);
            console.log(`[EntityFilter] After area requirement: ${filtered.length} entities`);
        }

        // Hide disabled
        if (opts.hide_disabled) {
            filtered = filtered.filter(entity => !entity.attributes.disabled);
        }

        // Hide hidden
        if (opts.hide_hidden) {
            filtered = filtered.filter(entity => !entity.attributes.hidden);
        }

        // Hide unavailable
        if (opts.hide_unavailable) {
            filtered = filtered.filter(entity =>
                entity.state !== 'unavailable' && entity.state !== 'unknown'
            );
            console.log(`[EntityFilter] After unavailable filter: ${filtered.length} entities`);
        }

        // Hide without friendly name
        if (opts.hide_without_friendly_name) {
            filtered = filtered.filter(entity => entity.attributes.friendly_name);
        }
    }

    // Step 4: Apply attribute filters
    if (config.attribute_filters) {
        const attrFilters = config.attribute_filters;

        // Hide specific device classes
        if (attrFilters.hide_device_classes && attrFilters.hide_device_classes.length > 0) {
            filtered = filtered.filter(entity => {
                const deviceClass = entity.attributes.device_class;
                return !deviceClass || !attrFilters.hide_device_classes!.includes(deviceClass);
            });
            console.log(`[EntityFilter] After device class hide: ${filtered.length} entities`);
        }

        // Show only specific device classes
        if (attrFilters.show_only_device_classes && attrFilters.show_only_device_classes.length > 0) {
            filtered = filtered.filter(entity => {
                const deviceClass = entity.attributes.device_class;
                return deviceClass && attrFilters.show_only_device_classes!.includes(deviceClass);
            });
        }
    }

    // Step 5: Force show patterns (add back entities that match)
    if (config.force_show_patterns && config.force_show_patterns.length > 0) {
        const forceShowEntities = entities.filter(entity =>
            matchesAnyPattern(entity.entity_id, config.force_show_patterns!)
        );
        // Add them back if not already present
        forceShowEntities.forEach(entity => {
            if (!filtered.find(e => e.entity_id === entity.entity_id)) {
                filtered.push(entity);
            }
        });
        console.log(`[EntityFilter] After force show: ${filtered.length} entities`);
    }

    // Step 6: Force hide (remove entities that match)
    if (config.force_hide && config.force_hide.length > 0) {
        filtered = filtered.filter(entity => !config.force_hide!.includes(entity.entity_id));
        console.log(`[EntityFilter] After force hide: ${filtered.length} entities`);
    }

    // Step 7: Sort entities
    if (config.display_options?.sort_by) {
        const sortBy = config.display_options.sort_by;
        const sortOrder = config.display_options.sort_order || 'asc';

        filtered.sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortBy) {
                case 'name':
                    aVal = a.attributes.friendly_name || a.entity_id;
                    bVal = b.attributes.friendly_name || b.entity_id;
                    break;
                case 'state':
                    aVal = a.state;
                    bVal = b.state;
                    break;
                case 'last_changed':
                    aVal = a.last_changed || '';
                    bVal = b.last_changed || '';
                    break;
                case 'domain':
                    aVal = a.entity_id.split('.')[0];
                    bVal = b.entity_id.split('.')[0];
                    break;
                default:
                    return 0;
            }

            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }

    console.log(`[EntityFilter] Final filtered count: ${filtered.length} entities`);
    return filtered;
}

/**
 * Default filter configuration
 */
export const DEFAULT_FILTER_CONFIG: FilterConfig = {
    allowed_domains: [
        'light',
        'switch',
        'lock',
        'cover',
        'climate',
        'camera',
        'media_player',
        'fan',
    ],
    hide_patterns: [
        '*_battery',
        '*_signal_strength',
        '*_linkquality',
        '*_update_available',
        'sensor.sun_*',
        'sensor.time_*',
        'update.*',
    ],
    force_show_patterns: [],
    force_hide: [],
    filter_options: {
        show_main_entities_only: true,
        require_area: false,
        hide_disabled: true,
        hide_hidden: true,
        hide_unavailable: true,
        hide_without_friendly_name: false,
    },
    attribute_filters: {
        hide_device_classes: ['battery', 'timestamp', 'update'],
        show_only_device_classes: [],
    },
    display_options: {
        max_entities_per_zone: 0,
        sort_by: 'name',
        sort_order: 'asc',
    },
};
