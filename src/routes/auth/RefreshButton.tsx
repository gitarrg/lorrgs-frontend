import { load_user } from '../../store/user'
import { useAppDispatch } from '../../store/store_hooks'
import { FaSync } from 'react-icons/fa';


export default function RefreshButton() {

    const dispatch = useAppDispatch()

    function handle() {
        dispatch(load_user(true))
    }

    return (
        <button
            className="button button-grey grow-when-touched rounded border h4 text-white"
            onClick={handle}>
                <FaSync />
                <span className="ml-1">Refresh</span>

        </button>
    )
}
