
import type Fight from "./fight";
import type Actor from "./actor";


export default interface Report {

    report_id: string;

    owner?: string;
    guild?: string;
    title?: string;
    region?: string;

    /** Warcraft Logs game version id (not a Game Version name): map it with `wcl_game_version` of the Game Versions */
    game_version?: number;

    zone_id: number;
    start_time: string;
    fights: Fight[];
    players: Actor[];
}
