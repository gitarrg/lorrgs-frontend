/*
    In-game talent loadout import strings, as written by Blizzard_ClassTalentImportExport.lua.

    Bits are packed least-significant first, 6 per base64 character.
    Header: serialization version (8), spec id (16), tree hash (128; zero-filled is accepted).
    Body, per node of the full class tree in id order:
        selected (1)
        purchased (1)                      -- only if selected
        partially ranked (1) + ranks (6)   -- only if purchased
        choice node (1) + entry index (2)  -- only if purchased
*/
import type TalentTree from "../../types/talent_tree"
import type { Talents } from "../../types/talent_tree"


const SERIALIZATION_VERSION = 2
const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
const TREE_HASH_BITS = 128


class BitWriter {
    private bits: number[] = []

    write(value: number, width: number) {
        for (let i = 0; i < width; i++) {
            this.bits.push((value >> i) & 1)
        }
    }

    to_base64(): string {
        let out = ""
        for (let i = 0; i < this.bits.length; i += 6) {
            let char = 0
            for (let j = 0; j < 6; j++) {
                char |= (this.bits[i + j] ?? 0) << j
            }
            out += BASE64[char]
        }
        return out
    }
}


export function get_talent_string(tree: TalentTree, talents: Talents): string {
    const writer = new BitWriter()
    writer.write(SERIALIZATION_VERSION, 8)
    writer.write(tree.spec_id, 16)
    for (let i = 0; i < TREE_HASH_BITS / 8; i++) { writer.write(0, 8) }

    const nodes_by_id = new Map(tree.nodes.map(node => [node.id, node]))

    for (const node_id of tree.node_order) {
        const node = nodes_by_id.get(node_id)  // nodes of other specs are not in there
        const entry_index = node ? node.entries.findIndex(entry => (talents[entry.id] ?? 0) > 0) : -1
        if (!node || entry_index < 0) {
            writer.write(0, 1) // not selected
            continue
        }
        const rank = talents[node.entries[entry_index].id]
        const is_choice = node.type === "choice" || node.type === "hero_selection"

        writer.write(1, 1) // selected
        writer.write(1, 1) // purchased (free nodes are not told apart yet, see issue #128)

        const is_partial = rank < node.max_ranks
        writer.write(is_partial ? 1 : 0, 1)
        if (is_partial) { writer.write(rank, 6) }

        writer.write(is_choice ? 1 : 0, 1)
        if (is_choice) { writer.write(entry_index, 2) }
    }
    return writer.to_base64()
}


export function get_wowhead_talent_url(talent_string: string): string {
    return `https://www.wowhead.com/talent-calc/blizzard/${talent_string}`
}
