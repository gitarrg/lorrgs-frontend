import styles from "./UserReportLoading.module.scss";


function format_tooltip(data: object) {
    return Object.entries(data).map(
        ([n, v]) => `${n} = ${v}`
    ).join("\u000A")
}


export function task_item_status( items = {} ) {
    // Calc overall status
    let v = 0
    let t = 0
    for (const item of Object.values(items)) {
        t += 1
        const s = item["status"]
        if (s == "done") { v += 1}
    }
    if (t == 0) { return ""}

    const p = (v / t) * 100
    return ` (${v}/${t}, ${p.toFixed(1)}%)`
}


function TaskSubItem( { value } : { value: any} ) {

    const tooltip = format_tooltip(value)

    return (
        <div
            className={styles.task_item}
            data-status={value["status"]}
            data-tooltip={tooltip}
        />
    )
}


export function TaskItems({ items = {} }: { items: {}; }) {

    return (
        <div className={styles.task_items_container}>
            {Object.entries(items).map(([key, value], i) => (
                <TaskSubItem key={key} value={value} />
            ))}
        </div>
    );
}
