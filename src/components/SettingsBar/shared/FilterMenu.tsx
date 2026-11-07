/*
    A filter in the settings bar, shown as a single icon. Its controls open in a menu.

    Hovering opens the menu, clicking the icon (or anything in the menu) pins it open.
    Esc or clicking outside closes it. Right-clicking the icon clears the filter.

    The menu content is only mounted while open: put lazy loading in its effects.
*/
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import WebpImg from "../../WebpImg";
import styles from "./FilterMenu.module.scss";


const VIEWPORT_MARGIN = 16  // px
const CLOSE_DELAY = 250  // ms, to move the mouse from the icon into the menu


type FilterMenuProps = {
    /** image url, or an element (eg. a react-icon) */
    icon: string | ReactNode
    /** tooltip and aria-label of the icon */
    label: string
    /** highlights the icon while the filter is set */
    active?: boolean
    /** shown as a badge on the icon */
    count?: number
    /** right click on the icon */
    on_clear?: () => void
    /** rendered next to the icon (eg. extra badges) */
    extra?: ReactNode
    menu_className?: string
    children: ReactNode
}


export default function FilterMenu({ icon, label, active, count, on_clear, extra, menu_className, children }: FilterMenuProps) {

    ////////////////////////////////////////////////////////////////////////////
    // Hooks
    const ref = useRef<HTMLDivElement>(null)
    const menu_ref = useRef<HTMLDivElement>(null)
    const [open, set_open] = useState(false)
    const [pinned, set_pinned] = useState(false)
    const close_timer = useRef<number>(undefined)

    const cancel_close = () => window.clearTimeout(close_timer.current)
    useEffect(() => cancel_close, [])

    const close = () => {
        set_open(false)
        set_pinned(false)
    }

    // the menu is right-aligned to the icon, which isn't at the right edge of the page: shift it back into the viewport
    // (again whenever the content changes size, eg. once it has loaded)
    useLayoutEffect(() => {
        const menu = menu_ref.current
        if (!open || !menu) { return }
        const fit = () => {
            menu.style.transform = ""
            const rect = menu.getBoundingClientRect()
            const shift = rect.left < VIEWPORT_MARGIN
                ? VIEWPORT_MARGIN - rect.left
                : Math.min(0, window.innerWidth - VIEWPORT_MARGIN - rect.right)
            if (shift) { menu.style.transform = `translateX(${shift}px)` }
        }
        fit()
        const observer = new ResizeObserver(fit)
        observer.observe(menu)
        window.addEventListener("resize", fit)
        return () => {
            observer.disconnect()
            window.removeEventListener("resize", fit)
        }
    }, [open])

    useEffect(() => {
        if (!open) { return }
        const on_key_down = (event: KeyboardEvent) => { event.key == "Escape" && close() }
        const on_pointer_down = (event: PointerEvent) => {
            if (!ref.current?.contains(event.target as Node)) { close() }
        }
        document.addEventListener("keydown", on_key_down)
        document.addEventListener("pointerdown", on_pointer_down)
        return () => {
            document.removeEventListener("keydown", on_key_down)
            document.removeEventListener("pointerdown", on_pointer_down)
        }
    }, [open])

    ////////////////////////////////////////////////////////////////////////////
    // Handlers
    function on_icon_click() {
        cancel_close()
        if (open && pinned) { close(); return }
        set_open(true)
        set_pinned(true)
    }

    function on_pointer_enter(event: React.PointerEvent) {
        if (event.pointerType != "mouse") { return }
        cancel_close()
        set_open(true)
    }

    function on_pointer_leave(event: React.PointerEvent) {
        if (event.pointerType != "mouse" || pinned) { return }
        cancel_close()
        close_timer.current = window.setTimeout(close, CLOSE_DELAY)
    }

    ////////////////////////////////////////////////////////////////////////////
    // Render
    const icon_props = {
        className: `button icon-s rounded border ${styles.icon} ${active ? styles.active : ""}`,
        onClick: on_icon_click,
        onContextMenu: (event: React.MouseEvent) => {
            if (!on_clear) { return }
            event.preventDefault()
            on_clear()
        },
        title: open ? undefined : label,
        "aria-label": label,
    }

    return (
        <div>
            <div
                ref={ref}
                className={styles.wrap}
                onPointerEnter={on_pointer_enter}
                onPointerLeave={on_pointer_leave}
            >
                {typeof icon == "string"
                    ? <WebpImg {...icon_props} src={icon} />
                    : <span {...icon_props} className={`${icon_props.className} ${styles.icon_glyph}`}>{icon}</span>
                }
                {!!count && <span className={styles.badge}>{count}</span>}
                {extra}
                {open && <div
                    ref={menu_ref}
                    className={`${styles.menu} ${menu_className || ""} bg-dark rounded border`}
                    // interacting with the controls keeps it open (eg. while a native date picker is open)
                    onPointerDown={() => set_pinned(true)}
                >
                    {children}
                </div>}
            </div>
        </div>
    )
}


/** title of a filter menu, with a "Clear" link while the filter is set */
export function FilterMenuHeader({ title, on_clear }: { title: string, on_clear?: () => void }) {
    return (
        <div className={styles.header}>
            <span>{title}</span>
            {on_clear && <button className={styles.link} onClick={on_clear}>Clear</button>}
        </div>
    )
}
