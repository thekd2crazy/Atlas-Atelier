import { Children, ReactNode } from "react"

// l'objectif est de mettre un logo 
type SkillEntry = {
  title: string
  children: ReactNode
}

export default function SkillEntry(props: SkillEntry) {
  return (
    <div className="bg-orange-500 text-slate-50 flex flex-col items-center justify-center w-30 h-30 lg:w-36 lg:h-36 rounded-3xl hover:bg-orange-300 transition-all duration-100">
      {props.children}
      <p className="text-lg text-center">{props.title}</p>
    </div>
  )
}
