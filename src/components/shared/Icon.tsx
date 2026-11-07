import type Boss from '../../types/boss'
import type Role from '../../types/role'
import type Spec from '../../types/spec'
import type Class from '../../types/class'
import type Dungeon from '../../types/dungeon'
import WebpImg from "../WebpImg"


export default function Icon({
    spec,
    className="",
    size="m",
    alt="",
    title,
} : {
    spec: Spec | Class | Role | Boss | Dungeon
    className?: string,
    size?: "xs" | "s" | "m" | "l",
    alt?: string,
    title?: string,
} ) {

    // @ts-ignore
    const name_slug = spec.code ?? spec.class?.name_slug ?? spec.name_slug ?? ""


    return (
        <WebpImg
            className={`icon-${size} rounded wow-border-${name_slug} ${className}`}
            src={spec.icon_path || "icon path missing"}
            alt={alt}
            title={title}
        />
    )
}
