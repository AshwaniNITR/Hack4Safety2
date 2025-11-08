'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Navbar from './Navbar';

const slogans = [
  'Bringing closure to families',
  'Powered by advanced facial recognition',
  'Connecting the missing with the found',
  'Every identity matters',
  'Restoring hope through technology',
];

export default function Hero() {
  const [currentSlogan, setCurrentSlogan] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentSlogan((prev) => (prev + 1) % slogans.length);
        setIsVisible(true);
      }, 500);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar />
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center font-[Orbitron]">
        
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_65%)]" />

    {/* DNA Helix Animation */}
    <div className="absolute top-1/4 right-1/4 w-48 h-48 opacity-20">
      <div className="absolute inset-0 animate-spin-slow">
        <div className="absolute top-0 left-1/2 w-1 h-24 bg-cyan-400/40 rounded-full transform -translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-1 h-24 bg-blue-400/40 rounded-full transform -translate-x-1/2" />
      </div>
      <div className="absolute top-6 left-1/2 w-2 h-2 bg-cyan-400 rounded-full transform -translate-x-1/2" />
      <div className="absolute bottom-6 left-1/2 w-2 h-2 bg-blue-400 rounded-full transform -translate-x-1/2" />
    </div>

    {/* Facial Recognition Grid */}
    <div className="absolute inset-0 opacity-10">
      <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="border border-slate-600/30 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-500/5" />
            {i % 7 === 0 && (
              <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-400/40 rounded-full animate-ping" />
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Enhanced Magnifying Glass with Face Recognition */}
    <div className="magnifying-glass absolute w-80 h-80 rounded-full border-4 border-slate-600/50 shadow-2xl shadow-blue-500/30">
      {/* Glass lens effect */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/15 to-cyan-400/15 backdrop-blur-sm border border-slate-500/30" />
      
      {/* Facial Recognition Points */}
      <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-green-400 rounded-full animate-pulse delay-100" />
      <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-pulse delay-200" />
      <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-green-400 rounded-full animate-pulse delay-300" />
      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse delay-400" />
      
      {/* Scanning Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan" />
      
      {/* Handle */}
      <div className="absolute -bottom-16 -right-8 w-32 h-4 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full transform rotate-45 origin-right shadow-lg" />
    </div>

    {/* Connection Lines */}
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-30">
      <div className="absolute inset-0 border-2 border-dashed border-cyan-400/30 rounded-full animate-pulse" />
      <div className="absolute inset-8 border-2 border-dashed border-blue-400/30 rounded-full animate-pulse delay-100" />
    </div>

    {/* Floating Data Points */}
    <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-cyan-400/60 rounded-full animate-float" />
    <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-blue-400/60 rounded-full animate-float delay-200" />
    <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-cyan-300/60 rounded-full animate-float delay-400" />
    <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-blue-300/60 rounded-full animate-float delay-600" />
  </div>

  <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
    <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold mb-6 tracking-tight">
      <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
        Identiq
      </span>
    </h1>

    <div className="h-16 flex items-center justify-center mb-8">
      <p
        className={`text-xl md:text-2xl text-slate-300 font-light tracking-wide transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {slogans[currentSlogan]}
      </p>
    </div>

    {/* Mission Statement */}
    <div className="max-w-2xl mx-auto">
      <p className="text-sm md:text-lg text-slate-400 font-light leading-relaxed bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
        Using <span className="text-cyan-300">AI-powered facial recognition</span> to match missing persons with unidentified bodies, helping authorities quickly identify individuals and close cases with <span className="text-blue-300">accuracy and compassion</span>.
      </p>
    </div>

    {/* Stats Bar */}
    {/* <div className="flex justify-center gap-8 mt-8 text-slate-300">
      <div className="text-center">
        <div className="text-2xl font-bold text-cyan-300">99.8%</div>
        <div className="text-sm text-slate-400">Accuracy Rate</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-300">2.4s</div>
        <div className="text-sm text-slate-400">Average Match Time</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-300">1K+</div>
        <div className="text-sm text-slate-400">Cases Solved</div>
      </div>
    </div> */}
  </div>

  <style jsx>{`
    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) rotate(0deg);
      }
      25% {
        transform: translate(100px, -80px) rotate(5deg);
      }
      50% {
        transform: translate(200px, 50px) rotate(-3deg);
      }
      75% {
        transform: translate(-50px, 100px) rotate(4deg);
      }
    }

    @keyframes scan {
      0% {
        transform: translateY(0);
      }
      100% {
        transform: translateY(320px);
      }
    }

    @keyframes spin-slow {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0) scale(1);
        opacity: 0.6;
      }
      50% {
        transform: translateY(-20px) scale(1.1);
        opacity: 1;
      }
    }

    .magnifying-glass {
      animation: float 20s ease-in-out infinite;
      top: 20%;
      left: 10%;
      filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.3));
    }

    .animate-scan {
      animation: scan 3s ease-in-out infinite;
    }

    .animate-spin-slow {
      animation: spin-slow 8s linear infinite;
    }

    .animate-float {
      animation: float 4s ease-in-out infinite;
    }

    .delay-100 {
      animation-delay: 0.2s;
    }

    .delay-200 {
      animation-delay: 0.4s;
    }

    .delay-300 {
      animation-delay: 0.6s;
    }

    .delay-400 {
      animation-delay: 0.8s;
    }

    .delay-600 {
      animation-delay: 1.2s;
    }
  `}</style>
</div>
    </>
   
  );
}
