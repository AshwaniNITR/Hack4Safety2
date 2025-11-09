"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// Types
interface MenuItem {
  name: string;
  href: string;
  dropdown?: DropdownItem[];
}

interface DropdownItem {
  name: string;
  href: string;
}

// Animation variants
const ANIMATIONS = {
  overlay: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  },
  menuContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
    exit: {
      opacity: 0,
      transition: { staggerChildren: 0.05, staggerDirection: -1 },
    },
  },
  menuItem: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
  },
  dropdown: {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: "auto",
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      height: 0,
      transition: { duration: 0.2 }
    },
  },
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    document.documentElement.classList.toggle("overflow-hidden", isOpen);
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => setIsOpen((v: boolean) => !v);
  const toggleDropdown = (itemName: string) => {
    setDropdownOpen(prev => prev === itemName ? null : itemName);
  };

  const menuItems: MenuItem[] = [
    { name: "Home", href: "/" },
    { name: "About", href: "#about" },
    { name: "Report Missing Person", href: "/report" },
    { 
      name: "Unidentified Cases", 
      href: "/unidentified",
      dropdown: [
        {
          name: "Unidentified Persons",
          href: "/unidentified"
        },
        {
          name: "Unidentified Bodies",
          href: "/unidentifiedbb"
        }
      ]
    },
    { 
      name: "Search with AI", 
      href: "/findai",
      dropdown: [
        {
          name: "Missing Bodies",
          href: "/findai"
        },
        {
          name: "Missing People",
          href: "/findai2"
        }
      ]
    },
    { name: "Dashboard", href: "/dashboard" },
  ];

  const handleMenuItemClick = (item: MenuItem) => {
    if (!item.dropdown) {
      setIsOpen(false);
    }
  };

  const handleDropdownItemClick = () => {
    setIsOpen(false);
    setDropdownOpen(null);
  };

  const renderMenuItem = (item: MenuItem, isMobile: boolean = false) => {
    if (item.dropdown) {
      if (isMobile) {
        // Mobile: Always expanded with blue line
        return (
          <div key={item.name} className="w-full">
            {/* Publications main item */}
            <motion.div
              variants={ANIMATIONS.menuItem}
              className="text-xl text-white py-2 px-4 rounded-lg"
            >
              {item.name}
            </motion.div>
            
            {/* Dropdown items with blue line */}
            <div className="ml-6 border-l-2 border-blue-400 pl-4 space-y-2 mt-2">
              {item.dropdown.map((dropdownItem: DropdownItem) => (
                <motion.a
                  key={dropdownItem.name}
                  href={dropdownItem.href}
                  onClick={handleDropdownItemClick}
                  className="block text-lg text-white/90 hover:text-blue-300 transition-colors py-2 px-4 rounded-lg hover:bg-white/5 relative"
                  variants={ANIMATIONS.menuItem}
                >
                  {dropdownItem.name}
                </motion.a>
              ))}
            </div>
          </div>
        );
      }

      // Desktop: Collapsible dropdown
      return (
        <div key={item.name} className="relative" ref={dropdownRef}>
          <button
            onClick={() => toggleDropdown(item.name)}
            className="text-xl md:text-2xl text-white hover:text-blue-300 transition-colors py-2 px-6 rounded-lg hover:bg-white/5 flex items-center gap-2"
          >
            {item.name}
            <motion.span
              animate={{ rotate: dropdownOpen === item.name ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm"
            >
              ▼
            </motion.span>
          </button>
          
          <AnimatePresence>
            {dropdownOpen === item.name && (
              <motion.div
                variants={ANIMATIONS.dropdown}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute left-0 top-full mt-1 bg-gray-800/90 backdrop-blur-sm rounded-lg overflow-hidden min-w-[200px] border-l-4 border-gray-800/90"
              >
                <div className="py-2">
                  {item.dropdown.map((dropdownItem: DropdownItem) => (
                    <a
                      key={dropdownItem.name}
                      href={dropdownItem.href}
                      onClick={handleDropdownItemClick}
                      className="block text-white hover:text-blue-300 transition-colors py-3 px-6 hover:bg-white/5 border-l-2 border-blue-400/50 ml-2"
                    >
                      {dropdownItem.name}
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <motion.a
        key={item.name}
        href={item.href}
        variants={ANIMATIONS.menuItem}
        className={`${isMobile ? 'text-xl text-white' : 'text-xl md:text-2xl text-white'} hover:text-blue-300 transition-colors py-2 px-4 rounded-lg hover:bg-white/5`}
        onClick={() => handleMenuItemClick(item)}
      >
        {item.name}
      </motion.a>
    );
  };

  return (
    <>
      {/* ---------------- MOBILE NAV ---------------- */}
      <nav className="md:hidden fixed top-0 left-0 w-full bg-white/20 z-[60] font-[orbitron]">
        <div className="flex justify-between items-center h-16 px-4">
          {/* Logo */}
          <Image src="/Vector.png" className="rounded-lg" alt="Logo" width={50} height={50} />

          {/* Hamburger / Cross button */}
          <button
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            className={`flex flex-col justify-center items-center w-12 h-12 rounded-full border border-blue-500/20 bg-blue-500/10 backdrop-blur-sm transition-all
              ${isOpen ? "fixed top-4 right-4 z-[70]" : "relative z-[60]"}`}
          >
            <span
              className={`block w-6 h-0.5 bg-blue-400 mb-1.5 transition-transform ${
                isOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-blue-400 transition-opacity ${
                isOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-blue-400 mt-1.5 transition-transform ${
                isOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>

        {/* Overlay + Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Dark overlay behind button */}
              <motion.div
                className="fixed inset-0 bg-gray-900/95 z-40"
                variants={ANIMATIONS.overlay}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => setIsOpen(false)}
              />
              {/* Menu layer */}
              <motion.div
                className="fixed inset-0 z-50 flex flex-col justify-center items-center"
                variants={ANIMATIONS.menuContainer}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div
                  className="flex flex-col items-start gap-4 px-6 w-full max-w-sm"
                  variants={ANIMATIONS.menuContainer}
                >
                  {menuItems.map((item) => renderMenuItem(item, true))}
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <div className="hidden md:block font-[orbitron]">
        <div
          className={`fixed top-0 left-0 h-screen w-20 flex flex-col justify-between items-center py-6 z-50 
          ${
            isOpen
              ? "bg-transparent"
              : "bg-white/10 backdrop-blur-lg border-r border-blue-400 shadow-xl"
          }`}
        >
          {/* Logo */}
          <Image src="/Identiq.jpg" className="rounded-lg" alt="Logo" width={50} height={50} />
          
          {/* Desktop hamburger */}
          {!isOpen && (
            <button
              onClick={toggleMenu}
              aria-label="Open menu"
              aria-expanded={isOpen}
              className="flex flex-col justify-center items-center w-12 h-12 rounded-full bg-blue-500/10 backdrop-blur-sm border border-blue-500/20"
            >
              <span className="block w-6 h-0.5 bg-blue-400 mb-1.5" />
              <span className="block w-6 h-0.5 bg-blue-400" />
              <span className="block w-6 h-0.5 bg-blue-400 mt-1.5" />
            </button>
          )}

          <div className="h-6" />
        </div>

        {/* Overlay + Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-40"
                variants={ANIMATIONS.overlay}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                className="fixed inset-0 z-50 flex flex-col justify-center items-center"
                variants={ANIMATIONS.menuContainer}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Desktop cross at top-right only */}
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  className="absolute top-6 right-6 text-4xl text-white z-[60] hover:text-blue-300 transition-colors"
                >
                  &times;
                </button>

                <motion.div
                  className="flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-6 max-w-4xl px-4 relative"
                  variants={ANIMATIONS.menuContainer}
                >
                  {menuItems.map((item) => renderMenuItem(item))}
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}