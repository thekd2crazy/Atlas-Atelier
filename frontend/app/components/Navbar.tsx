"use client";

import Link from "next/link";
import { useState } from "react";
import { FaBars, FaBoxes, FaHome, FaSearch, FaTachometerAlt } from "react-icons/fa"
import AnimatedUnderline from "./Animation";
import { BsFillMortarboardFill } from "react-icons/bs";
import { BarChart3 } from "lucide-react";

export function Hamburger() {
    return < FaBars size={50} />;
}

export default function Navbar() {
    const [open, setOpen] = useState(false);

    return (

        <nav className="bg-transparent  shadow-sm relative z-50">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center h-26">

                    {/* Logo */}
                    <Link href="/" className="text-xl font-bold text-white items-center  flex px-7">
                        <div className="flex items-center gap-3 "><img src={"https://neurogreen.be/wp-content/uploads/2023/09/photo_2023-09-07_22-31-26.jpg"} alt={`Neurogreen-logo`} className=" w-15 h-15 rounded-full overflow-hidden" /></div>
                        <p className="mx-6 ">NEUROGREEN</p>
                    </Link>

                    {/* Desktop menu */}
                    <div className="hidden md:flex space-x-6 text-black " >
                        <Link href="/" className=" relative group rounded hover:text-green-200 hover:bg-black flex flex-col px-4 py-2 space-x-4 items-center ">
                         <FaHome className="mx-auto" size={21} />
                         <span className=" ">Home</span>
                        </Link>
                        <Link href="/search" className=" relative group rounded hover:text-green-200 hover:bg-black flex flex-col px-4 py-2 space-x-4 items-center ">
                         <FaSearch className="mx-auto" size={21}/>
                         <span>Search</span>
                        </Link>
                        <Link href="/stock" className=" relative group rounded hover:text-green-200 hover:bg-black flex flex-col px-4 py-2 space-x-4 items-center ">
                         <FaBoxes className="mx-auto" size={21}/>
                         <span>Stock</span>
                        </Link>
                        <Link href="/dashboard" className=" relative group rounded hover:text-green-200 hover:bg-black flex flex-col px-4 py-2 space-x-4 items-center ">
                         <BarChart3 className="mx-auto" size={21}/>
                         <span>Dashboard</span>
                        </Link>
                        <Link href="/projets" className=" relative group rounded hover:text-green-200 hover:bg-black flex flex-col px-4 py-2 space-x-4 items-center ">
                         <BarChart3 className="mx-auto" size={21}/>
                         <span>Project</span>
                        </Link>
                    </div>

                    {/* Hamburger */}
                    <button
                        className="md:hidden text-black"
                        onClick={() => setOpen(!open)}
                    >
                        <Hamburger />
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden absolute left-0 right-0 top-full bg-white shadow-lg z-50 py-3">
                    <Link
                        href="/"
                        className="relative px-4 py-2 hover:bg-green-200 text-black space-x-3 flex"
                        onClick={() => setOpen(false)}
                    >
                       <FaHome size={19} className="space-x-3 "/> Home 
                    </Link>
                    <Link
                        href="/search"
                        className="relative px-4 py-2 hover:bg-green-200 text-black space-x-3 flex"
                        onClick={() => setOpen(false)}
                    >
                        <FaSearch size={19 }/> Search
                    </Link>

                    <Link
                        href="/stock"
                        className="relative px-4 py-2 hover:bg-green-200 text-black space-x-3 flex"
                        onClick={() => setOpen(false)}
                    >
                        <FaBoxes size={19}/> Stock 
                    </Link>

                    <Link
                        href="/dashboard"
                        className="relative px-4 py-2 hover:bg-green-200 text-black space-x-3 flex"
                        onClick={() => setOpen(false)}
                    >
                        <BarChart3 size={19}/> Dashboard 
                    </Link>

                </div>
            )}
        </nav>


    );
}
