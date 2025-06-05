import { Helmet } from "react-helmet";
import useUser from "../../routes/auth/useUser"

const ADSENSE_CLIENT_ID = "ca-pub-4043710965953712"


export default function AdSenseScriptTag() {

    const user = useUser()
    const is_subbbed = user.permissions.includes("dynamic_timers") || user.permissions.includes("user_reports") || user.permissions.includes("no_ads")
    const is_admin = user.permissions.includes("admin")

    if (is_subbbed && !is_admin) {
        // If the user is subscribed, do not show the ad
        return null
    }

    return (
        <Helmet>
            <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID} />
            <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`} crossOrigin="anonymous" />
        </Helmet>
    )
}
