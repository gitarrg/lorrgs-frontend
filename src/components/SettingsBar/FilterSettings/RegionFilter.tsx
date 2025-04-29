import { set_region_filter } from '../../../store/ui'
import { useAppDispatch } from '../../../store/store_hooks'
import { useContext, useEffect, useState } from 'react'
import ButtonGroup, { ButtonGroupContext } from '../shared/ButtonGroup'
import styles from "./RegionFilter.module.scss"


interface Region {
    id: number
    name: string
    slug: string
}

/* Based on
```
query Operations {
    worldData {
        regions {
            id
            slug
            name
        }
    }
}
```
*/
const REGIONS: Region[] = [
    { id: 1, slug: "US", name: "United States" },
    { id: 2, slug: "EU", name: "Europe" },
    { id: 3, slug: "KR", name: "Korea" },
    { id: 4, slug: "TW", name: "Taiwan" },
    { id: 5, slug: "CN", name: "China" },
];


function Button({ region }: { region: Region }) {

    const [selected, setSelected] = useState(true)
    const dispatch = useAppDispatch()
    const group_context = useContext(ButtonGroupContext)

    // Handle Simple Click
    function onClick() {
        setSelected(!selected)
    }

    // Handle Group Header Click
    useEffect(() => {
        if (group_context.source !== "group") { return }
        setSelected(group_context.active)
    }, [group_context.active])


    useEffect(() => {
        dispatch(set_region_filter({
            region: region.slug,
            value: selected
        }))
    }, [selected])


    ////////////////////////
    // Render
    //
    return (
        <div
            className={`${styles.button} button icon-s rounded border-white ${selected ? "" : "disabled"}`}
            onClick={onClick}
            data-tooltip={region.name}
        >
            {region.slug}
        </div>
    )
}


/**
 * 
 *
 * @returns {ReactComponent}
 */
export default function RegionFilterGroup() {
    return (
        <ButtonGroup name="Region">
            {REGIONS.map(region => (
                <Button key={region.id} region={region} />
            ))}
        </ButtonGroup>
    )
}
