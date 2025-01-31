import { logout } from '../../store/user'
import { useAppDispatch } from '../../store/store_hooks'
import { useNavigate  } from 'react-router'
import { FaArrowRight } from 'react-icons/fa';

export default function LogoutButton() {

    const dispatch = useAppDispatch()
    const navigate  = useNavigate()

    function handle_logout() {
        dispatch(logout())
        navigate("/")
    }

    return (
        <button
            className="button button-grey grow-when-touched rounded border h4 text-white"
            onClick={handle_logout}>
                <FaArrowRight />
                <span className="ml-1">logout</span>
        </button>
    )
}
