"use client";

export default function Waveform() {
  const delays = [0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2, 0.1, 0];

  return (
    <div className="flex items-center justify-center gap-1 h-10">
      {delays.map((delay, i) => (
        <div
          key={i}
          className="wave-bar w-1.5 bg-[#2d5a27] rounded-full"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}
