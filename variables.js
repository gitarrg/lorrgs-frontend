// FIXME: this is quite bad.
// I remember using these to avoid blundling largers libs such as react into the website
// it does however cause issues when we're updating versions.


const CONFIG_DEV = {
    GOOGLE_ANALYTICS_ID: "dev_mode",
    BACKEND_URL: "http://127.0.0.1:5012",
}


const CONFIG_PROD = {
    GOOGLE_ANALYTICS_ID: "G-Y92VPCY6QW",
    BACKEND_URL: "https://api2.lorrgs.io",
}


exports.get_vars = function(mode) {
    if (mode == "production") { return CONFIG_PROD}
    return CONFIG_DEV
}
