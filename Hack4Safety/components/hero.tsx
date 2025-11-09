"use client"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

const continents = [
  // Abstract landmass 1
  {
    points: [
      { x: 150, y: 280 }, { x: 200, y: 250 }, { x: 250, y: 280 }, { x: 330, y: 300 },
      { x: 300, y: 400 }, { x: 220, y: 430 }, { x: 150, y: 400 }
    ],
    detail: true
  },
  // Abstract landmass 2
  {
    points: [
      { x: 220, y: 480 }, { x: 270, y: 450 }, { x: 320, y: 500 }, { x: 300, y: 610 },
      { x: 250, y: 600 }, { x: 220, y: 550 }
    ],
    detail: true
  },
  // Abstract landmass 3
  {
    points: [
      { x: 880, y: 260 }, { x: 950, y: 230 }, { x: 1020, y: 260 }, { x: 1000, y: 360 },
      { x: 930, y: 350 }, { x: 880, y: 320 }
    ],
    detail: true
  },
  // Abstract landmass 4
  {
    points: [
      { x: 980, y: 380 }, { x: 1050, y: 350 }, { x: 1130, y: 400 }, { x: 1100, y: 560 },
      { x: 1030, y: 550 }, { x: 980, y: 500 }
    ],
    detail: true
  },
  // Abstract landmass 5
  {
    points: [
      { x: 1100, y: 330 }, { x: 1150, y: 300 }, { x: 1200, y: 330 }, { x: 1180, y: 410 },
      { x: 1130, y: 400 }, { x: 1100, y: 370 }
    ],
    detail: true
  },
  // Abstract landmass 6
  {
    points: [
      { x: 1250, y: 280 }, { x: 1350, y: 250 }, { x: 1570, y: 300 }, { x: 1550, y: 510 },
      { x: 1400, y: 500 }, { x: 1250, y: 450 }
    ],
    detail: true
  },
  // Abstract landmass 7
  {
    points: [
      { x: 1450, y: 420 }, { x: 1500, y: 390 }, { x: 1570, y: 420 }, { x: 1550, y: 520 },
      { x: 1480, y: 510 }, { x: 1450, y: 470 }
    ],
    detail: true
  },
  // Abstract landmass 8
  {
    points: [
      { x: 1620, y: 580 }, { x: 1670, y: 550 }, { x: 1720, y: 580 }, { x: 1700, y: 670 },
      { x: 1650, y: 660 }, { x: 1620, y: 620 }
    ],
    detail: true
  },
  // Abstract landmass 9
  {
    points: [
      { x: 1800, y: 620 }, { x: 1820, y: 600 }, { x: 1850, y: 620 }, { x: 1840, y: 670 },
      { x: 1810, y: 660 }
    ],
    detail: false
  },
  // Abstract landmass 10
  {
    points: [
      { x: 700, y: 120 }, { x: 740, y: 100 }, { x: 780, y: 120 }, { x: 770, y: 240 },
      { x: 730, y: 230 }, { x: 700, y: 180 }
    ],
    detail: false
  },
]

function subdividePoints(points: {x: number, y: number}[]) {
  const newPoints = [];
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const midX = (p1.x + p2.x) / 2 + (Math.random() * 40 - 20);
    const midY = (p1.y + p2.y) / 2 + (Math.random() * 40 - 20);
    newPoints.push(p1);
    newPoints.push({ x: midX, y: midY });
  }
  return newPoints;
}

const subdividedContinents = continents.map(continent => ({
  ...continent,
  points: subdividePoints(subdividePoints(continent.points))
}))

function createEnhancedWorldMapTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext("2d")!

  // Cyberpunk background: dark purple gradient
  const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  bgGradient.addColorStop(0, "#301934")
  bgGradient.addColorStop(0.3, "#4b0082")
  bgGradient.addColorStop(0.7, "#301934")
  bgGradient.addColorStop(1, "#4b0082")
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  subdividedContinents.forEach((continent) => {
    // Fill with dark purple cyberpunk base
    ctx.beginPath()
    ctx.moveTo(continent.points[0].x, continent.points[0].y)
    continent.points.forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fillStyle = "#301934"
    ctx.fill()

    if (continent.detail) {
      // Abstract patterns inside: random lines and circles for circuit feel
      const minX = Math.min(...continent.points.map(p => p.x))
      const maxX = Math.max(...continent.points.map(p => p.x))
      const minY = Math.min(...continent.points.map(p => p.y))
      const maxY = Math.max(...continent.points.map(p => p.y))
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2

      // Concentric circles
      ctx.strokeStyle = "#da70d620"
      ctx.lineWidth = 1.5
      for (let r = 10; r < Math.min(maxX - minX, maxY - minY) / 2; r += 15) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Random radial lines
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2
        const length = Math.random() * 50 + 20
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(centerX + Math.cos(angle) * length, centerY + Math.sin(angle) * length)
        ctx.stroke()
      }

      // Add random "node" neon dots
      for (let i = 0; i < 8; i++) {
        const rx = minX + Math.random() * (maxX - minX)
        const ry = minY + Math.random() * (maxY - minY)
        ctx.fillStyle = "#da70d6"
        ctx.fillRect(rx, ry, 3, 3)
        // Glow effect
        ctx.beginPath()
        ctx.arc(rx + 1.5, ry + 1.5, 6, 0, Math.PI * 2)
        ctx.fillStyle = "#da70d620"
        ctx.fill()
      }
    }

    // Sharp neon borders with glow
    ctx.strokeStyle = "#8b5cf6"
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(continent.points[0].x, continent.points[0].y)
    continent.points.forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.stroke()

    // Outer glow simulation
    ctx.lineWidth = 5
    ctx.strokeStyle = "#8b5cf630"
    ctx.stroke()
  })

  // Global abstract grid: irregular lines
  ctx.strokeStyle = "#4b008250"
  ctx.lineWidth = 0.8
  for (let i = 0; i < canvas.width; i += 60 + Math.random() * 20) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, canvas.height)
    ctx.stroke()
  }
  for (let i = 0; i < canvas.height; i += 60 + Math.random() * 20) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(canvas.width, i)
    ctx.stroke()
  }

  // Pixel noise for glitchy cyberpunk feel
  for (let i = 0; i < canvas.width; i += 15) {
    for (let j = 0; j < canvas.height; j += 15) {
      if (Math.random() > 0.7) {
        ctx.fillStyle = "#da70d620"
        ctx.fillRect(i, j, 3, 3)
      }
    }
  }

  // Add horizontal scan lines for CRT effect
  ctx.strokeStyle = "#8b5cf630"
  ctx.lineWidth = 1
  for (let i = 0; i < canvas.height; i += 5) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(canvas.width, i)
    ctx.stroke()
  }

  return new THREE.CanvasTexture(canvas)
}

function createBumpMapTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#000000" // Low height for "oceans"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  subdividedContinents.forEach((continent) => {
    ctx.beginPath()
    ctx.moveTo(continent.points[0].x, continent.points[0].y)
    continent.points.forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fillStyle = "#808080" // Higher height for landmasses
    ctx.fill()
  })

  // Add noise for terrain realism
  for (let i = 0; i < canvas.width; i += 8) {
    for (let j = 0; j < canvas.height; j += 8) {
      const gray = Math.floor(Math.random() * 50 + 50)
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`
      ctx.fillRect(i, j, 8, 8)
    }
  }

  return new THREE.CanvasTexture(canvas)
}

function createSpecularMapTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#000000" // Shiny (low roughness) for "oceans"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  subdividedContinents.forEach((continent) => {
    ctx.beginPath()
    ctx.moveTo(continent.points[0].x, continent.points[0].y)
    continent.points.forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fillStyle = "#ffffff" // Rough for landmasses
    ctx.fill()
  })

  return new THREE.CanvasTexture(canvas)
}

function createCloudTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Generate abstract cloud blobs
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const radius = Math.random() * 80 + 40
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
    grad.addColorStop(0, "rgba(255,255,255,0.5)")
    grad.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  return new THREE.CanvasTexture(canvas)
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const globeRef = useRef<THREE.Mesh | null>(null)
  const glowMeshRef = useRef<THREE.Mesh | null>(null)
  const cloudsRef = useRef<THREE.Mesh | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const loadTimer = setTimeout(() => setIsLoaded(true), 100)

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 2.6
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    containerRef.current.appendChild(renderer.domElement)

    const geometry = new THREE.SphereGeometry(1.5, 128, 128)
    const mapTexture = createEnhancedWorldMapTexture()
    const bumpTexture = createBumpMapTexture()
    const specularTexture = createSpecularMapTexture()
    const material = new THREE.MeshStandardMaterial({
      map: mapTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.05,
      roughnessMap: specularTexture,
      roughness: 1.0,
      metalness: 0.0,
      emissive: 0x4b0082,
      emissiveIntensity: 0.8,
    })

    const globe = new THREE.Mesh(geometry, material)
    scene.add(globe)
    globeRef.current = globe

    // Add clouds for realism
    const cloudsGeometry = new THREE.SphereGeometry(1.51, 128, 128)
    const cloudsTexture = createCloudTexture()
    const cloudsMaterial = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial)
    scene.add(clouds)
    cloudsRef.current = clouds

    const glowGeometry = new THREE.SphereGeometry(1.55, 128, 128)
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0,
      roughness: 1,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.15,
    })
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    scene.add(glowMesh)
    glowMeshRef.current = glowMesh

    // Enhanced lighting for dramatic cyberpunk shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
    mainLight.position.set(4, 3, 6)
    mainLight.castShadow = true
    scene.add(mainLight)

    const rimLight = new THREE.DirectionalLight(0x8b5cf6, 0.6)
    rimLight.position.set(-6, 2, -8)
    scene.add(rimLight)

    const fillLight = new THREE.DirectionalLight(0xda70d6, 0.7)
    fillLight.position.set(-3, -2, -5)
    scene.add(fillLight)

    const ambientLight = new THREE.AmbientLight(0x4b0082, 1.0)
    scene.add(ambientLight)

    let glowIntensity = 0.2
    let glowDirection = 1

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      if (globeRef.current) {
        globeRef.current.rotation.y += 0.001 // Increased rotation speed for more noticeable rotation
        globeRef.current.rotation.x = 0.35 + Math.sin(Date.now() * 0.0005) * 0.05 // Slight oscillation for dynamism
      }
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += 0.0012 // Slightly different speed for clouds
        cloudsRef.current.rotation.x = 0.35 + Math.sin(Date.now() * 0.0005) * 0.05
      }
      if (glowMeshRef.current) {
        glowMeshRef.current.rotation.y += 0.001
        glowMeshRef.current.rotation.x = 0.35 + Math.sin(Date.now() * 0.0005) * 0.05
        glowIntensity += 0.006 * glowDirection
        if (glowIntensity > 0.4) glowDirection = -1
        if (glowIntensity < 0.15) glowDirection = 1;
        (glowMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glowIntensity
      }
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      clearTimeout(loadTimer)
      window.removeEventListener("resize", handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      cloudsGeometry.dispose()
      cloudsMaterial.dispose()
      glowGeometry.dispose()
      glowMaterial.dispose()
      mapTexture.dispose()
      bumpTexture.dispose()
      specularTexture.dispose()
      cloudsTexture.dispose()
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#001f3f]">
      {/* Three.js Globe Background */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Atmospheric Overlay Layer - Enhanced for cyberpunk with more neon bleeds and scan lines */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#001f3f]/30 via-[#4b0082]/20 to-[#001f3f]/50" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/3 w-full h-96 bg-gradient-to-b from-[#8b5cf6]/20 via-[#da70d6]/10 to-transparent blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#da70d6]/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-[#8b5cf6]/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#da70d6]/10 rounded-full blur-3xl" />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(0, 31, 63, 0.5) 100%)",
          }}
        />
        {/* Scan lines overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, #8b5cf610 3px, #8b5cf610 4px)",
          }}
        />
      </div>

      {/* Content - Main Hero Section */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
        {/* Logo Section */}
        <div
          className={`mb-8 transition-all duration-1000 ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
          style={{
            animation: isLoaded ? "fadeInDown 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "none",
          }}
        >
          <div
            className="relative w-40 h-40 drop-shadow-lg hover:scale-105 transition-transform duration-500"
            style={{
              filter: "drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))", // Purple neon glow
            }}
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector-kRx849EE58OjJ5cwJZcPEKsr58ZtCx.png"
              alt="Identiq Logo"
              className="object-contain w-full h-full"
            />
          </div>
        </div>

        {/* Main Title - Sharper font styling with neon glow */}
        <h1
          className={`text-6xl md:text-7xl lg:text-8xl font-bold tracking-widest text-white drop-shadow-lg text-balance text-center transition-all duration-1000 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            animation: isLoaded ? "fadeInUp 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards" : "none",
            letterSpacing: "0.2em",
            textShadow: "0 0 15px #8b5cf6, 0 0 30px #8b5cf650", // Purple neon glow
          }}
        >
          IDENTIQ
        </h1>

        {/* Subtitle */}
        <p
          className={`mt-6 text-xs md:text-sm text-[#da70d6] tracking-widest uppercase font-medium transition-all duration-1000 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            animation: isLoaded ? "fadeInUp 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s forwards" : "none",
            letterSpacing: "0.2em",
            textShadow: "0 0 10px #8b5cf650", // Purple glow
          }}
        >
          Securing Identity, Globally
        </p>

        {/* Accent Line - Neon gradient */}
        <div
          className={`mt-10 h-px w-32 bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent transition-all duration-1000 ${
            isLoaded ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
          }`}
          style={{
            animation: isLoaded ? "fadeInUp 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards" : "none",
            transformOrigin: "center",
            boxShadow: "0 0 10px #8b5cf6",
          }}
        />

        {/* CTA Button - Cyberpunk style with sharp borders and hover glitch */}
        <button
          className={`mt-10 px-8 py-3 text-sm tracking-widest uppercase font-medium border-2 border-[#8b5cf6]/60 text-[#da70d6] hover:text-white hover:border-[#8b5cf6] hover:bg-[#4b0082]/10 transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_15px_#8b5cf6] animate-button-pulse ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            animation: isLoaded ? "fadeInUp 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 1s forwards" : "none",
          }}
        >
          Explore
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes button-pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 5px #8b5cf6;
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 15px #8b5cf6;
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 5px #8b5cf6;
          }
        }
        .animate-button-pulse {
          animation: button-pulse 2s infinite ease-in-out;
        }
      `}</style>
    </main>
  )
}