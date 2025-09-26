'use client';

export default function FaviconLogo() {
  return (
    <div className="flex justify-center mb-6">
      <img 
        src="/vezir-favicon.svg" 
        alt="Vezir Logo" 
        className="w-32 h-32 object-contain brightness-125 contrast-140"
      />
    </div>
  );
}
