/**
 * A Dungeon in the Game.
 *
 * A whole run of it loads as one Fight in User Reports (`Fight.dungeon` = `name_slug`). Dungeons are never ranked.
 */
export default interface Dungeon {

    /** Warcraft Logs encounter id of a whole run */
    id: number

    name: string
    name_slug: string

    /** icon file name (in the spell icon folder) */
    icon: string

    /** full url of the icon */
    icon_path: string
}
