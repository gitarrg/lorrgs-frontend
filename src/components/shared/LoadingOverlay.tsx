/**Spinner Overlay to indicate when things are loading */
import { FaCircleNotch } from "react-icons/fa"
import styles from "./LoadingOverlay.module.scss"

export default function LoadingOverlay() {
    return (
        <div className={`${styles.overlay} h1 shadow`}>
            <FaCircleNotch className="icon-spin" />
            <span> loading..</span>
        </div>
    )
}
