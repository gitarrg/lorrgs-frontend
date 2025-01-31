import * as styles  from "./UserReportLoading.scss"
import { FaCircleNotch } from "react-icons/fa";
import { Fragment, useEffect, useState } from "react";
import { PATREON_LINK } from "../../constants";
import { fetch_data } from "../../api";
import { useNavigate, useLocation } from "react-router";
import { useInterval } from 'react-use';
import { TaskItems, task_item_status } from "./TaskItems";


/** Frequency in ms how often to check for task status updates */
const TASK_CHECK_INVERVAL = 2000  // 1 second


// 10minutes
const TASK_CHECK_MAX_ITER = (10 * 60 * 1000) / TASK_CHECK_INVERVAL


/** status when the task is still in the queue.
 * may or may not be already executing... all we know is that its not completed
 */
const TASK_STATUS_DONE = "done"


async function fetch_task_status(task_name : string) {
    if (task_name === "done") { return "done" }
    return fetch_data(`/api/tasks/${task_name}`)
}


function InfoBlock({ params } : { params: object }) {

    const info_elements: JSX.Element[] = [] // keeps track of keys we already had

    for (const [key, value] of Object.entries(params)) {

        // skip empty values
        if (!value) { continue }

        info_elements.push(
            <Fragment key={key}>
                <span>{key}:</span>
                <span>{value}</span>
            </Fragment>
        )
    }

    // Render
    return (
        <>
            {info_elements}
        </>
    )
}


export default function UserReportLoading() {

    const { search } = useLocation();
    const navigate  = useNavigate()

    const params = new URLSearchParams(search)
    const report_id = params.get("report_id")
    const task_name = params.get("task")
    const queue = params.get("queue") || ""

    const [task_info, set_task_info] = useState({status: "unknown", message: "", updated: 0, items: {}})
    const [delay, setDelay] = useState<number|null>(null)
    const [num_checks, set_num_checks] = useState(0)

    ////////////////////////////
    // Callback
    async function update_status() {

        if (!task_name) { return }


        // Stop after TASK_CHECK_MAX_ITER Iterations
        set_num_checks(num_checks + 1)
        if (num_checks > TASK_CHECK_MAX_ITER) {
            console.log("TIMEOOUT")

            set_task_info({
                status: "Timeout",
                message: "please reload / try again",
                updated: 0,
                items: {}
            })
            setDelay(null)
            return
        }

        const info = await fetch_task_status(task_name)
        console.log("checking task status", info)

        set_task_info(info)

        // still waiting
        if (info.status != TASK_STATUS_DONE) { return }

        // go next!
        console.log("task completed!")

        // cleanup the url
        params.delete("report_id")
        params.delete("task")
        params.delete("queue")
        const rest_search = params.toString()
        const url = `/user_report/${report_id}?${rest_search}`
        navigate(url)
    }
    useInterval(update_status, delay);

    // Initial Update
    useEffect(() => {
        if (delay != null) { return }
        update_status()
        setDelay(TASK_CHECK_INVERVAL)
    }, [])


    ////////////////////////////
    // Render
    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <h1>
                    <FaCircleNotch className="mr-2 icon-spin" />
                    loading...
                </h1>

                <div className={styles.info}>
                    <InfoBlock params={{...Object.fromEntries(params)}} />
                    <hr />
                    <InfoBlock params={{
                        status: task_info["status"] + task_item_status(task_info.items),
                        message: task_info["message"],
                    }} />
                    <TaskItems items={ task_info.items } />
                </div>

                { queue == "free" && 
                    <div className={styles.advert + " bg-dark mt-4 p-2 border rounded wow-border-druid"}>
                        <span>
                            Become a <a href={PATREON_LINK} target="_blank" className="wow-legendary"><strong>Patreon</strong></a> and get acces to the premium queue!
                        </span>
                    </div>
                }
            </div>
        </div>
    )
}
