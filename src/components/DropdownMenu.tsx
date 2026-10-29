import { ControlledMenu, useMenuState } from '@szhsin/react-menu';
import { ReactNode, RefObject, useRef } from 'react'


export default function DropdownMenu({button, children} : {button: ReactNode, children: ReactNode}) {

    const ref = useRef<HTMLDivElement>(null);
    const [menuState, toggleMenu] = useMenuState();

    const callbacks = {
        onMouseEnter: () => toggleMenu(true),
        onMouseLeave: () => toggleMenu(false),
        onClose: () => toggleMenu(false),
    }

    return (
        <div> {/* wrapper to avoid issues if the parent uses grid-gap */}

            {/* Button */}
            <div {...callbacks} ref={ref} className="active">
                {button}
            </div>

            {/* Menu Content */}
            <ControlledMenu {...callbacks} {...menuState} anchorRef={ref as RefObject<HTMLDivElement>}> {/* react-menu still expects the pre React 19 RefObject type */}
                {children}
            </ControlledMenu>
        </div>
    )
}
