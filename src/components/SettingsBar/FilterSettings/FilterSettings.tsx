import type { ReactNode } from 'react'
import FilterDateRangeGroup from './FilterDateRange'
import FilterKilltimeGroup from './FilterKilltime'
import RegionFilterGroup from './RegionFilter'
import styles from './FilterSettings.module.scss'


/** all filter icons, under one label. `children` are added in front (eg. the Talent filter) */
export default function FilterSettings({ children }: { children?: ReactNode }) {
    return (
        <div>
            <small>Filters</small>
            <div className={styles.icons}>
                {children}
                <RegionFilterGroup />
                <FilterKilltimeGroup />
                <FilterDateRangeGroup />
            </div>
        </div>
    )
}
