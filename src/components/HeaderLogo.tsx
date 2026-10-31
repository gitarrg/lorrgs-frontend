import { Link } from "react-router"
import LorrgsLogo from "../assets/LorrgsLogo"
import styles from "./HeaderLogo.module.scss"


export default function HeaderLogo({wow_class="wow-boss", size="icon-l"}) {

    return (
        <div className={styles.container}>
            <Link to="/">
                <LorrgsLogo className={`${styles.logo} ${wow_class} ${size} bg-dark rounded grow-when-touched`} />
            </Link>
        </div>
    )
}
