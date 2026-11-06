/*
    The look of the talent trees, per Game Version (`GameVersion.talent_tree_style`).

    The backend only names the style: sizes and shapes are decided here, from the attributes of the talents.
*/
import { get_talent_tree_style } from "../../store/game_versions"
import { useAppSelector } from "../../store/store_hooks"
import type { TalentTreeStyleName } from "../../types/game_version"
import type { TalentNode } from "../../types/talent_tree"


/** Spacing of the talent grid, in tree coordinates (`TalentNode.x` / `y`). */
export const GRID = 600

/** Corner radius of a square talent, as a share of its size. */
export const CORNER = 0.2


/** "choice": one part per option (a pill in the filter, a diamond in the small graph) */
export type NodeShape = "circle" | "square" | "choice"


/**
 * Sizes of one drawing of the trees, in pixels. The drawing is as large as the tree needs (and its popup as large as the drawing):
 * it is only scaled down when the screen is too narrow.
 */
export interface TreeView {
    /** diameter of a talent */
    node_size: number
    /** gap between the edges of neighbouring talents (one grid step apart) */
    node_spacing: number
    /** space between the trees (class | hero | spec, or the tabs, and the stacked hero trees). Half of it around the drawing */
    tree_margin: number
    /** font size of the tree names */
    label_size: number
    /** gap between a tree's name and its first row of talents */
    label_spacing: number
}


export interface TreeStyle {
    /** the small graph on a player's talent card */
    card: TreeView
    /** the clickable tree of the talent filter */
    filter: TreeView
    /** lines between the sections of a tree (the tabs of a three-tab tree) */
    dividers: boolean
    node_shape: (node: TalentNode) => NodeShape
}


const SQUARE_ENTRY_TYPES = ["spend_square", "spend_capstone_square"]


/** The shape of a talent ingame: choice nodes split, "spend_square" talents (mostly active ones) square, the rest round. */
export function ingame_node_shape(node: TalentNode): NodeShape {
    if (node.entries.length > 1) { return "choice" }
    if (node.entries.some(entry => SQUARE_ENTRY_TYPES.includes(entry.entry_type ?? ""))) { return "square" }
    return "circle"
}


export const TREE_STYLES: Record<TalentTreeStyleName, TreeStyle> = {

    classic: {
        card: { node_size: 10, node_spacing: 4, tree_margin: 12, label_size: 9, label_spacing: 6 },
        filter: { node_size: 32, node_spacing: 10, tree_margin: 30, label_size: 18, label_spacing: 20 },
        dividers: true,
        node_shape: () => "square",
    },

    // placeholder: Mists has no talent trees yet
    mists: {
        card: { node_size: 10, node_spacing: 4, tree_margin: 12, label_size: 9, label_spacing: 6 },
        filter: { node_size: 32, node_spacing: 10, tree_margin: 24, label_size: 14, label_spacing: 8 },
        dividers: false,
        node_shape: () => "square"
    },

    dragonflight: {
        card: { node_size: 6, node_spacing: 6, tree_margin: 10, label_size: 9, label_spacing: 6 },
        filter: { node_size: 24, node_spacing: 14, tree_margin: 24, label_size: 14, label_spacing: 8 },
        dividers: false,
        node_shape: ingame_node_shape
    },
}


/** The look of the current Game Version's talent trees. */
export function useTreeStyle(): TreeStyle {
    const name = useAppSelector(get_talent_tree_style)
    return TREE_STYLES[name] ?? TREE_STYLES.dragonflight
}
