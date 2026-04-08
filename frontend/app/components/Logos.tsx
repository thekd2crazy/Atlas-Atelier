import React from 'react';
import { SiJavascript, SiTypescript, SiCss3, SiHtml5, SiPython, SiSharp, SiCplusplus } from 'react-icons/si';

export default function Logos() {
    const iconSize = 50;

    return (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <SiJavascript size={iconSize} color="#F7DF1E" title="JavaScript" />
            <SiTypescript size={iconSize} color="#3178C6" title="TypeScript" />
            <SiCss3 size={iconSize} color="#1572B6" title="CSS3" />
            <SiHtml5 size={iconSize} color="#E34F26" title="HTML5" />
            <SiPython size={iconSize} color="#3776AB" title="Python" />
            <SiSharp size={iconSize} color="#239120" title="C#" />
            <SiCplusplus size={iconSize} color="#00599C" title="C++" />
        </div>
    );
}