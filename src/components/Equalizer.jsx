"use client";

import React from "react";

export default function Equalizer({ className }) {
    return (
        <>
            <svg
                className={className}
                width="36"
                height="20"
                viewBox="0 0 29 19"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect className="bar b1" x="1.546" y="2" width="3.09" height="15" rx="2" fill="#E8E19A" />
                <rect className="bar b2" x="10.0508" y="2" width="3.09" height="15" rx="2" fill="#E8E19A" />
                <rect className="bar b3" x="18.5552" y="0" width="3.09" height="17" rx="2" fill="#E8E19A" />
                <rect className="bar b4" x="27.0591" y="2" width="3.09" height="15" rx="2" fill="#E8E19A" />
            </svg>

            <style>{`
                .bar {
                  transform-box: fill-box;
                  transform-origin: center bottom;
                  animation-iteration-count: infinite;
                  animation-direction: alternate;
                  animation-timing-function: ease-in-out;
                }
        
                .b1 { animation-name: b1; animation-duration: 420ms; animation-delay: 0ms; }
                .b2 { animation-name: b2; animation-duration: 620ms; animation-delay: 120ms; }
                .b3 { animation-name: b3; animation-duration: 380ms; animation-delay: 60ms; }
                .b4 { animation-name: b4; animation-duration: 520ms; animation-delay: 200ms; }
        
                @keyframes b1 { from { transform: scaleY(0.25); } to { transform: scaleY(1.0); } }
                @keyframes b2 { from { transform: scaleY(0.35); } to { transform: scaleY(0.95); } }
                @keyframes b3 { from { transform: scaleY(0.30); } to { transform: scaleY(1.1); } }
                @keyframes b4 { from { transform: scaleY(0.40); } to { transform: scaleY(0.9); } }
            `}</style>
        </>
    );
}
