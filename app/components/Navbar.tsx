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

        <nav className="bg-transparent  shadow-sm">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link href="/" className="text-xl font-bold text-white items-center  flex px-7">
                        <div className="flex items-center gap-3 "><img src={"https://neurogreen.be/wp-content/uploads/2023/09/photo_2023-09-07_22-31-26.jpg"} alt={`Neurogreen-logo`} className=" w-15 h-15 rounded-full overflow-hidden" /></div>
                        <p className="mx-6 ">NEUROGREEN</p>
                    </Link>

                    {/* Desktop menu */}
                    <div className="hidden md:flex space-x-6 text-white " >
                        <Link href="/" className=" relative group block hover:text-green-200 flex px- space-x-4 items-center-safe "> <FaHome size={21}/> <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible z-5 whitespace-nowrap">Home</div></Link>
                        <Link href="/search" className="relative group block hover:text-green-200 hover:-underline-offset-2 flex px-4 space-x-4 items-center-safe"><FaSearch size={21} className="group"/> <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible z-5whitespace-nowrap">Search</div></Link>
                        <Link href="/stock" className="relative group block hover:text-green-200 flex px-4 space-x-4 items-center-safe"><FaBoxes size={21}/> <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible z-5 whitespace-nowrap">Stock</div> </Link>
                        <Link href="/dashboard" className="relative group block hover:text-green-200 flex px-4 space-x-4 items-center-safe"> <BarChart3 size={21}/> <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible z-5 whitespace-nowrap">Dashboard</div> </Link> 
                    </div>

                    {/* Hamburger */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setOpen(!open)}
                    >
                        <Hamburger />
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden bg-transparent   py-3">
                    <Link
                        href="/"
                        className="block px-4 py-2 hover:bg-green-200 text-white space-x-3 flex-2"
                        onClick={() => setOpen(false)}
                    >
                       <FaHome size={19}/> Home 
                    </Link>
                    <Link
                        href="/search"
                        className="block px-4 py-2 hover:bg-green-200 text-white space-x-3 flex-2"
                        onClick={() => setOpen(false)}
                    >
                        <FaSearch size={19 }/> Search
                    </Link>

                    <Link
                        href="/stock"
                        className="block px-4 py-2 hover:bg-green-200 text-white space-x-3 flex-2"
                        onClick={() => setOpen(false)}
                    >
                        <FaBoxes size={19}/> Stock 
                    </Link>

                    <Link
                        href="/dashboard"
                        className="block px-4 py-2 hover:bg-green-200 text-white space-x-3 flex-2"
                        onClick={() => setOpen(false)}
                    >
                        <BarChart3 size={19}/> Dashboard 
                    </Link>

                </div>
            )}
        </nav>


    );
}
