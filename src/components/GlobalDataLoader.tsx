/* Loads Constant Data from the API that is used on all pages. */

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { ZONE_ID } from "../constants";
import { load_bosses } from "../store/bosses";
import { load_classes } from "../store/classes";
import { load_roles } from "../store/roles";
import { load_specs } from "../store/specs";

export default function GlobalDataLoader() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(load_bosses(ZONE_ID));
        dispatch(load_classes());
        dispatch(load_roles());
        dispatch(load_specs());
    }, []);

    return null;
}
