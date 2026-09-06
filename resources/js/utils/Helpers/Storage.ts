/**
 * Storage Utilities
 *
 * Provides a thin, type-safe abstraction over browser storage APIs.
 * All functions are pure and side-effect boundaries are explicit.
 */

export type Serializable = string | number | boolean | Record<string, unknown> | Array<unknown> | null;

/**
 * Safely serialize a value to JSON.
 */
function serialize(value: Serializable): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Safely deserialize JSON.
 */
function deserialize<T>(value: string): T | null {
    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

/**
 * Store value in localStorage.
 *
 * @param key Storage key
 * @param value Serializable value
 */
export function storeToLocalStorage<T extends Serializable>(key: string, value: T): void {
    if (value === undefined) return;
    localStorage.setItem(key, serialize(value));
}

/**
 * Retrieve value from localStorage.
 *
 * @param key Storage key
 */
export function getFromLocalStorage<T = unknown>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    return deserialize<T>(raw);
}

/**
 * Clear all localStorage data.
 */
export function clearLocalStorage(): void {
    localStorage.clear();
}
