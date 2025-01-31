import Footer from "./components/Footer/Footer";
import GlobalDataLoader from "./components/GlobalDataLoader";
import UserProvider from "./routes/auth/UserProvider";
import data_store from "./store/store"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux'
import { StrictMode, lazy, Suspense } from "react"
import React from 'react';
import { createRoot } from "react-dom/client";

// Delayed Imports
// const Admin = lazy(() => import("./routes/Admin/Admin"));
const CompRankings = lazy(() => import("./routes/CompRankings/CompRankings"));
const CompSearch = lazy(() => import("./routes/CompSearch"));
const Help = lazy(() => import("./routes/Help/Help"))
const Index = lazy(() => import("./routes/Index/Index"));
const LoginPage = lazy(() => import("./routes/auth/LoginPage"));
const SpecRankings = lazy(() => import("./routes/SpecRankings"));
const UserPage = lazy(() => import("./routes/auth/UserPage"));
const UserReport = lazy(() => import("./routes/UserReport/UserReport"));
const UserReportIndex = lazy(() => import("./routes/UserReportIndex/UserReportIndex"));
const UserReportLoading = lazy(() => import("./routes/UserReportLoading/UserReportLoading"));


////////////////////////////////////////////////////////////////////////////////
// APP
//

function App() {

    ////////////////////////
    // Output
    return (
        <Provider store={data_store}>
        <StrictMode>

            <GlobalDataLoader />
            <UserProvider />

            <main className="flex-grow-1">

            <Router>
                <Suspense fallback={<div>Loading...</div>}>
                <Routes>

                    {/* Spec Rankings */}
                    <Route path="/spec_ranking/:spec_slug/:boss_slug" element={<SpecRankings />} />

                    {/* Comp Rankings */}
                    <Route path="/comp_ranking/search" element={<CompSearch />} />
                    <Route path="/comp_ranking/:boss_slug" element={<CompRankings />} />

                    {/* User Reports */}
                    <Route path="/user_report/load" element={<UserReportLoading />} />
                    <Route path="/user_report/:report_id" element={<UserReport />} />
                    <Route path="/user_report" element={<UserReportIndex />} />

                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/user" element={<UserPage />} />

                    {/* other routes */}
                    <Route path="/help" element={<Help />} />
                    {/* <Route path="/lorgmin" element={<Admin />} /> */}

                    {/* fallback --> Home */}
                    <Route path="/" element={<Index />} />
                </Routes>
                </Suspense>
            </Router>

            </main>

            <Footer />

        </StrictMode>
        </Provider>
    )
}

const root = createRoot(document.getElementById("app_root")!);
root.render(<App />);
