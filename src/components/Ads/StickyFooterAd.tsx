
import { Adsense } from "@ctrl/react-adsense"
import styles from "./Ads.module.scss"
import useUser from "../../routes/auth/useUser"


export default function StickyFooterAd() {


    const user = useUser()
    const is_subbbed = user.permissions.includes("dynamic_timers") || user.permissions.includes("user_reports") || user.permissions.includes("no_ads")


    if (is_subbbed) {
        // If the user is subscribed, do not show the ad
        return null
    }

    return (
        // responsive and native ads
        <div className={styles.sticky_footer}>
            <Adsense
                client="ca-pub-4043710965953712"
                slot="1185664510"
                style={{
                    display: 'inline-block',
                    // width: '728px',
                    // height: '90px'
                }}
                format="auto"
                responsive="true"
            /* layout="in-article" */
            /* format="fluid" */
            />
        </div>
    )
}
