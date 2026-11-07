import { FaGlobe } from 'react-icons/fa'
import { set_filters, set_region_filter } from '../../../store/ui'
import { useAppDispatch, useAppSelector } from '../../../store/store_hooks'
import FilterMenu, { FilterMenuHeader } from '../shared/FilterMenu'
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


/** Icon with a menu to toggle the regions */
export default function RegionFilterGroup() {

    const dispatch = useAppDispatch()
    const region_filter = useAppSelector(state => state.ui.filters.region) || {}

    const is_selected = (region: Region) => region_filter[region.slug] !== false
    const hidden = REGIONS.filter(region => !is_selected(region)).length

    function toggle(region: Region) {
        dispatch(set_region_filter({ region: region.slug, value: !is_selected(region) }))
    }

    const clear = () => dispatch(set_filters({ region: {} }))

    return (
        <FilterMenu
            icon={<FaGlobe />}
            label="Region"
            active={hidden > 0}
            on_clear={clear}
        >
            <FilterMenuHeader title="Region" on_clear={hidden ? clear : undefined} />
            <div className={styles.buttons}>
                {REGIONS.map(region => (
                    <div
                        key={region.id}
                        className={`${styles.button} button icon-s rounded border-white ${is_selected(region) ? "" : "disabled"}`}
                        onClick={() => toggle(region)}
                        data-tooltip={region.name}
                    >
                        {region.slug}
                    </div>
                ))}
            </div>
        </FilterMenu>
    )
}
