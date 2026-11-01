import { Navigate, Route, Routes } from "react-router"
import { AdminHeader } from "./AdminHeader"
import AdminNavbar from "./AdminNavbar"
import AdminPing from "./AdminPing"
import AdminSpecRankingStatus from "./AdminSpecRankingStatus"
import AdminSpells from "./AdminSpells"
import AdminStatus from "./AdminStatus"

export default function Admin() {

    return (
        <div>
            <div className="mt-3 p-2">
                <AdminHeader />
            </div>
            <AdminNavbar />
            <Routes>
                <Route index element={<Navigate to="spec_ranking_status" replace />} />
                <Route path="spec_ranking_status" element={<AdminSpecRankingStatus />} />
                <Route path="status" element={<AdminStatus />} />
                <Route path="spells/*" element={<AdminSpells />} />
                <Route path="ping" element={<AdminPing />} />
            </Routes>
        </div>
    )
}
