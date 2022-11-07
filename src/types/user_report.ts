
import type Report from "./report";


export default interface UserReport extends Report {
    // UI Elements
    is_loading: boolean;

    /** optional error message */
    error?: string,
}
