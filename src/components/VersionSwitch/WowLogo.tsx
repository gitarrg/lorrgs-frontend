/*
    Game Version icons: the ring-"W" from the Wowhead header (data tree switcher), tinted per version.
    Wowhead's tree names: live = Retail, classicplus = Forever, classic = Classic Era, mists = Mists.
*/
const TREE_COLORS: { [tree: string]: string } = {
    live: "rgb(248, 183, 0)",
    classicplus: "rgb(29, 141, 205)",
    classic: "rgb(195, 147, 97)",
    mists: "rgb(40, 174, 126)",
}

/** backend version name -> wowhead tree */
function tree_of(name: string) {
    if (name.includes("mop") || name.includes("mists")) { return "mists" }
    if (name.includes("forever") || name.includes("plus")) { return "classicplus" }
    if (name.includes("classic")) { return "classic" }
    return "live"
}

export function version_color(name: string) {
    return TREE_COLORS[tree_of(name)]
}

export default function WowLogo({ name, className = "" }: { name: string, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20.005" className={className} style={{ color: version_color(name) }}>
            <g transform="translate(-46 -45.925)">
                <path fill="currentColor" d="M66,55.952a10.3,10.3,0,0,0-1.752-5.686V47.819a.143.143,0,0,0-.133-.133H61.667a9.953,9.953,0,0,0-11.3,0H47.919a.118.118,0,0,0-.133.133v2.414a10,10,0,0,0,0,11.4v2.414a.143.143,0,0,0,.133.133h2.448a10.061,10.061,0,0,0,11.371-.033h2.414a.153.153,0,0,0,.133-.167h0V61.571A9.913,9.913,0,0,0,66,55.952Zm-18.676,0a8.662,8.662,0,1,1,8.662,8.662h0A8.647,8.647,0,0,1,47.324,55.952Z" />
                <path fill="currentColor" transform="translate(-84.667 -106.643)" d="M134.9,157.9h3.271a6.129,6.129,0,0,0-.1,1.124c.133,1.452,1.09,5.486,1.09,5.486l1.552-6.276,1.59,6.148s.957-5.424.957-5.786a1.014,1.014,0,0,0-.4-.7h3.471a3.57,3.57,0,0,0-.99,1.586c-.3,1.19-1.357,7.2-1.357,7.571a2.213,2.213,0,0,0,.4,1.09h-3.238a4.052,4.052,0,0,0,.1-.89c0-.562-.5-3.171-.5-3.171s-.662,2.71-.662,3.2a1.9,1.9,0,0,0,.2.857h-3.271s.629-.462.629-.89c-.067-1.224-1.786-7.6-1.919-8.1A2.071,2.071,0,0,0,134.9,157.9Z" />
            </g>
        </svg>
    )
}
