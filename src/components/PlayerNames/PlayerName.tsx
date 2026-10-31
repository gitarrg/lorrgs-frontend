import { FaCopy } from "react-icons/fa";
import { get_boss } from "../../store/bosses";
import { get_role } from "../../store/roles";
import { get_spec } from "../../store/specs";
import { kFormatter } from "../../utils";
import { MODES } from "../../store/ui";
import { MouseEvent, PointerEvent, useEffect, useRef, useState } from 'react'
import { get_has_talents } from "../../store/game_versions";
import { useAppDispatch, useAppSelector } from "../../store/store_hooks";
import { WCL_URL } from "../../constants";
import * as ui_store from "../../store/ui"
import FILTERS from "../../filter_logic";
import styles from "./PlayerName.module.scss";
import type Actor from "../../types/actor";
import type Fight from "../../types/fight";
import WebpImg from "../WebpImg";
import TalentCard from "../Talents/TalentCard";

const MAX_CHAR_NAME = 6;

function spec_ranking_color(i = 0) {
    if (i <= 0) {
        return "";
    } else if (i == 1) {
        return "wow-artifact";
    } else if (i <= 25) {
        return "wow-astounding";
    } else if (i <= 100) {
        return "wow-legendary";
    } else {
        return "wow-epic";
    }
}

function CopyAsNoteButton({ fight, player }: { fight: Fight, player: Actor }) {

    const dispatch = useAppDispatch()

    function onClick(event: MouseEvent) {
        event && event.preventDefault();

        dispatch(ui_store.set_copynote_fight(fight));
        dispatch(ui_store.set_copynote_player(player));
        dispatch(ui_store.set_show_copynote(true));
    }

    return <>
        <FaCopy
            onClick={onClick}
            data-tooltip="Copy Note"
            data-tooltip-dir="down"
        />
    </>
}


export function BossName({ fight, boss }: { fight: Fight; boss: Actor }) {
    ///////////////////
    // hooks
    const visible = useAppSelector((state) => FILTERS.is_player_visible(boss, state.ui.filters));
    const boss_type = useAppSelector((state) => get_boss(state, boss.boss_slug));

    ///////////////////
    // apply filters
    if (!boss) {
        return null;
    }
    if (!boss_type) {
        return null;
    }
    if (!visible) {
        return null;
    }

    ///////////////////
    // Render
    return (
        <div className={styles.boss_name}>
            <a target="_blank" href={fight.report_url}>
                <WebpImg className={styles.icon} src={boss_type.icon_path} />
                <span className={styles.name}>{boss_type.name}</span>
            </a>
        </div>
    );
}

/**
 * Open the Talent Card on hover, or with a tap on touch devices (a second tap follows the link).
 * Leaving the name, scrolling or clicking elsewhere closes it.
 */
function useTalentCard(enabled: boolean) {
    const ref = useRef<HTMLDivElement>(null)
    const pointer_type = useRef("mouse")
    const [anchor, set_anchor] = useState<DOMRect | null>(null)

    const open = () => ref.current && set_anchor(ref.current.getBoundingClientRect())
    const close = () => set_anchor(null)

    useEffect(() => {
        if (!anchor) { return }
        const on_pointer_down = (event: globalThis.PointerEvent) => {
            if (!ref.current?.contains(event.target as Node)) { close() }
        }
        window.addEventListener("scroll", close, { capture: true, passive: true })
        document.addEventListener("pointerdown", on_pointer_down)
        return () => {
            window.removeEventListener("scroll", close, { capture: true })
            document.removeEventListener("pointerdown", on_pointer_down)
        }
    }, [anchor])

    if (!enabled) {
        return { anchor: null, props: {}, on_click: undefined }
    }

    return {
        anchor,
        props: {
            ref,
            onPointerDown: (event: PointerEvent) => { pointer_type.current = event.pointerType },
            onPointerEnter: (event: PointerEvent) => { event.pointerType == "mouse" && open() },
            onPointerLeave: (event: PointerEvent) => { event.pointerType == "mouse" && close() },
        },
        on_click: (event: MouseEvent) => {
            if (event.defaultPrevented || pointer_type.current == "mouse" || anchor) { return }
            event.preventDefault()
            open()
        },
    }
}


export function PlayerName({ fight, player }: { fight: Fight; player: Actor }) {
    ///////////////////
    // hooks
    const mode = useAppSelector((state) => state.ui.mode);
    // a boolean, so the row only re-renders when it gets shown or hidden.
    // (also depends on spell_display: with "hide empty rows", rows without visible casts are hidden)
    const visible = useAppSelector((state) => FILTERS.is_player_visible(player, state.ui.filters));
    const spec = useAppSelector((state) => get_spec(state, player.spec_slug));
    const role = useAppSelector((state) => get_role(state, spec?.role ?? ""));
    const mode_spec = mode == MODES.SPEC_RANKING;
    const mode_comp = mode == MODES.COMP_RANKING;
    const has_talents = useAppSelector(get_has_talents);
    const show_talents = mode_spec && has_talents;
    const talent_card = useTalentCard(show_talents);

    ///////////////////
    // apply filters
    if (!player) {
        return null;
    }
    if (!spec) {
        return null;
    }
    if (!visible) {
        return null;
    }

    ///////////////////
    // vars
    let report_url = `${WCL_URL}/reports/${fight.report_id}#fight=${fight.fight_id}`;
    if (player.source_id && player.source_id > 0) {
        report_url = `${report_url}&source=${player.source_id}`;
    }

    const className = spec_ranking_color(player.rank) || `wow-${player.class_slug}`;

    ///////////////////
    // render
    return (
        <div className={`${styles.player_name} ${className}`} {...talent_card.props}>
            {talent_card.anchor && <TalentCard fight={fight} player={player} anchor={talent_card.anchor} />}
            <a target="_blank" href={report_url} onClick={talent_card.on_click}>
                {mode_comp && role?.icon_path && <img className={styles.icon} src={role.icon_path}></img>}
                <WebpImg className={styles.icon} src={spec.icon_path} />

                <span className={styles.name}>{player.name.substring(0, MAX_CHAR_NAME)}</span>
                <span className={styles.copy}><CopyAsNoteButton fight={fight} player={player} /></span>
                {mode_spec && !!player.rank && <span className={styles.rank}>#{player.rank}</span>}
                {!!player.total && <span className={styles.total}>{kFormatter(player.total)}</span>}
            </a>
        </div>
    );
}
