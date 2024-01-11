import { FaCopy } from "react-icons/fa";
import { get_boss } from "../../store/bosses";
import { get_role } from "../../store/roles";
import { get_spec } from "../../store/specs";
import { kFormatter } from "../../utils";
import { MODES } from "../../store/ui";
import { MouseEvent } from 'react'
import { useAppDispatch, useAppSelector } from "../../store/store_hooks";
import { WCL_URL } from "../../constants";
import * as ui_store from "../../store/ui"
import FILTERS from "../../filter_logic";
import styles from "./PlayerName.scss";
import type Actor from "../../types/actor";
import type Fight from "../../types/fight";
import WebpImg from "../WebpImg";

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

function CopyAsNoteButton({player} : {player: Actor}) {

    const dispatch = useAppDispatch()

    function onClick(event: MouseEvent) {
        event && event.preventDefault();

        dispatch(ui_store.set_copynote_player(player));
        dispatch(ui_store.set_show_copynote(true));
    }

    return <>
        <FaCopy
            onClick={onClick}
            data-tooltip="Copy MRT Note"
            data-tooltip-dir="down"
        />
    </>
}


export function BossName({ fight, boss }: { fight: Fight; boss: Actor }) {
    ///////////////////
    // hooks
    const filters = useAppSelector((state) => state.ui.filters);
    const boss_type = useAppSelector((state) => get_boss(state, boss.boss_slug));

    ///////////////////
    // apply filters
    if (!boss) {
        return null;
    }
    if (!boss_type) {
        return null;
    }
    if (!FILTERS.is_player_visible(boss, filters)) {
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

export function PlayerName({ fight, player }: { fight: Fight; player: Actor }) {
    ///////////////////
    // hooks
    const mode = useAppSelector((state) => state.ui.mode);
    const filters = useAppSelector((state) => state.ui.filters);
    const spec = useAppSelector((state) => get_spec(state, player.spec_slug));
    const role = useAppSelector((state) => get_role(state, spec.role));
    const mode_spec = mode == MODES.SPEC_RANKING;
    const mode_comp = mode == MODES.COMP_RANKING;

    // including "spell_display" because rows might be hidden when all casts are hidden
    const spell_display = useAppSelector((state) => state.spells.spell_display);

    ///////////////////
    // apply filters
    if (!player) {
        return null;
    }
    if (!spec) {
        return null;
    }
    if (!FILTERS.is_player_visible(player, filters)) {
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
        <div className={`${styles.player_name} ${className}`}>
            <a target="_blank" href={report_url}>
                {mode_comp && <img className={styles.icon} src={role.icon_path}></img>}
                <WebpImg className={styles.icon} src={spec.icon_path} />

                <span className={styles.name}>{player.name.substring(0, MAX_CHAR_NAME)}</span>
                <span className={styles.copy}><CopyAsNoteButton player={player}/></span>
                {mode_spec && player.rank && <span className={styles.rank}>#{player.rank}</span>}
                {player.total && <span className={styles.total}>{kFormatter(player.total)}</span>}
            </a>
        </div>
    );
}
