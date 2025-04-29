
import type Fight from "./fight";
import type Actor from "./actor";


export default interface Report {

    report_id: string;

    owner?: string;
    guild?: string;
    title?: string;
    region?: string;

    zone_id: number;
    start_time: string;
    fights: Fight[];
    players: Actor[];
}
