import { Link } from "react-router-dom"
import LorrgsLogo from "../assets/LorrgsLogo"
import styles from "./HeaderLogo.scss"


export default function HeaderLogo({wow_class="wow-boss", size="icon-l"}) {

    return (
        <div className={styles.container}>
            <Link to="/">
                <LorrgsLogo className={`${styles.logo} ${wow_class} ${size} bg-dark rounded grow-when-touched`} />
            </Link>
        </div>
    )
}
