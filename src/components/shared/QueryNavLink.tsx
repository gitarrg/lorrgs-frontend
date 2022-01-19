import type { ReactNode } from "react";
import useQuery from "../../hooks/useQuery";
import { useLocation, NavLink, NavLinkProps } from 'react-router-dom';



interface QueryNavLinkProps {

    // Object with new parms to set
    params: {[key: string]: string}

    children: ReactNode
}


export default function QueryNavLink({ params, children, ...props } : QueryNavLinkProps ) {

    const location = useLocation();

    const old_query = useQuery();
    const new_query = new URLSearchParams({  // useMemo?
        ...Object.fromEntries(old_query),
        ...params
    });

    const link = `${location.pathname}?${new_query.toString()}`;
    return (
        <NavLink to={link} {...props}>
            {children}
        </NavLink>
    )
}
