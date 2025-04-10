import IndexModuleLink from "./IndexModuleLink";
import styles from "./Index.module.scss"

function UserReportIcon() {

    const icon_path = "./img/inv_inscription_80_scroll.jpg"

    return <img
    className="wow-border-artifact icon-l rounded"
    src={icon_path}
    alt="user report icon"
    />
}


export default function IndexUserReport() {

    return (
        <IndexModuleLink title="Custom Report:" url="/user_report" className={styles.user_report_link}>
            <UserReportIcon />
            <span className="h2">Load Log</span>
        </IndexModuleLink>
    )
}
