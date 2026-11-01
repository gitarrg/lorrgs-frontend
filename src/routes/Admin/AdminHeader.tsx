import HeaderLogo from "../../components/HeaderLogo";

export function AdminHeader() {

    return <h1 className="m-0 d-flex align-items-center">
        <HeaderLogo wow_class="wow-boss" />
        <div className="ml-2">
            Admin Page
        </div>
    </h1 >;
}
