

import { useEffect, useState } from "react";
import style from "./SimpleCaptcha.module.css";
import { toMMSS } from "../../utils";


const TOTAL_SECONDS = 5;
const MAX_SECONDS = 60;


export default function SimpleCaptcha(
    { onVerify, attempt_counter }: { onVerify: () => void, attempt_counter: number },

) {

    const time = Math.min(MAX_SECONDS, TOTAL_SECONDS * attempt_counter);
    const [secondsRemaining, setSecondsRemaining] = useState(time)

    useEffect(() => {
        const interval = setInterval(() => {
            setSecondsRemaining((previousSeconds) => {
                if (previousSeconds <= 1) {
                    clearInterval(interval)
                    return 0
                }
                return previousSeconds - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const enabled = secondsRemaining === 0
    const remainingTime = toMMSS(secondsRemaining)

    if (!enabled) {
        return <span>Wait {remainingTime}</span>
    }

    return (
        <label className={style.captcha} onClick={onVerify}>
            <div className={style.fake_checkbox} />
            <span>I love World of Warcraft</span>
        </label>
    )
}
