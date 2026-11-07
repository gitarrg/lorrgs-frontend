import { useLayoutEffect, useRef, useState } from "react";
import NavBarSpecButton from './NavBarSpecButton';
import styles from "./Navbar.module.scss"

/** min. distance to keep between the dropdown and the edge of the page */
const PAGE_MARGIN = 8;

export default function NavbarSpecsDropdown({ specs } : { specs: string[] }) {

    // Inputs
    const specs_sorted = [...specs].sort();

    // the dropdown opens to the right. If that would overflow the page
    // (eg.: few bosses, so the role buttons sit near the right edge), shift it back left.
    const ref = useRef<HTMLDivElement>(null);
    const [shift, set_shift] = useState(0);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) { return; }
        const rect = el.getBoundingClientRect();
        const page_width = document.documentElement.clientWidth;
        const overflow = rect.right - (page_width - PAGE_MARGIN);
        // never push it past the left edge either
        const max_shift = Math.max(0, rect.left - PAGE_MARGIN);
        set_shift(Math.min(Math.max(0, overflow), max_shift));
    }, []);

    // Render
    return (
        <div
            ref={ref}
            className={`${styles.dropdown_container__dropdown} bg-dark border rounded p-2`}
            style={shift ? { transform: `translateX(-${shift}px)` } : undefined}
        >
            <div className={styles.dropdown_content}>
                {specs_sorted.map(spec_slug => <NavBarSpecButton key={spec_slug} spec_slug={spec_slug} />)}
            </div>
        </div>
    );
}
