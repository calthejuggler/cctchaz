import {FC, HTMLAttributes} from "react";

interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {

}

export const Button: FC<ButtonProps> = (props) => {
    return (
        <button className={"px-3 py-2 text-sm border border-foreground rounded"} {...props}/>
    )
}