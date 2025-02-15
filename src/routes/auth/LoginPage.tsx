import { FaCircleNotch } from "react-icons/fa"
import { get_current_user, login } from "../../store/user"
import { useAppDispatch, useAppSelector } from "../../store/store_hooks"
import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router"
import style from "./LoginPage.module.scss"


/** Page where users get redirected to, after login in. */
export default function LoginPage() {

    const { search } = useLocation()
    const navigate = useNavigate()

    const dispatch = useAppDispatch()
    const user = useAppSelector(get_current_user)

    const search_params = new URLSearchParams(search)
    const code = search_params.get("code")

    /** if we got a code, use it to try logging in the user */
    useEffect(() => {
        if (!code) { return }
        dispatch(login(code))
    }, [code])

    /** once logged in, we go back to the start page */
    useEffect(() => {
        if (user.logged_in) {
            navigate("/")
        }
    }, [user.logged_in])


    /** display error messages */
    if (user.error) {
        return (
            <div className={style.container}>
                <h4>Oh.. something went wrong.</h4>
                <div className="text-danger d-flex flex-column align-items-start">
                    <div>{user.error}</div>
                    <div>{user.error_message}</div>
                </div>
            </div>
        )
    }

    return (
        <div className={style.container}>
            <h4>
                <FaCircleNotch className="icon-spin mr-1"/>
                <span>logging in...</span>
            </h4>
        </div>
    )
}
