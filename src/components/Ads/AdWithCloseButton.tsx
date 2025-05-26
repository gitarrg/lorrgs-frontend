

import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import styles from "./Ads.module.scss"



const useMutationObserver = (
    ref,
    callback,
    options = {
        characterData: true,
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        characterDataOldValue: true,
    }
) => {
    useEffect(() => {
        if (ref.current) {
            const observer = new MutationObserver(callback);
            observer.observe(ref.current, options);
            return () => observer.disconnect();
        }
    }, [ref]);
};


export default function AdWithCloseButton(props: any) {


    const [closed, setClose] = useState(false);
    const ref = useRef<HTMLModElement>(null);


    function handleClose() {
        setClose(true);
    }

    useMutationObserver(ref, function () {
        const status = ref.current?.getAttribute('data-ad-status');
        if (status == "unfilled") {
            setClose(true);
        }
    });


    if (closed) {
        return null;
    }

    return (
        <div className={styles.ad_with_close_button} {...props}>

            <IoMdClose className={styles.close_button} onClick={handleClose} />

            <ins
                className="adsbygoogle"
                ref={ref}
                data-ad-client="ca-pub-4043710965953712"
                style={{ display: "inline-block", width: "728px", height: "90px" }}
                data-ad-slot="1185664510"
                data-full-width-responsive="true">
            </ins>
        </div>
    );
}
