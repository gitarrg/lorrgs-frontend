
import { Route } from 'react-router-dom';
import { AdminHeader } from './AdminHeader';
import AdminNavbar from './AdminNavbar';
import AdminSpells from './AdminSpells';
import AdminStatus from './AdminStatus';
import AdminPing from './AdminPing';


export default function Admin() {

    // const { path }  = useMatch()

    return (
        <div>

            <div className="mt-3 p-2">
                <AdminHeader />
            </div>
            <div>
                <AdminNavbar />
            </div>

            <div>

                <Route path="status">
                    <AdminStatus />
                </Route>

                <Route path="spells">
                    <AdminSpells />
                </Route>

                <Route path="ping">
                    <AdminPing />
                </Route>

            </div>
        </div>
    )
}
