
import { useEffect  } from 'react';


export default function Ad() {

    useEffect(() => {
        // @ts-ignore
        if(window) (window.adsbygoogle = window.adsbygoogle || []).push({});
    },[]);

    return (
        <ins
            className="adsbygoogle"
            style={{"display": "block"}}
            data-ad-client="ca-pub-4043710965953712"
            data-ad-slot="8913966363"
            data-ad-format="auto"
            data-full-width-responsive="true"
            data-adtest="on"
        />
    );
};
