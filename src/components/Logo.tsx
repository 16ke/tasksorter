'use client';

import Image from 'next/image';

export default function Logo() {
  return (
    <Image 
      src="/vezir-inverted.svg" 
      alt="Vezir Logo" 
      width={72}
      height={72}
      className="w-18 h-18 object-contain brightness-150 contrast-125"
    />
  );
}