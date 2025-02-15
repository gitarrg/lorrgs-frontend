import { DISCORD_LINK, PATREON_LINK, BUYMEACOFFEE_LINK } from '../../constants'
import { FaInfoCircle } from 'react-icons/fa'
import DiscordLogo from '../../assets/DiscordLogo'
import PatreonLogo from '../../assets/PatreonLogo'
import style from "./IndexLink.module.scss"
import type { ReactNode } from 'react'


function LinkButton({url, children} : {url: string, children: ReactNode }) {
    return (
        <div className={`${style.link} grow-when-touched border bg-dark`}>
            <a href={url} target="_blank" rel="noopener">
                {children}
            </a>
        </div>
    )
}


export default function IndexLinks() {

    return (
        <div>
            <h4>Links:</h4>
            <div className={style.container}>

                <LinkButton url="/help">
                    <FaInfoCircle />
                    <span>Help</span>
                </LinkButton>

                <LinkButton url={DISCORD_LINK}>
                    <DiscordLogo />
                    <span>Discord</span>
                </LinkButton>

                <LinkButton url={PATREON_LINK}>
                    <PatreonLogo />
                    <span>Patreon</span>
                </LinkButton>

                <LinkButton url={BUYMEACOFFEE_LINK}>
                    <span style={{marginLeft: "-2px"}}>☕ Coffee</span>
                </LinkButton>

            </div>
        </div>
    )
}
