
import { useState, useEffect } from 'react'
import { useFormContext } from "react-hook-form";

import DurationInputGroup from '../../components/shared/DurationInputGroup'
import FormGroup from './FormGroup'


/**
 * Component to input a min/max-killtime
 */
export default function KilltimeGroup() {

    const form_methods = useFormContext();

    // state to set and receive the values
    const [values, set_values] = useState({min: 0, max: 0})

    // Pass values to form
    useEffect(() => {
        form_methods.setValue("killtime_min", values.min)
        form_methods.setValue("killtime_max", values.max)

    }, [values])
    console.log("values", values)

    ////////////////////////////
    // Render
    return (
        <FormGroup name="Killtime:" className="killtime-search">
            <DurationInputGroup onChange={set_values}/>
        </FormGroup>
    )
}
