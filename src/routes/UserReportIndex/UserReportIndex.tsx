import FightSelectGrid from "../../components/ReportNavbar/FightSelectList"
import HeaderLogo from "../../components/HeaderLogo"
import LoadingOverlay from "../../components/shared/LoadingOverlay"
import PlayerSelectGrid from "../../components/ReportNavbar/PlayerSelectList"
import UrlInput from "./UrlInput"
import styles from "./UserReportIndex.module.scss"
import useUser from "../auth/useUser"
import { FaInfoCircle } from "react-icons/fa"
import { PATREON_LINK } from "../../constants"
import { SubmitButton } from "./SubmitButton";
import { get_is_loading } from "../../store/user_reports"
import { useAppSelector } from "../../store/store_hooks"
import { useForm, FormProvider } from "react-hook-form";


export default function UserReportIndex() {

    ////////////////////////////////
    // Hooks
    //
    const user = useUser()
    const is_loading = useAppSelector(get_is_loading)
    const form_methods  = useForm();

    const user_reports_perm = user.permissions.includes("user_reports")

    ////////////////////////////////
    // Render
    //
    return (
        <div className="d-flex justify-content-center">

            <FormProvider {...form_methods}>
            <form className={`${styles.container} mt-5`}>

                {/* Header */}
                <h2 className="m-0 gap-2 d-flex align-items-center wow-artifact">
                    <HeaderLogo wow_class="wow-artifact" />
                    <span>Load Report:</span>
                </h2>

                {/* URL Input */}
                <div>
                    <h4 className="mb-1">URL:</h4>
                    <UrlInput />
                </div>

                {is_loading && <LoadingOverlay />}

                <div className={`d-flex gap-4 justify-content-center  ${is_loading ? "loading_trans" : ""} `}>
                    <FightSelectGrid />
                    <PlayerSelectGrid />
                </div>

                <div className="mt-3 d-flex ">

                    { !user_reports_perm && <div className={styles.patreon_info}>
                        <FaInfoCircle className="mr-1"/>
                        <a href={PATREON_LINK} target="_blank">
                            <span className="wow-legendary">Legendary Patrons</span> can load multiple pulls and players at once!
                        </a>
                    </div> }

                    <div className="ml-auto">
                        <SubmitButton />
                    </div>

                </div>

            </form>
            </FormProvider>
        </div>
    )
}
