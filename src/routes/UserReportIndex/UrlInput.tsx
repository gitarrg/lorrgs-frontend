import styles from "./UrlInput.module.scss"
import { FaChevronRight, FaSyncAlt } from 'react-icons/fa';
import { KeyboardEvent, useEffect } from 'react'
import { load_report_overview, get_is_loading, get_user_report } from "../../store/user_reports";
import { useAppDispatch, useAppSelector } from '../../store/store_hooks'
import { useFormContext, useWatch } from 'react-hook-form';
import { useLocation } from 'react-router';


/** text to show when the URL input is empty */
const PLACEHOLDER = "https://www.warcraftlogs.com/reports/<report code>"


const URL_REGEX = /warcraftlogs\.com\/reports\/(\w{16})/i;

/** Extract the report code from an url. */
function report_id_from_url(url="") {
    if (!url) { return ""}

    const match = URL_REGEX.exec(url);
    if (match) { return match[1] }

    return  ""
}


/** an URL-Input Field and Button to load the URL
 *
 */
export default function UrlInput({input_name="report_url"}) {

    ////////////////////////////////
    // Hooks: Redux
    const dispatch = useAppDispatch()
    const is_loading = useAppSelector(state => get_is_loading(state))
    const user_report = useAppSelector(get_user_report)
    // Hooks: Router
    const { search } = useLocation();
    // Hooks: Form
    const { register, setValue, formState: { errors } } = useFormContext();
    const url = useWatch({name: input_name})


    ////////////////////////////////
    // Vars
    const report_id = report_id_from_url(url)
    const is_valid = report_id != "" && user_report.error == ""

    ////////////////////////////////
    // Handlers
    useEffect(() => {
        const search_params = new URLSearchParams(search)
        const report_id = search_params.get("report_id") || user_report.report_id
        if (!report_id) { return }
        setValue("report_url", `https://www.warcraftlogs.com/reports/${report_id}`)

        setValue("report_code", report_id)
        dispatch(load_report_overview(report_id))
    }, [search, user_report.report_id])


    /** Update the stored report code */
    function onClick() {
        setValue("report_code", report_id)
        dispatch(load_report_overview(report_id, false))
    }

    function onClickReload() {
        dispatch(load_report_overview(report_id, true))
    }


    /** Allow users to submit their URL by pressing enter */
    function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key == "Enter") {
            event.preventDefault()
            onClick()
        }
    }


    ////////////////////////////////
    // Render
    return (
        <div>
            <div className={`${styles.url_input} bg-dark rounded p-2 input-group`}>

                {/* Input */}
                <input
                    {...register(input_name, {
                        validate: () => is_valid || "invalid url",
                    })}
                    type="text"
                    onKeyDown={onKeyDown}
                    className={`form-input form-control ${is_valid ? "valid" : "invalid"}`}
                    placeholder={PLACEHOLDER}
                />

                {/* Button: Load */}
                <button
                    type="button"
                    className="button"
                    disabled={!is_valid || is_loading}
                    data-tooltip="Load Report"
                    onClick={onClick}
                >
                    <FaChevronRight />
                </button>

                {/* Button: Reload */}
                <button
                    type="button"
                    className="button"
                    disabled={!is_valid || is_loading}
                    data-tooltip="Reload"
                    onClick={onClickReload}
                >
                    <FaSyncAlt />
                </button>

            </div>

            {/* Error Messages */}
            {url && !is_valid &&  (
                <span className="text-danger mt-1">
                    {errors[input_name]?.message}
                    {user_report.error ?? ""}
                </span>
            )}
        </div>
    )
}
