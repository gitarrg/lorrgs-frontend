

import * as styles from "./Footer.scss"


function LegalText() {
    return (
        <small>
            All data is retrieved from <a href="https://warcraftlogs.com" target="_blank" rel="noopener"><strong>Warcraft Logs</strong></a>.&nbsp;
            Item and ability tooltips by <a href="https://wowhead.com" target="_blank" rel="noopener"><strong>Wowhead</strong></a>.<br />
            All images copyright Blizzard Entertainment. World of Warcraft
            Warcraft and Blizzard Entertainment are trademarks or registered trademarks of Blizzard Entertainment, Inc. in the U.S. and/or other countries.
        </small>
    )
}


function VersionInfo() {

    return (
        <small className={styles.version_info}>
            v{VERSION}<br />
            {LASTCOMMITDATETIME}
        </small>
    )
}



export default function Footer() {
    return (
        <footer className="p-1 d-flex text-muted">
            <LegalText />
            < VersionInfo />
        </footer>
    )
}


