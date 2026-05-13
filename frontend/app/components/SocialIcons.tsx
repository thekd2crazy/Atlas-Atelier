import { FaInstagram, FaSnapchat, FaTelegram } from "react-icons/fa";

export default function SocialIcons() {
    return (

        <li className="mx-3 flex items-center p-3">
            <a href="#" target="_blank" className="mx-3  transition-colors duration-200 hover:scale-125 hover:text-green-200 ">
                < FaInstagram size={30} />
            </a>
            <a href="#" target="_blank" className="mx-3 transition-colors duration-200 hover:scale-125 hover:text-green-200">
                <FaSnapchat size={30} />
            </a>

            <a href="#" target="_blank" className="mx-3  transition-colors duration-200 hover:scale-125 hover:text-green-200">
                <FaTelegram size={30} />
            </a>
        </li>

    )
}