/* Constants used only inside the Timeline Module */


export const LINE_HEIGHT = 28

export const DEFAULT_ZOOM = 4

/** width of a slot in a cropped row's gutter: the icon of a cast from before the crop (see `FightRow.update_gutter`) */
export const GUTTER_SLOT = 22
/** space between the gutter's icons and the row */
export const GUTTER_PADDING = 4
/** extra space on the left of a gutter at a cut (between it and the segment before) */
export const GUTTER_CUT_PADDING = GUTTER_PADDING
/** look of the icons in the gutter */
export const GUTTER_ICON_OPACITY = 0.3
export const GUTTER_ICON_FILTER = "saturate(75%) blur(0.5px)"

// Events
export const EVENT_ZOOM_CHANGE = "zoom_change"
export const EVENT_SPELL_DISPLAY = "spell_display"
export const EVENT_DISPLAY_SETTINGS = "display_settings"

export const EVENT_CHECK_IMAGES_LOADED = "check_images_loaded"
export const EVENT_IMAGES_LOADED = "images_loaded"

// This event is also used inside the spells-reducer and must therefore match the name there!
export const EVENT_SPELL_SELECTED = "spells/spell_selected"

// triggered when fight/player filters have changed
export const EVENT_APPLY_FILTERS = "apply_filters"

// event to show/hide the tooltip.
// WARNING: must match the name of the stores ui/set_tooltip action
// payload should include
// - content (string)
// - position (vector)
export const EVENT_SHOW_TOOLTIP = "ui/set_tooltip"

// Event when hovering over a phase marker
export const EVENT_PHASE_HOVER = "phase/hover"

// Event when hovering over a phase in the ruler: its start and end markers show, even if phase markers are hidden. payload: `{ names: string[] }`
export const EVENT_PHASE_PEEK = "phase/peek"

export const EVENT_ANCHOR_CHANGED = "stage/anchor_changed"

// the time map of a fight row changed (see `TimeMap`): sent to the row's children, followed by a zoom change to reposition them
export const EVENT_TIME_MAP_CHANGED = "time_map_changed"
