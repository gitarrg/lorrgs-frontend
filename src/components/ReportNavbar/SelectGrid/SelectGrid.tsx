import type { ReactNode } from "react"
import { createContext, useState } from "react"
import useUser from "../../../routes/auth/useUser"


export const SelectGridContext = createContext<boolean>(false)


type SelectGridProps = {
    title?: string
    children: ReactNode
}


export default function SelectGrid({title="", children} : SelectGridProps) {


    const [value, setValue] = useState(false)

    const user = useUser()
    const user_can_multiselect = user.permissions.includes("user_reports")

    function onClick() {
        user_can_multiselect && setValue(value => !value)
    }

    return (
        <div className="flex-grow-1">

            {title &&
                <h4 className="mb-1" onClick={onClick}>
                    {/* Subbed users get a clickabe version */}
                    {user_can_multiselect && <a href="#">{title}</a>}
                    {!user_can_multiselect && title}
                </h4>
            }

            <div className="d-flex flex-column gap-3">
                <SelectGridContext.Provider value={value}>
                    {children}
                </SelectGridContext.Provider>
            </div>
        </div>
    )
}
