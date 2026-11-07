import SelectGridItem from "./SelectGrid/SelectGridItem"
import styles from "./DungeonRunWidget.module.scss"
import type Fight from "../../types/fight"
import { timetamp_to_time } from "../../utils"


/** eg.: "8m", "3h 20m" */
function format_duration(ms: number) {
    const minutes = Math.round(ms / 60_000)
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`
}


/** end time of the fight (isoformat) */
function get_end_time(fight: Fight) {
    if (!fight.start_time) { return undefined }
    return new Date(new Date(fight.start_time).getTime() + fight.duration).toISOString()
}


/**
 * A whole dungeon run in the pull selection: "#1   13:00 - 16:20   3h 20m".
 * A run that wasn't completed (`kill` false) shows as in progress.
 */
export default function DungeonRunWidget({fight, label} : {fight: Fight, label: string}) {

    const in_progress = !fight.kill
    const start = timetamp_to_time(fight.start_time)
    const end = in_progress ? "now" : timetamp_to_time(get_end_time(fight))
    const duration = in_progress ? "in progress" : format_duration(fight.duration)

    return (
        <SelectGridItem
            field_name={`fight[${fight.fight_id}]`}
            className={`${styles.container} ${in_progress ? styles.in_progress : ""}`}
        >
            <span className={styles.label}>{label}</span>
            <span className={styles.time}>{start} - {end}</span>
            <span className={styles.duration}>{duration}</span>
        </SelectGridItem>
    )
}
