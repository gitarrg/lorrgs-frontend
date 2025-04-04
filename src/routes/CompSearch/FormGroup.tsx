


export default function FormGroup({name, className="", children} : {name: string, className?: string, children?: JSX.Element[] | JSX.Element}) {
    //
    return (
        <div className="search-group mt-2">
            <h4 className="mb-0">{name}</h4>
            <div className={`bg-dark p-1 rounded border ${className}`}>
                {children}
            </div>
        </div>
    )
}
