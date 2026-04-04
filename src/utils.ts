
/**
 * Formats a number of seconds into a time string with minutes and seconds.
 * eg.: `toMMSS(123.456, 2)` returns `"02:03.46"`
 * @param seconds time in seconds
 * @param decimals number of decimal places to include in the seconds part
 * @returns string in the format "MM:SS.ss"
 */
export function toMMSS(seconds: number, decimals = 0) {
    const sign = seconds < 0 ? "-" : ""
    const t = Math.abs(seconds)

    const factor = Math.pow(10, decimals)
    const rounded = Math.round(t * factor) / factor

    let m = Math.floor(rounded / 60)
    let s = rounded - m * 60

    // Handle edge case where rounding pushes seconds to 60
    if (s >= 60) {
        m += 1
        s = 0
    }

    // convert to padded strings
    const mm = String(m).padStart(2, "0")
    const ss = decimals > 0
        ? s.toFixed(decimals).padStart(2 + 1 + decimals, "0")
        : String(Math.floor(s)).padStart(2, "0")

    return `${sign}${mm}:${ss}`
}


// convert a time "1:23" to seconds
export function time_to_seconds(text: string) {

    const regex = /(?<minutes>\d+):(?<seconds>\d{2})/
    const found = text.match(regex)
    if (!found?.groups) { return }
    return parseInt(found.groups.minutes) * 60 + parseInt(found.groups.seconds)
}

/**
 * Formats a number in seconds into a time string with minutes and seconds.
 */
export function seconds_to_time(seconds: number, { padding = true }) {
    let text = new Date(seconds * 1000).toISOString().substr(14, 5);
    if (!padding && text.charAt(0) === '0') { text = text.substring(1); } // remove leading 0
    return text;
}


/**
 * Format a unix timetamp in seconds to HH:MM
 */
export function timetamp_to_time(timestamp?: string) {
    if (!timestamp) { return "00:00" }

    const date = new Date(timestamp)
    const text = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    return text;
}


/**
 * Format a large number using "k" for thousands
 * @param n the number to format
 * @param digits decimal places
 * @returns string
 */
// based on: https://stackoverflow.com/a/9461657
export function kFormatter(n: number, digits = 1) {

    if (n > 999) {
        return (n / 1000).toFixed(digits) + "k"
    }
    return n.toFixed(0);
}

export function slug(str: string) {
    return str
        .replace(/(^\s+)|(\s+$)/g, '')   // trim
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
        .replace(/\s+/g, '-')        // Collapse whitespace and replace by -
        .replace(/-+/g, '-');        // Collapse dashes
}



export function get_pull_color(percent: number) {
    if (percent <= 3) { return "astounding" }
    if (percent <= 10) { return "legendary" }
    if (percent <= 25) { return "epic" }
    if (percent <= 50) { return "rare" }
    if (percent <= 75) { return "uncommon" }
    return "common"
}


/**
 * @description
 * Takes an Array<V>, and a grouping function,
 * and returns a Map of the array grouped by the grouping function.
 */
export function group_by<T>(list: T[], key_getter: Function) {
    const result: { [key: string | number]: T[] } = {};
    list.forEach((item) => {
        const key = key_getter(item);
        result[key] = [...(result[key] || []), item]
    });
    return result;
}

/**
 * Gets uniuqe values from a list of items.
 * @param items the items to process
 * @param getter a function that is used to access which property to use
 */
export function get_unique_values(items: any[], getter: Function) {
    const unique = [...new Set(items.map(item => getter(item)))]
    return Array.from(unique)
}


export async function sleep(duration = 2000) {
    return new Promise(r => setTimeout(r, duration));
}


export function deepMerge(obj1: object, obj2: object): object {
    const result = { ...obj1 };

    for (let key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
                result[key] = deepMerge(obj1[key], obj2[key]);
            } else {
                result[key] = obj2[key];
            }
        }
    }

    return result;
}
