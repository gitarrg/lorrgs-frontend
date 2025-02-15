import { ReactNode } from "react";
import DropdownMenu from "../DropdownMenu";

import styles from "./DisplaySettings.module.scss"

import { RiSwordFill } from 'react-icons/ri';
import { BiPlusMedical } from 'react-icons/bi';
import { IoSkullSharp } from 'react-icons/io5';
import { MenuItem } from "@szhsin/react-menu";
import QueryNavLink from "../shared/QueryNavLink";
import { useAppSelector } from "../../store/store_hooks";
import { get_metric } from "../../store/ui";
import { get_spec } from "../../store/specs";
import { get_role } from "../../store/roles";


interface Metric {
    icon: ReactNode,
    label: string,
    class: string,
}

const METRICS: {[key: string]: Metric} = {}

METRICS["dps"] = {
    label: "Damage",
    icon: <RiSwordFill />,
    class: "wow-mdps",
}
METRICS["hps"] = {
    label: "Healing",
    icon: <BiPlusMedical />,
    class: "wow-heal",
}

METRICS["bossdps"] = {
    label: "Boss DPS",
    icon: <IoSkullSharp />,
    class: "wow-boss",
}


function MetricIcon({metric_name} : {metric_name: string}) {

    const metric = METRICS[metric_name]
    if (!metric) { return null}

    return (
        <div className={`${styles.button} button icon-s rounded border-white`}>
            {metric.icon}
        </div>
    )
}


function MetricMenuOption({metric_name} : {metric_name: string}) {

    const metric = METRICS[metric_name]
    if (!metric) { return null}

    return (
        <QueryNavLink params={{"metric": metric_name}}>
            <MenuItem>
                <MetricIcon metric_name={metric_name} />
                <span className={`ml-1`}>{metric.label}</span>
            </MenuItem>
        </QueryNavLink>
    )
}


export default function MetricSelect() {

    const metric = useAppSelector(get_metric)
    const button = <MetricIcon metric_name={metric} />
    const spec = useAppSelector(get_spec)
    const role = useAppSelector(state => get_role(state, spec?.role))

    return (
        <DropdownMenu button={button}>
            {role?.metrics.map(metric => 
                <MetricMenuOption key={metric} metric_name={metric} />
            )}
        </DropdownMenu>
    )

}