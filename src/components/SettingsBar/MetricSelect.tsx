


import { ReactNode } from "react";
import DropdownMenu from "../DropdownMenu";

import styles from "./DisplaySettings.scss"

import { FaAddressBook, FaAlignCenter, FaBeer, FaHourglass, FaImage, FaStream } from 'react-icons/fa';
import { RiSwordFill } from 'react-icons/ri';
import { BiPlusMedical } from 'react-icons/bi';
import { IoSkullSharp } from 'react-icons/io5';
import { applyStatics, MenuItem } from "@szhsin/react-menu";
import QueryNavLink from "../shared/QueryNavLink";
import { useAppSelector } from "../../store/store_hooks";
import { get_metric } from "../../store/ui";


const METRIC_ICONS : {[key: string]: ReactNode} = {}
METRIC_ICONS["dps"] = <RiSwordFill />
METRIC_ICONS["hps"] = <BiPlusMedical />
METRIC_ICONS["bossdps"] = <IoSkullSharp />


function MetricIcon({metric, className="", ...props} : {metric: string}) {

    const icon = METRIC_ICONS[metric]
    if (!icon) { return null}

    return (
        <div className={`${styles.button} button icon-s rounded border-white`}>
            {icon}
        </div>
    )
}


function MetricMenuOption({metric, className, label="", ...props} : {metric: string, label?: string}) {

    return (
        <QueryNavLink params={{"metric": metric}}>
            <MenuItem {...props}>
                <MetricIcon metric={metric} className={className} />
                <span className={`ml-1`}>{label}</span>
            </MenuItem>
        </QueryNavLink>
    )
}
applyStatics(MenuItem)(MetricMenuOption)



export default function MetricSelect() {

    const metric = useAppSelector(get_metric)
    const button = <MetricIcon metric={metric} />


    return (
        <DropdownMenu button={button}>
            <MetricMenuOption className="wow-mdps" metric="dps" label="Damage" />
            <MetricMenuOption className="wow-heal" metric="hps" label="Healing" />
            <MetricMenuOption className="wow-boss" metric="bossdps" label="Boss DPS"/>
        </DropdownMenu>
    )

}