import { FaInstagram, FaSnapchat, FaTelegram } from "react-icons/fa";

export default function SocialIcons() {
    return (

        <li className="mx-3 flex items-center p-3">
            <a href="#" target="_blank" className="mx-3  transition-colors duration-200 hover:scale-125 hover:text-orange-500 ">
                < FaInstagram size={30} />
            </a>
            <a href="#" target="_blank" className="mx-3 transition-colors duration-200 hover:scale-125 hover:text-orange-500">
                <FaSnapchat size={30} />
            </a>

            <a href="#" target="_blank" className="mx-3  transition-colors duration-200 hover:scale-125 hover:text-orange-500">
                <FaTelegram size={30} />
            </a>
        </li>

    )
}