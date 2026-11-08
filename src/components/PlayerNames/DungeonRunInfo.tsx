import { FaStar } from "react-icons/fa"
import type Fight from "../../types/fight"
import type Dungeon from "../../types/dungeon"
import { format_time } from "../Timeline/tooltip"
import { toMMSS } from "../../utils"
import WebpImg from "../WebpImg"
import styles from "./DungeonRunInfo.module.scss"


/** length of the run in seconds: the keystone timer if known (it includes the countdown), else the fight's duration */
export function get_run_time(fight: Fight) {
    return (fight.keystone_time || fight.duration) / 1000
}


/** "12 Nov 2026, 21:34" */
function format_date(iso?: string) {
    if (!iso) { return null }
    const date = new Date(iso)
    const day = date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    return `${day}, ${time}`
}


/** "Kings' Rest" -> "KR", "Temple of Sethraliss" -> "ToS": the first letter of each word */
export function abbreviate(name: string) {
    return name.split(/[\s-]+/).map(word => word.replace(/[^\p{L}]/gu, "")[0] ?? "").join("")
}


/**
 * "Kings' Rest +23 ★★": the dungeon's name, the keystone level and one star per upgrade.
 * `short`: "KR+23 ★★", for the narrow `DungeonInfo`.
 */
export function DungeonRunTitle({ fight, dungeon, short = false }: { fight: Fight, dungeon: Dungeon | null, short?: boolean }) {
    const level = fight.keystone_level || 0
    const bonus = fight.keystone_bonus || 0
    return (
        <span className={styles.run_title}>
            {short
                ? <span className={styles.name}>{abbreviate(dungeon?.name ?? "Dungeon")}{level > 0 && <span className={styles.level}>+{level}</span>}</span>
                : <span className={styles.name}>{dungeon?.name ?? "Dungeon"}</span>
            }
            {!short && level > 0 && <span className={styles.level}>+{level}</span>}
            {bonus > 0 && (
                <span className={styles.stars} title={`Timed at +${bonus}`}>
                    {Array.from({ length: bonus }, (_, i) => <FaStar key={i} />)}
                </span>
            )}
        </span>
    )
}


/**
 * Summary of a dungeon run, at the top of its `PullSelect` and as the hover card of its `DungeonInfo`:
 * icon, name, keystone level and upgrade (stars); the run time vs. the par time; the date.
 */
export default function DungeonRunInfo({ fight, dungeon }: { fight: Fight, dungeon: Dungeon | null }) {

    const time = get_run_time(fight)
    const par = fight.keystone_level ? dungeon?.par_time || 0 : 0  // only meaningful for a keystone
    const diff = par - time  // > 0: under par
    const date = format_date(fight.start_time)

    return (
        <div className={styles.container}>
            <div className={styles.title}>
                {dungeon && <WebpImg className={styles.icon} src={dungeon.icon_path} alt="" />}
                <DungeonRunTitle fight={fight} dungeon={dungeon} />
            </div>

            <div>
                {toMMSS(time)}
                {par > 0 && (
                    <span className={diff >= 0 ? styles.under : styles.over}>
                        {" "}({format_time(Math.abs(diff))} {diff >= 0 ? "under" : "over"})
                    </span>
                )}
            </div>

            {date && <div className={styles.date}>{date}</div>}
        </div>
    )
}
