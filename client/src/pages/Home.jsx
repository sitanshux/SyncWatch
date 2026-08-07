import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import SyncWatchLogo from '../components/SyncWatchLogo';

gsap.registerPlugin(ScrollTrigger);

/* ─── Minimal Architectural Icons ────────────────────────────────────────── */
const IconArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconLock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
    <rect x="3" y="11" width="18" height="11" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const IconFacebook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const IconGithub = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function Home() {
  const containerRef = useRef(null);
  const bgRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    /* ─── 1. Guarantee all animated elements start VISIBLE ────────────────
       This runs synchronously before GSAP reads scroll position, ensuring
       no element is ever invisible on first paint or rapid scroll. GSAP will
       only animate transforms/opacity FROM these visible states.           */
    const ensureVisible = () => {
      const targets = [
        '#hero-title-watch',
        '#hero-title-together',
        '#hero-box-from',
        '#hero-ctas',
        '#hero-footer-bar',
        '#asm-shell',
        '#asm-video',
        '#asm-sidebar',
        '#asm-controls-bar',
        '#asm-status-bar',
      ];
      targets.forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.visibility = 'visible';
        }
      });
      document.querySelectorAll('.editorial-panel .matte-panel').forEach((el) => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
      });
      document.querySelectorAll('.fade-up-item').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
      });
      document.querySelectorAll('.grid-card').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
      });
    };
    ensureVisible();

    /* ─── 2. Lenis Smooth Scroll Engine (Desktop Only for 120Hz Mobile Scroll) ── */
    const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0);

    let lenis = null;
    let tickerCb = null;

    if (!isMobile) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 0,
        infinite: false,
      });

      tickerCb = (time) => {
        if (lenis) lenis.raf(time * 1000);
        ScrollTrigger.update();
      };
      gsap.ticker.add(tickerCb);
    }

    /* Soft lag smoothing prevents sudden frame jump stutter on main thread delays */
    gsap.ticker.lagSmoothing(500, 33);

    /* ─── 3. Defer GSAP context until after first browser paint ───────── */
    let ctx;
    const rafId = requestAnimationFrame(() => {
      ctx = gsap.context(() => {

        /* ── Hero Entrance ────────────────────────────────────────────── */
        const heroTl = gsap.timeline({
          defaults: { ease: 'power2.out', force3D: true },
        });

        /* Use 'gsap.set' first so GSAP knows the start state without
           visually hiding the element before scroll check.             */
        gsap.set('#hero-title-watch', { y: 60, opacity: 0 });
        gsap.set('#hero-title-together', { y: 80, opacity: 0 });
        gsap.set('#hero-box-from', { x: 50, opacity: 0 });
        gsap.set(['#hero-ctas', '#hero-footer-bar'], { y: 25, opacity: 0 });

        heroTl
          .to('#hero-title-watch', { y: 0, opacity: 1, duration: 1.6 }, 0.05)
          .to('#hero-title-together', { y: 0, opacity: 1, duration: 1.8 }, 0.25)
          .to('#hero-box-from', { x: 0, opacity: 1, duration: 1.5 }, 0.45)
          .to(['#hero-ctas', '#hero-footer-bar'],
            { y: 0, opacity: 1, duration: 1.3, stagger: 0.18 }, 0.7);

        /* ── Editorial Panels: parallax only, no opacity control ──────── */
        const panels = gsap.utils.toArray('.editorial-panel');

        panels.forEach((panel) => {
          const card = panel.querySelector('.matte-panel');
          const items = panel.querySelectorAll('.fade-up-item');

          if (!card) return;

          /* Subtle card parallax — skip on mobile for 60fps performance */
          if (!isMobile) {
            gsap.fromTo(card,
              { y: 24, force3D: true },
              {
                y: -24,
                ease: 'none',
                force3D: true,
                scrollTrigger: {
                  trigger: panel,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1.2,
                  invalidateOnRefresh: true,
                },
              }
            );
          }

          /* Fade-in items: smooth slow trigger on desktop, instant on mobile */
          if (items.length) {
            gsap.set(items, { opacity: 0, y: 24, force3D: true });
            gsap.to(items, {
              opacity: 1,
              y: 0,
              duration: isMobile ? 0.8 : 1.8,
              stagger: isMobile ? 0.12 : 0.22,
              ease: 'power2.out',
              force3D: true,
              scrollTrigger: {
                trigger: panel,
                start: 'top 85%',
                end: 'top 35%',
                scrub: isMobile ? false : 2.2,
                toggleActions: isMobile ? 'play none none none' : undefined,
                invalidateOnRefresh: true,
              },
            });
          }
        });

        /* ── Background Parallax — skip heavy filter recalculation on mobile ── */
        if (bgRef.current && !isMobile) {
          gsap.to(bgRef.current, {
            yPercent: 12,
            ease: 'none',
            force3D: true,
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 2,
              invalidateOnRefresh: true,
            },
          });
        }

        /* ── Room Assembly Sequence ───────────────────────────────────── */
        /* Pre-set to visible so rapid scroll never causes blank preview */
        gsap.set(['#asm-shell', '#asm-video', '#asm-sidebar',
          '#asm-controls-bar', '#asm-status-bar'], {
          opacity: 1,
          clearProps: 'transform',
          force3D: true,
        });

        const assemblyTl = gsap.timeline({
          scrollTrigger: {
            trigger: '#room-assembly-section',
            start: 'top top',
            end: '+=160%',
            pin: true,
            scrub: 1.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        /* Animate FROM off-screen TO final, so if scrub is mid-scroll
           content is partially visible — never fully blank.           */
        assemblyTl
          .from('#asm-shell',
            { scale: 0.94, opacity: 0, y: 32, ease: 'power2.out', duration: 0.7 })
          .from('#asm-video',
            { scale: 0.97, opacity: 0, duration: 0.65 }, '-=0.25')
          .from('#asm-sidebar',
            { x: 36, opacity: 0, duration: 0.65 }, '-=0.35')
          .from('#asm-chat-items > div',
            { y: 12, opacity: 0, duration: 0.5, stagger: 0.12 }, '-=0.25')
          .from(['#asm-controls-bar', '#asm-status-bar'],
            { y: 16, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.2');

        /* ── Final Feature Grid ───────────────────────────────────────── */
        const gridCards = gsap.utils.toArray('#final-grid-container .grid-card');
        if (gridCards.length) {
          gsap.from(gridCards, {
            y: 40,
            opacity: 0,
            scale: 0.97,
            duration: 0.7,
            stagger: 0.08,
            ease: 'power2.out',
            force3D: true,
            clearProps: 'all',
            scrollTrigger: {
              trigger: '#final-grid-section',
              start: 'top 80%',
              end: 'top 35%',
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          });
        }

      }, containerRef);
    }); // end rAF

    return () => {
      cancelAnimationFrame(rafId);
      if (ctx) ctx.revert();
      if (tickerCb) gsap.ticker.remove(tickerCb);
      if (lenis) lenis.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative bg-[#08080A] text-[#F3F3F5] min-h-screen font-sans selection:bg-[#C5A059]/30 selection:text-white w-full overflow-x-hidden">
      {/* Film Grain Texture */}
      <div className="film-grain" />

      {/* ─── Persistent Architectural Background Image (~70% visible) ──── */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div
          ref={bgRef}
          className="absolute top-[-10%] left-[-5%] w-[110%] h-[120%] bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url('/hero-bg-photo3.png')`,
            filter: 'brightness(0.7) contrast(1.08)',
          }}
        />
        {/* Subtle Dark Matte Architectural Framing Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080A]/80 via-transparent to-[#08080A]/90 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(8,8,10,0.85)_100%)] pointer-events-none" />
      </div>

      {/* ─── Minimal Floating Matte Navbar ───────────────────────────── */}
      <header
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-12 border-b border-white/[0.08] bg-[#08080A]/70 backdrop-blur-xl"
      >
        <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
          <SyncWatchLogo iconSize={24} />
        </Link>

        {/* Center Nav Links — hidden on mobile */}
        <nav className="hidden lg:flex items-center gap-8 font-grotesk text-xs font-medium tracking-[0.2em] uppercase text-[#A1A1A6]">
          <a href="#editorial-panels" className="hover:text-white transition-colors duration-200">Architecture</a>
          <a href="#room-assembly-section" className="hover:text-white transition-colors duration-200">Product Build</a>
          <a href="#final-grid-section" className="hover:text-white transition-colors duration-200">Capabilities</a>
          <a href="#final-cta-section" className="hover:text-white transition-colors duration-200">Overview</a>
        </nav>

        {/* Right Action Buttons — condensed on mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/join"
            className="hidden sm:inline-flex px-4 py-2 font-grotesk text-xs font-semibold uppercase tracking-widest text-[#F3F3F5] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] transition-colors duration-200 items-center"
          >
            Join Room
          </Link>
          <Link
            to="/create"
            className="px-4 sm:px-5 py-2 font-grotesk text-xs font-semibold uppercase tracking-widest text-black bg-[#F3F3F5] hover:bg-white transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 border border-white"
          >
            <span className="hidden sm:inline">Create Room</span>
            <span className="sm:hidden">Create</span>
            <IconArrowRight />
          </Link>
        </div>
      </header>

      {/* ─── Hero Keynote Section (Asymmetrical Composition) ──────────── */}
      <section className="relative min-h-[100vh] w-full flex flex-col justify-between pt-24 sm:pt-28 pb-12 sm:pb-20 px-4 sm:px-12 max-w-7xl mx-auto z-10 mb-0">
        {/* Asymmetrical Top Layout */}
        <div className="w-full flex justify-between items-start pt-4 sm:pt-6">
          <div className="hidden sm:block font-mono text-[11px] text-[#6E6E73] tracking-[0.25em] uppercase">
            Movie watching platform for groups
          </div>

          {/* Upper Right "FROM ANYWHERE" Asymmetrical Editorial Box */}
          <div id="hero-box-from" className="matte-panel p-4 sm:p-8 border border-white/[0.1] relative ml-auto">
            <span className="absolute top-2 left-2 corner-mark">┌</span>
            <span className="absolute top-2 right-2 corner-mark">┐</span>
            <span className="absolute bottom-2 left-2 corner-mark">└</span>
            <span className="absolute bottom-2 right-2 corner-mark">┘</span>

            <div className="flex flex-col text-right">
              <span className="font-serif italic text-xl sm:text-4xl text-[#A1A1A6] font-normal tracking-wide">
                From
              </span>
              <span className="font-display font-extrabold text-2xl sm:text-5xl lg:text-6xl tracking-tight text-white uppercase mt-1">
                Anywhere
              </span>
            </div>

            <div className="mt-3 sm:mt-4 pt-3 border-t border-white/[0.08] font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-[#6E6E73] text-right space-y-1">
              <div className="hidden sm:block">ZERO LATENCY DISTRIBUTED SYNC</div>
              <div>CRYPTOGRAPHIC ACCESS</div>
            </div>
          </div>
        </div>

        {/* Hero Upper-Left Large Title: "WATCH TOGETHER" */}
        <div className="my-auto py-8 sm:py-16 max-w-5xl w-full pr-8 sm:pr-32 lg:pr-56 xl:pr-72">
          <h1 className="flex flex-col font-display font-extrabold tracking-tight text-[#F3F3F5] select-none text-[2.1rem] min-[360px]:text-[2.45rem] min-[400px]:text-[2.8rem] sm:text-6xl md:text-7xl lg:text-[7.5rem] xl:text-[8.5rem] leading-[0.88] uppercase overflow-visible">
            <span id="hero-title-watch" className="block text-white max-w-full">
              WATCH
            </span>
            <span id="hero-title-together" className="block text-[#C5A059] font-extrabold mt-1.5 sm:mt-4 pr-12 sm:pr-40 lg:pr-64 xl:pr-80 max-w-full">
              TOGETHER
            </span>
          </h1>

          <p className="mt-6 sm:mt-8 font-serif text-base sm:text-2xl text-[#A1A1A6] italic max-w-xl font-normal leading-relaxed">
            "A luxury real time theater crafted for precision synchronization, uncompressed streaming, and friction free connection."
          </p>

          {/* Minimal CTAs with Sharp Corners */}
          <div id="hero-ctas" className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              to="/create"
              className="h-12 sm:h-13 px-6 sm:px-8 inline-flex items-center justify-center font-grotesk text-xs font-bold tracking-[0.2em] uppercase text-black bg-[#F3F3F5] hover:bg-white transition-all duration-200 border border-white group"
            >
              <span>CREATE ROOM</span>
              <span className="ml-2 sm:ml-3 transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>

            <Link
              to="/join"
              className="h-12 sm:h-13 px-6 sm:px-8 inline-flex items-center justify-center font-grotesk text-xs font-bold tracking-[0.2em] uppercase text-white bg-[#08080A]/80 hover:bg-[#121215] border border-white/[0.15] transition-all duration-200"
            >
              <span>JOIN ROOM</span>
            </Link>
          </div>
        </div>

        {/* Hero Footer Bar */}
        <div id="hero-footer-bar" className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 pt-6 border-t border-white/[0.08] z-10">
          <div className="flex items-center gap-3 font-mono text-[10px] sm:text-[11px] text-[#6E6E73] tracking-[0.2em] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse flex-shrink-0" />
            <span>SHARED CINEMATIC CANVAS</span>
          </div>

          <div className="hidden sm:flex items-center gap-8 font-mono text-[11px] text-[#A1A1A6] tracking-[0.15em] uppercase">
            <span>[ 01 ] SYNCHRONIZATION</span>
            <span>[ 02 ] MEDIA PIPELINE</span>
            <span>[ 03 ] HOST COMMAND</span>
          </div>
        </div>
      </section>

      {/* ─── Full-Screen Overlay Editorial Pages (Single Message per Page) ─ */}
      <section id="editorial-panels" className="relative z-20 pt-12 sm:pt-20">
        {[
          {
            num: '01',
            tag: 'REAL-TIME SYNCHRONIZATION',
            title: 'Sub-millisecond Precision Engine',
            serifQuote: 'Every play, pause, and seek action mirrors instantly across all connected screens.',
            desc: 'Powered by socket state broadcasting and drift auto-correction. Experience true frame-accurate unison with zero buffering loops or video desynchronization.',
          },
          {
            num: '02',
            tag: 'UNIVERSAL STREAMING',
            title: 'Native Uncompressed Media Pipeline',
            serifQuote: 'Stream YouTube, Google Drive, and raw HTML5 video formats without quality loss.',
            desc: 'Direct proxy stream forwarding bypasses browser CORS restrictions and virus warning blocks, keeping video playback pristine and high definition.',
          },
          {
            num: '03',
            tag: 'HOST AUTHORITY',
            title: 'Granular Room Governance',
            serifQuote: 'Full executive command over playback rights, member queueing, and room access.',
            desc: 'Retain exclusive control over video operations or grant temporary playback privileges to room participants with a single tap.',
          },
          {
            num: '04',
            tag: 'INSTANT INVITE',
            title: 'Zero-Friction Access Model',
            serifQuote: 'No account creation. No mandatory application downloads.',
            desc: 'Generate a secure, randomized room key or direct URL invite. Invite your inner circle and start watching together in less than three seconds.',
          },
          {
            num: '05',
            tag: 'CROSS-PLATFORM HARMONY',
            title: 'Architected for Every Display',
            serifQuote: 'Flawless responsive performance across desktop monitors, laptops, and tablets.',
            desc: 'Built with GPU-accelerated rendering and lightweight state machines to maintain 60FPS fluid motion on any modern web browser.',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="editorial-panel w-full flex items-center justify-center px-4 sm:px-12 mb-16 sm:mb-24 last:mb-0"
          >
            <div className="matte-panel p-6 sm:p-12 lg:p-20 max-w-4xl w-full border border-white/[0.1] relative shadow-2xl">
              <span className="absolute top-3 left-3 sm:top-4 sm:left-4 corner-mark fade-up-item">┌</span>
              <span className="absolute top-3 right-3 sm:top-4 sm:right-4 corner-mark fade-up-item">┐</span>
              <span className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 corner-mark fade-up-item">└</span>
              <span className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 corner-mark fade-up-item">┘</span>

              <div className="font-mono text-[10px] sm:text-xs text-[#C5A059] tracking-[0.25em] uppercase mb-3 sm:mb-4 fade-up-item">
                {item.num} &nbsp; {item.tag}
              </div>

              <h2 className="font-display text-2xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-white uppercase mb-4 sm:mb-6 leading-none fade-up-item">
                {item.title}
              </h2>

              <p className="font-serif italic text-lg sm:text-2xl lg:text-3xl text-[#F3F3F5] mb-4 sm:mb-6 font-normal leading-relaxed border-l-2 border-[#C5A059] pl-4 sm:pl-6 fade-up-item">
                "{item.serifQuote}"
              </p>

              <p className="font-sans text-sm text-[#A1A1A6] leading-relaxed max-w-2xl font-normal fade-up-item">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ─── Room Preview Step-by-Step Assembly Section ────────────────── */}
      <section id="room-assembly-section" className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-8 z-30 bg-[#08080A] mt-16 sm:mt-24 overflow-hidden">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="font-mono text-xs text-[#C5A059] tracking-[0.3em] uppercase">
              PRECISION ENGINEERING
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase">
              Architectural Room Interface
            </h2>
          </div>

          {/* Assembly Container */}
          <div id="asm-shell" className="matte-panel-dark p-6 sm:p-8 border border-white/[0.1] overflow-hidden">
            {/* Top Bar Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-4">
                <SyncWatchLogo iconSize={24} />
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-white">
                  <span>ROOM: KINEMA_01</span>
                  <IconLock />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] border border-white/[0.1] font-mono text-xs text-[#F3F3F5]">
                  <IconLink />
                  <span>INVITE LINK</span>
                </div>
                <div className="font-mono text-xs px-3 py-1.5 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
                  HOST MODE
                </div>
              </div>
            </div>

            {/* Assembling Content Grid */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player Shell */}
              <div id="asm-video" className="lg:col-span-2 aspect-video bg-[#040405] border border-white/[0.1] relative overflow-hidden flex flex-col justify-between p-6">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-60"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop')`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-transparent to-[#08080A]/40" />

                <div className="relative z-10 flex justify-between items-center font-mono text-xs text-white">
                  <span className="px-2.5 py-1 bg-black/60 border border-white/20">1080P PROXY STREAM</span>
                  <span className="px-2.5 py-1 bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059]">SYNCED: 0.0ms</span>
                </div>

                {/* Player Controls Bar */}
                <div id="asm-controls-bar" className="relative z-10 space-y-3">
                  <div className="w-full h-1 bg-white/20 overflow-hidden cursor-pointer">
                    <div className="h-full w-[62%] bg-[#C5A059]" />
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-white">
                    <div className="flex items-center gap-4">
                      <button className="text-white hover:text-[#C5A059]"><IconPlay /></button>
                      <span>01:14:20 / 02:28:45</span>
                    </div>
                    <span>DIRECT STREAM PIPELINE</span>
                  </div>
                </div>
              </div>

              {/* Sidebar: Chat & Members */}
              <div id="asm-sidebar" className="flex flex-col gap-4">
                <div className="bg-[#0D0D10] border border-white/[0.08] p-5 flex-1 space-y-4">
                  <div className="font-mono text-xs text-[#A1A1A6] uppercase tracking-wider flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <span>ROOM CHAT</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  <div id="asm-chat-items" className="space-y-3 font-sans text-xs">
                    <div className="bg-white/[0.03] p-3 border border-white/[0.05]">
                      <span className="font-mono font-bold text-[#C5A059]">ALEX: </span>
                      <span className="text-[#F3F3F5]">Color grading on this master is unreal.</span>
                    </div>
                    <div className="bg-white/[0.03] p-3 border border-white/[0.05]">
                      <span className="font-mono font-bold text-white">JORDAN: </span>
                      <span className="text-[#F3F3F5]">Audio is in perfect sync on my side.</span>
                    </div>
                    <div className="bg-[#C5A059]/10 p-3 border border-[#C5A059]/20">
                      <span className="font-mono font-bold text-[#C5A059]">YOU (HOST): </span>
                      <span className="text-[#F3F3F5]">Enjoying the screening everyone.</span>
                    </div>
                  </div>
                </div>

                <div id="asm-status-bar" className="bg-[#0D0D10] border border-white/[0.08] p-4 flex items-center justify-between font-mono text-xs text-[#A1A1A6]">
                  <span>MEMBERS: 4 CONNECTED</span>
                  <span className="text-emerald-400">● LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final Reorganized Feature Grid ─────────────────────────────── */}
      <section id="final-grid-section" className="relative py-32 w-full z-30 bg-[#08080A] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="text-center mb-16 space-y-3">
            <span className="font-mono text-xs text-[#C5A059] tracking-[0.3em] uppercase">
              COMPLETE ARCHITECTURE
            </span>
            <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white uppercase">
              System Capabilities
            </h2>
          </div>

          <div id="final-grid-container" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { tag: '01', title: 'Sub-Millisecond Sync', desc: 'Real-time clock synchronization engine prevents audio drift and video lag across global networks.' },
              { tag: '02', title: 'Universal Proxy Pipeline', desc: 'Native streaming support for YouTube, Google Drive, and direct raw MP4/WebM video links.' },
              { tag: '03', title: 'Host Authority Governance', desc: 'Granular permissions allow hosts to restrict playback or grant temporary control to participants.' },
              { tag: '04', title: 'Instant Cryptographic Links', desc: 'Generate 8-character secure room codes and direct share links with optional password protection.' },
              { tag: '05', title: 'Persistent Queue System', desc: 'Add, reorder, skip, and auto-play queued videos with live synchronized updates for all members.' },
              { tag: '06', title: 'Lightweight & Responsive', desc: 'Engineered for smooth 60FPS execution on macOS, Windows, Linux, tablets, and mobile devices.' },
            ].map((card, i) => (
              <div key={i} className="grid-card matte-panel p-8 border border-white/[0.08] flex flex-col justify-between space-y-6 hover:border-[#C5A059]/40 transition-colors duration-300">
                <div className="font-mono text-xs text-[#C5A059] tracking-widest uppercase">
                  CAPABILITY &nbsp; {card.tag}
                </div>
                <div>
                  <h3 className="font-grotesk text-xl font-bold text-white uppercase tracking-tight mb-3">
                    {card.title}
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-[#A1A1A6] leading-relaxed">
                    {card.desc}
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.06] font-mono text-[10px] text-[#6E6E73] tracking-widest uppercase">
                  FEATURE READY
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final Editorial CTA & Footer Section ──────────────────────── */}
      <section id="final-cta-section" className="relative py-36 w-full text-center z-30 bg-[#08080A] overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="matte-panel-dark p-12 sm:p-24 border border-white/[0.1] space-y-8 relative overflow-hidden">
            <span className="font-mono text-xs text-[#C5A059] tracking-[0.3em] uppercase">
              READY TO BEGIN?
            </span>

            <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white uppercase leading-none">
              ENTER THE THEATER
            </h2>

            <p className="font-serif italic text-xl sm:text-2xl text-[#A1A1A6] font-normal max-w-xl mx-auto">
              "Experience synchronized theater streaming built with precision craftsmanship."
            </p>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/create"
                className="h-14 px-10 inline-flex items-center justify-center font-grotesk text-xs font-bold tracking-[0.2em] uppercase text-black bg-[#F3F3F5] hover:bg-white border border-white transition-all duration-200 group"
              >
                <span>CREATE ROOM NOW</span>
                <span className="ml-3 transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>

              <Link
                to="/join"
                className="h-14 px-10 inline-flex items-center justify-center font-grotesk text-xs font-bold tracking-[0.2em] uppercase text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.15] transition-all duration-200"
              >
                <span>JOIN WITH CODE</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Premium Full-Width Matte Black Luxury Footer ───────────────── */}
      <footer className="w-full bg-[#050507] border-t border-white/[0.08] relative z-30 pt-20 pb-12 px-6 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Top Section: Brand + Navigation + Legal + Social */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-white/[0.08]">
            {/* Col 1 & 2: Brand Statement */}
            <div className="lg:col-span-2 space-y-6">
              <SyncWatchLogo iconSize={28} />
              <p className="font-sans text-xs text-[#A1A1A6] leading-relaxed max-w-sm">
                SyncWatch is an editorial real-time theater platform built for precision sub-millisecond clock synchronization, native uncompressed media streaming, and friction-free watch party governance.
              </p>
              <div className="flex items-center gap-3 font-mono text-[11px] text-[#6E6E73] tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SYSTEM STATUS: OPERATIONAL</span>
              </div>
            </div>

            {/* Col 3: Navigation */}
            <div className="space-y-4">
              <h4 className="font-mono text-xs font-semibold text-[#C5A059] tracking-[0.2em] uppercase">
                NAVIGATION
              </h4>
              <ul className="space-y-2.5 font-grotesk text-xs text-[#A1A1A6]">
                <li>
                  <a href="#editorial-panels" className="hover:text-white transition-colors duration-200 block">
                    Architecture
                  </a>
                </li>
                <li>
                  <a href="#room-assembly-section" className="hover:text-white transition-colors duration-200 block">
                    Product Build
                  </a>
                </li>
                <li>
                  <a href="#final-grid-section" className="hover:text-white transition-colors duration-200 block">
                    Capabilities
                  </a>
                </li>
                <li>
                  <Link to="/create" className="hover:text-white transition-colors duration-200 block">
                    Create Room
                  </Link>
                </li>
                <li>
                  <Link to="/join" className="hover:text-white transition-colors duration-200 block">
                    Join Room
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Platform & Legal */}
            <div className="space-y-4">
              <h4 className="font-mono text-xs font-semibold text-[#C5A059] tracking-[0.2em] uppercase">
                PLATFORM
              </h4>
              <ul className="space-y-2.5 font-grotesk text-xs text-[#A1A1A6]">
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200 block">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200 block">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200 block">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200 block">
                    Security Overview
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 5: Social Connections */}
            <div className="space-y-4">
              <h4 className="font-mono text-xs font-semibold text-[#C5A059] tracking-[0.2em] uppercase">
                CONNECT
              </h4>
              <p className="font-sans text-xs text-[#6E6E73]">
                Follow our official releases & architecture updates.
              </p>
              <div className="flex items-center gap-3 pt-1">
                {[
                  { name: 'Instagram', icon: <IconInstagram />, href: 'https://instagram.com' },
                  { name: 'Facebook', icon: <IconFacebook />, href: 'https://facebook.com' },
                  { name: 'X', icon: <IconX />, href: 'https://x.com' },
                  { name: 'GitHub', icon: <IconGithub />, href: 'https://github.com' },
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.name}
                    className="w-10 h-10 flex items-center justify-center border border-white/[0.1] bg-white/[0.02] text-[#A1A1A6] hover:text-[#C5A059] hover:border-[#C5A059]/60 hover:bg-[#C5A059]/10 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Architectural Mark */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[#6E6E73]">
            <div className="flex items-center gap-2">
              <span className="corner-mark">┌</span>
              <span>© {new Date().getFullYear()} SYNCWATCH DIGITAL PRESENTATION. ALL RIGHTS RESERVED.</span>
            </div>

            <div className="flex items-center gap-6 uppercase tracking-widest text-[10px]">
              <a href="#" className="hover:text-white transition-colors">PRIVACY</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">TERMS</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">SECURITY</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
