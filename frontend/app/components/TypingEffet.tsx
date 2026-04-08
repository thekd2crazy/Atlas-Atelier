"use client"
import { useState, useEffect } from "react";


type Props = {
    text: string;
    speed?: number; // vitesse en ms par lettre
};


export default function TypingEffect({ text, speed = 60 }: Props) {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        let index = 0;

        const interval = setInterval(() => {
            setDisplayedText(text.slice(0, index));
            index++;

            if (index > text.length) {
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    return <span className="text-[#ff7200] text-[60px]">{displayedText}</span>;
}
