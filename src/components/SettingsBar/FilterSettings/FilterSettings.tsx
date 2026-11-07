import type { ReactNode } from 'react'
import ButtonGroup from '../shared/ButtonGroup'
import FilterDateRangeGroup from './FilterDateRange'
import FilterKilltimeGroup from './FilterKilltime'
import RegionFilterGroup from './RegionFilter'


/** all filter icons in one group. `children` are added in front (eg. the Talent filter) */
export default function FilterSettings({ children }: { children?: ReactNode }) {
    return (
        <ButtonGroup name="Filters">
            {children}
            <RegionFilterGroup />
            <FilterKilltimeGroup />
            <FilterDateRangeGroup />
        </ButtonGroup>
    )
}
