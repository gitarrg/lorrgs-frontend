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
import BossPhaseCard, { usePhaseNames } from "./BossPhaseCard";

const CARD_CLOSE_DELAY = 250  // ms, to move the mouse from the name into the card

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

function CopyAsNoteButton() {
    return <>
        <FaCopy
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
    const phases = usePhaseNames(fight);
    const container = useRef<HTMLDivElement>(null);
    const [card_anchor, set_card_anchor] = useState<DOMRect | null>(null);
    const close_timer = useRef<number>(undefined);

    const cancel_close = () => window.clearTimeout(close_timer.current);
    const open_card = () => {
        cancel_close();
        container.current && set_card_anchor(container.current.getBoundingClientRect());
    };
    const close_card = () => {
        cancel_close();
        close_timer.current = window.setTimeout(() => set_card_anchor(null), CARD_CLOSE_DELAY);
    };

    // the card is placed in the viewport: close it when the page scrolls
    useEffect(() => cancel_close, []);
    useEffect(() => {
        if (!card_anchor) { return }
        const close = () => set_card_anchor(null);
        window.addEventListener("scroll", close, { capture: true, passive: true });
        return () => window.removeEventListener("scroll", close, { capture: true });
    }, [card_anchor]);

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
        <div
            ref={container}
            className={styles.boss_name}
            onPointerEnter={event => event.pointerType == "mouse" && phases.length > 0 && open_card()}
            onPointerLeave={event => event.pointerType == "mouse" && close_card()}
        >
            <a target="_blank" href={fight.report_url}>
                <WebpImg className={styles.icon} src={boss_type.icon_path} />
                <span className={styles.name}>{boss_type.name}</span>
            </a>

            {card_anchor && phases.length > 0 && (
                <BossPhaseCard
                    fight={fight}
                    boss_name={boss_type.full_name || boss_type.name}
                    icon_path={boss_type.icon_path}
                    phases={phases}
                    anchor={card_anchor}
                    on_pointer_enter={cancel_close}
                    on_pointer_leave={close_card}
                />
            )}
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
    const dispatch = useAppDispatch()
    const mode = useAppSelector((state) => state.ui.mode);
    // a boolean, so the row only re-renders when it gets shown or hidden.
    // (also depends on spell_display: with "hide empty rows", rows without visible casts are hidden)
    const visible = useAppSelector((state) => FILTERS.is_player_visible(player, state.ui.filters, fight));
    const spec = useAppSelector((state) => get_spec(state, player.spec_slug));
    const role = useAppSelector((state) => get_role(state, spec?.role ?? ""));
    const mode_spec = mode == MODES.SPEC_RANKING;
    const mode_comp = mode == MODES.COMP_RANKING;
    const mode_user_report = mode == MODES.USER_REPORT;
    const has_talents = useAppSelector(get_has_talents);
    const show_talents = (mode_spec || mode_user_report) && has_talents;
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

    function open_copynote() {
        dispatch(ui_store.set_copynote_fight(fight));
        dispatch(ui_store.set_copynote_player(player));
        dispatch(ui_store.set_show_copynote(true));
    }

    function on_name_click(event: MouseEvent) {
        talent_card.on_click?.(event)
        event.stopPropagation()
    }

    ///////////////////
    // render
    return (
        <div className={`${styles.player_name} ${className}`} onClick={open_copynote} {...talent_card.props}>

            {talent_card.anchor &&
                <TalentCard
                    fight={fight}
                    player={player}
                    anchor={talent_card.anchor}
                />
            }

            {mode_comp && role?.icon_path && <img className={styles.icon} src={role.icon_path}></img>}
            <WebpImg className={styles.icon} src={spec.icon_path} />

            <a
                target="_blank"
                href={report_url}
                className={styles.name}
                onClick={on_name_click}
            >
                {player.name.substring(0, MAX_CHAR_NAME)}
            </a>

            <span className={styles.copy}><CopyAsNoteButton /></span>
            {mode_spec && !!player.rank && <span className={styles.rank}>#{player.rank}</span>}
            {!!player.total && <span className={styles.total}>{kFormatter(player.total)}</span>}
        </div>
    );
}
