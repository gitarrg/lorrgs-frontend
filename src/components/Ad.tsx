
import { useEffect  } from 'react';
import useUser from '../routes/auth/useUser';


export default function Ad({
    slot = "8913966363",
    className = "",
    ...props
}
) {

    const user = useUser()
    const user_is_patreon = user.permissions.includes("user_reports")


    useEffect(() => {
        if (user_is_patreon) { return}

        // @ts-ignore
        if(window) (window.adsbygoogle = window.adsbygoogle || []).push({});
    },[user]);

    // patreons don't need to see adds
    if (user_is_patreon) {return null}

    const style ={
        display: "block",
        // border: "1px solid red",
        ...props
    }

    return (
        <ins
            className={`adsbygoogle ${className}`}
            style={style}
            data-ad-client="ca-pub-4043710965953712"
            data-ad-slot={slot}
            // data-ad-format="auto"
            data-ad-format="fluid"
            data-full-width-responsive="true"
            data-adtest="on"
        />
    );
};
