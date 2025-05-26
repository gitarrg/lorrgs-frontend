
import styles from "./Ads.module.scss"
import useUser from "../../routes/auth/useUser"
import { useEffect } from "react"


export default function StickyFooterAd() {


    const user = useUser()
    const is_admin = user?.permissions.includes("admin")
    const is_subbbed = user.permissions.includes("dynamic_timers") || user.permissions.includes("user_reports") || user.permissions.includes("no_ads")



    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
        catch (e) {
            console.error("Error pushing adsbygoogle:", e);
        }
    }, []);


    if (is_subbbed && !is_admin) {
        // If the user is subscribed, do not show the ad
        return null
    }

    return (

        // responsive and native ads
        <div className={styles.sticky_footer}>
            <ins
                className="adsbygoogle"
                data-ad-client="ca-pub-4043710965953712"
                style={{
                    display: "inline-block",
                    width: "728px",
                    height: "90px"
                }}
                data-ad-slot="1185664510"
                data-ad-format="auto"
                data-full-width-responsive="true">
            </ins>
        </div>
    )
}
