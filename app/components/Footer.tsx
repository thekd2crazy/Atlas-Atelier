import { ReactNode } from "react"
import SocialIcons from "./SocialIcons"


type Footer = {
    title: string
    children: ReactNode
}

export default function Footer(props: Footer) {
    const now = new Date();
    const currentYear = now.getFullYear(); 
    return (
        <footer className="w-full bg-black py-6">
            <div className="max-w-6xl mx-auto flex flex-col  items-center justify-between text-white px-4 gap-8">

                <p className=" px-65 text-amber-50 text-center md:text-left text-sm md:text-base ">
            
                    ©     {currentYear}     {props.title}.     {props.children}
                </p>

                <div className="flex justify-center md:justify-end">
                    <SocialIcons />
                </div>
                

            </div>
        </footer>
    )
}