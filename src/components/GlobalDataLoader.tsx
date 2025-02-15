/* Loads Constant Data from the API that is used on all pages. */
import { get_season, load_season } from "../store/seasons";
import { load_bosses } from "../store/bosses";
import { load_classes } from "../store/classes";
import { load_roles } from "../store/roles";
import { load_specs } from "../store/specs";
import { useAppDispatch, useAppSelector } from "../store/store_hooks";
import { useEffect } from "react";

export default function GlobalDataLoader() {
    const dispatch = useAppDispatch();

    
    const season = useAppSelector(get_season);

    // Constant Data
    useEffect(() => {
        dispatch(load_classes());
        dispatch(load_roles());
        dispatch(load_specs());
        
        dispatch(load_season());
    }, []);
    
    // Seasonal Data
    useEffect(() => {
        season && season.raids.forEach(zone_id => {
            dispatch(load_bosses(zone_id));
        })
    }, [season]);

    return null;
}
