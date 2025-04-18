import Fight from "../../types/fight";
import { useAppSelector } from '../../store/store_hooks';
import { get_mode, MODES } from "../../store/ui";
import { toMMSS, get_pull_color, timetamp_to_time } from "../../utils";
import styles from "./FightInfo.module.scss"
import { WCL_URL } from "../../constants";


export function FightInfo({ fight }: { fight: Fight; }) {

    const mode = useAppSelector(get_mode)
    if (mode != MODES.USER_REPORT ) { return null }

    const pull_color = get_pull_color(fight.percent || 0)

    const className = `${styles.container} ${fight.kill ? "wow-kill": "wow-wipe"}`

    const icon = fight.kill ? "⚑ " : ""
    const label_percent = fight.kill ? "Kill! ⚑ " : `${fight.percent || 0}%`
    const label_time = timetamp_to_time(fight.start_time)

    const report_url = `${WCL_URL}/reports/${fight.report_id}#fight=${fight.fight_id}`

    // Render
    return (
        <a target="_blank" href={report_url} className={styles.link}>
            <div className={className}>

                <span className={styles.label_pull}>#{fight.fight_id}</span>
                <span className={styles.label_duration}>{icon} ({toMMSS(fight.duration/1000) })</span>

                <span className={styles.label_percent}>{label_percent}</span>
                <span className={styles.label_time}>{label_time}</span>

                <>
                {!fight.kill &&
                    <div className={styles.pbar_outer}>
                        <div className={`${styles.pbar_inner} wow-${pull_color}`} style={{width: `${100-(fight.percent || 0)}%`}} />
                    </div>
                }
                </>
            </div>
        </a>
    );
}
