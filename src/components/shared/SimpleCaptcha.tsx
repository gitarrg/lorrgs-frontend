

import { useEffect, useState } from "react";
import style from "./SimpleCaptcha.module.css";
import { toMMSS } from "../../utils";


const TOTAL_SECONDS = 15;
const MAX_SECONDS = 60;


export default function SimpleCaptcha(
    { onVerify, attempt_counter }: { onVerify: () => void, attempt_counter: number },

) {

    // exp incr time
    // doubles each attempt, up to 60sec max
    let time = TOTAL_SECONDS * Math.pow(2, attempt_counter);
    time = Math.min(time, MAX_SECONDS);

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
