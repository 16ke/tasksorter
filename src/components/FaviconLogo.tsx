'use client';

import Image from 'next/image';

export default function FaviconLogo() {
  return (
    <div className="flex justify-center mb-6">
      <Image 
        src="/vezir-favicon.svg" 
        alt="Vezir Logo" 
        width={128}
        height={128}
        className="w-32 h-32 object-contain brightness-125 contrast-140"
      />
    </div>
  );
}