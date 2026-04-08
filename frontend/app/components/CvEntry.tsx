'user client'
import { ReactNode } from "react"
import { SlideIn } from "./Animation"
import Image, { StaticImageData } from "next/image";


type CvEntry = {
    title: string
    employer: string
    image: string
    children: ReactNode
}

export default function CvEntry(props: CvEntry) {
    return (

        <SlideIn>
            <div className="
                    border border-white
                    bg-bleu-500 
                
                    p-5 
                    rounded-xl
                    shadow-md 
                    hover:shadow-xl
                    transition-all 
                    duration-300
                    hover:-translate-y-1
                ">

                <h3 className="text-sm md:text-base text-amber-100 ">{props.title}  {props.employer}</h3>
                <div className="flex justify-between items-center space-x-4">
                    <ul className="text-sm md:text-base mt-4 text-amber-50 list-disc list-inside"> {props.children}</ul>

                    <div className="flex items-center gap-3 "><img src={props.image} alt={`${props.employer} logo`} className=" w-20 h-20 rounded-full overflow-hidden" /></div>

                </div>
            </div>
        </SlideIn>

    )
}