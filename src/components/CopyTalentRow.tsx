import { useState } from "react";
import { FaCopy, FaCheck, FaPencilAlt } from "react-icons/fa";
import style from "./CopyNoteWindow.module.scss";

// TODO(#128): generate from the player's talents. Placeholder until the string encoder exists.
const PLACEHOLDER_STRING = "BcQAAAAAAAAAAAAAAAAAAAAAAAAAgZmZmZmZmxMzMmZmZmZmZGAAAAAAAAAAAAAAAAAAAAAAAAYmxMzMmZmZmZmZ";


/** One line: the import string (click to copy) and an "edit" button opening it in the Wowhead calculator. */
export default function CopyTalentRow() {
    const [isCopied, setIsCopied] = useState(false);
    const talent_string = PLACEHOLDER_STRING;

    async function doCopy() {
        await navigator.clipboard.writeText(talent_string);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
    }

    return (
        <div className={style.talent_row}>
            <button
                type="button"
                className={style.talent_string}
                onClick={doCopy}
                aria-label="copy talent import string"
                data-tooltip="click to copy"
                data-tooltip-size="small"
            >
                <span className={style.talent_string_text}>{talent_string}</span>
                <span className={style.talent_copy_icon}>{isCopied ? <FaCheck /> : <FaCopy />}</span>
            </button>
            <a
                className={["button border rounded", style.talent_edit].join(" ")}
                href={`https://www.wowhead.com/talent-calc/blizzard/${talent_string}`}
                target="_blank"
                rel="noopener noreferrer"
            >
                <FaPencilAlt /> edit
            </a>
        </div>
    );
}
