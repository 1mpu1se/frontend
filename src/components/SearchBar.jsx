"use client";

import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Поиск музыки" }) {
    return (
        <div className="max-w-4xl mx-auto mb-8 mt-12">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl text-gray-700 placeholder-gray-400 focus:outline-none"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
                />
            </div>
        </div>
    );
}