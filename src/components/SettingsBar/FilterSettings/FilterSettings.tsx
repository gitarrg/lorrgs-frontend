import FilterDateRangeGroup from './FilterDateRange'
import FilterKilltimeGroup from './FilterKilltime'
import RegionFilterGroup from './RegionFilter'


export default function FilterSettings() {
    return (
        <>
            <RegionFilterGroup />
            <FilterKilltimeGroup />
            <FilterDateRangeGroup />
        </>
    )
}
