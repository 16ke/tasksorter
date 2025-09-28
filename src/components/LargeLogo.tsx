'use client';

import Image from 'next/image';

export default function LargeLogo() {
  return (
    <div className="flex justify-center mb-6">
      <Image 
        src="/vezir.svg" 
        alt="Vezir Logo" 
        width={128}
        height={128}
        className="w-32 h-32 object-contain"
      />
    </div>
  );
}