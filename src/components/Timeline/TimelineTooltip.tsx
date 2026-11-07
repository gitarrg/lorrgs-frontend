/*
    Tooltip of the timeline.

    Reads content and position from the redux state (see `tooltip.ts`),
    so it can be fed from anywhere inside the timeline.

    Appears after a short delay. Once shown, new content (eg. moving along the ruler)
    shows right away, until the content is cleared.
*/
import { useEffect, useState } from 'react'
import parse from 'html-react-parser';

import { get_tooltip } from '../../store/ui'
import { useAppSelector } from '../../store/store_hooks';
import type { TooltipInfo } from './tooltip';

import styles from "./TimelineTooltip.module.scss"


const TOOLTIP_DELAY = 500


function TooltipBody({ info }: { info: TooltipInfo }) {
    return <>
        {info.time && (
            <div className={styles.time}>
                <span>{info.time}</span>
                {info.time_detail && <span className={styles.muted}>{info.time_detail}</span>}
            </div>
        )}

        {info.title && (
            <div className={styles.title} style={{ color: info.title_color }}>
                {info.icon && <img className={styles.icon} src={info.icon} alt="" />}
                <span>{info.title}</span>
            </div>
        )}

        {!!info.lines?.length && (
            <div className={styles.lines}>
                {info.lines.map((line, i) => <div key={i} className={styles.line}>
                    <span className={styles.value}>{line.value}</span>
                    <span className={styles.muted}>{line.label}</span>
                </div>)}
            </div>
        )}
    </>
}


export default function TimelineTooltip() {

    const tooltip = useAppSelector(state => get_tooltip(state))
    const has_content = !!tooltip.content
    const [shown, set_shown] = useState(false)

    useEffect(() => {
        if (!has_content) { set_shown(false); return }
        const timer = setTimeout(() => set_shown(true), TOOLTIP_DELAY)
        return () => clearTimeout(timer)
    }, [has_content]);

    if (!has_content || !shown) { return null }

    return (
        <div className={styles.tooltip} style={{ left: tooltip.position.x, top: tooltip.position.y }}>
            <div className={styles.tooltip_content}>
                {typeof tooltip.content == "string"
                    ? parse(tooltip.content)
                    : <TooltipBody info={tooltip.content} />}
            </div>
            <div className={styles.tooltip_arrow}></div>
        </div>
    )
}
