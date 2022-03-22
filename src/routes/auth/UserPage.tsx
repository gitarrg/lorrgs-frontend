import HeaderLogo from '../../components/HeaderLogo'
import LogoutButton from "./LogoutButton"
import style from "./UserPage.scss"
import useUser from "./useUser"


export default function UserPage() {

    const user = useUser()


    const avatar_url = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.jpg`

    return (
        <div className="content_center mt-5">

            <div className="d-flex flex-column">

                {/* Title */}
                <h3 className={`${style.title} h4 d-flex align-items-center gap-2`}>
                    <HeaderLogo size="icon-s" />
                    <div>User:</div>
                </h3>

                <div className="d-flex flex-row gap-2">

                    {/* Avatar */}
                    <img className={`${style.avatar} bg-dark border rounded`} src={avatar_url} />

                    <div className="d-flex flex-column">

                        <div className={`${style.user_info} bg-dark border rounded p-2 mb-2`}>
                            <div>Name:</div><div>{user.name}#{user.discriminator}</div>
                            <div>ID:</div><div><pre>{user.id}</pre></div>
                        </div>

                        <LogoutButton />
                    </div>
                </div>
            </div>
        </div>
    )
}
