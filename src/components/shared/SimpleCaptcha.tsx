

import { useEffect, useState } from "react";
import style from "./SimpleCaptcha.module.css";
import { toMMSS } from "../../utils";


const TOTAL_SECONDS = 10;

export default function SimpleCaptcha(
    { onVerify }: { onVerify: () => void },

) {
    const [secondsRemaining, setSecondsRemaining] = useState(TOTAL_SECONDS)

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
            <span className={style.labelText}>I love World of Warcraft</span>
        </label>
    )
}
