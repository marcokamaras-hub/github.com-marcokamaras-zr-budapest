import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const STORAGE_KEY = 'zr_pwa_prompted'

// ── Detection ────────────────────────────────────────────────────────────────

function detectEnv() {
  const ua = navigator.userAgent

  const isIOS     = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  const isMobile  = isIOS || isAndroid
  const isDesktop = !isMobile

  // Browser — order matters (most specific first)
  const isSamsung  = /SamsungBrowser/i.test(ua)
  const isEdge     = /Edg\//i.test(ua)
  const isOpera    = /OPR\//i.test(ua)
  const isFirefox  = /Firefox\/|FxiOS\//i.test(ua)
  const isCriOS    = /CriOS/i.test(ua)                          // Chrome on iOS
  const isChrome   = (/Chrome\//i.test(ua) || isCriOS) && !isEdge && !isOpera && !isSamsung
  const isSafari   = /Safari\//i.test(ua) && !isChrome && !isEdge && !isOpera && !isFirefox && !isSamsung

  const isIOSSafari   = isIOS && isSafari
  const isIOSOther    = isIOS && !isSafari          // Chrome/Firefox/Edge on iOS
  const isAndroidFF   = isAndroid && isFirefox
  const isDesktopSafari  = isDesktop && isSafari
  const isDesktopFirefox = isDesktop && isFirefox

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                    || !!window.navigator.standalone

  return {
    isIOS, isAndroid, isMobile, isDesktop,
    isChrome, isSafari, isEdge, isFirefox, isOpera, isSamsung,
    isIOSSafari, isIOSOther, isAndroidFF,
    isDesktopSafari, isDesktopFirefox,
    isStandalone,
  }
}

function resolveCase(env, hasDeferredPrompt) {
  if (env.isStandalone)        return 'installed'
  if (hasDeferredPrompt)       return 'prompt'        // Chrome/Edge/Opera/Samsung — Android & Desktop
  if (env.isIOSSafari)         return 'ios-safari'
  if (env.isIOSOther)          return 'ios-other'
  if (env.isAndroidFF)         return 'android-firefox'
  if (env.isDesktopSafari)     return 'desktop-safari'
  return 'unsupported'
}

// ── Visual cues ──────────────────────────────────────────────────────────────

// Bouncing down-arrow
function BounceArrow() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
      <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 12V2M8 2L3 7M8 2l5 5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </div>
  )
}

// iOS Safari bottom toolbar
function SafariToolbarVisual() {
  return (
    <div style={{ width: 220, margin: '10px auto 0' }}>
      <BounceArrow />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'6px 12px' }}>
        {/* back */}
        <Btn><svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></Btn>
        {/* forward */}
        <Btn><svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></Btn>
        {/* SHARE — highlighted */}
        <Btn highlight>
          <svg width="14" height="16" viewBox="0 0 14 16" fill="white"><path d="M7 0L3.5 3.5h2.25V10h2.5V3.5H10.5L7 0zM1 12.5V14h12v-1.5H1z"/></svg>
        </Btn>
        {/* bookmark */}
        <Btn><svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 1h8a1 1 0 011 1v9l-5-2.5L1 11V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/></svg></Btn>
        {/* tabs */}
        <Btn><svg width="14" height="14" viewBox="0 0 12 12" fill="none"><rect x="1" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="4" y="0" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/></svg></Btn>
      </div>
      <Label>SAFARI TOOLBAR</Label>
    </div>
  )
}

// Share sheet row
function ShareSheetRowVisual() {
  return (
    <div style={{ width: 220, margin: '10px auto 0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:12, padding:'8px 12px' }}>
        <div style={{ width:36, height:36, background:'rgba(255,255,255,0.15)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="3" stroke="white" strokeWidth="1.3"/><path d="M9 5v8M5 9h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <span style={{ fontSize:12, color:'white', flex:1 }}>Add to Home Screen</span>
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M1 1l6 5-6 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <Label>SHARE SHEET</Label>
    </div>
  )
}

// iOS Add confirmation
function AddConfirmVisual() {
  return (
    <div style={{ width: 220, margin: '10px auto 0' }}>
      <div style={{ border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Cancel</span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>Add to Home Screen</span>
          <motion.span animate={{ opacity:[1,0.45,1] }} transition={{ duration:1.4, repeat:Infinity }} style={{ fontSize:12, color:'#5AC8FA', fontWeight:600 }}>Add</motion.span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px' }}>
          <div style={{ width:40, height:40, background:'#2F4030', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:8, color:'rgba(255,255,255,0.6)', letterSpacing:'0.05em' }}>Z&R</span>
          </div>
          <div>
            <p style={{ fontSize:11, color:'white', margin:'0 0 2px' }}>Z&R Budapest</p>
            <p style={{ fontSize:9, color:'rgba(255,255,255,0.35)', margin:0 }}>zrbudapest.store</p>
          </div>
        </div>
      </div>
      <Label>TAP ADD</Label>
    </div>
  )
}

// Android Firefox — 3-dot menu
function AndroidFirefoxVisual() {
  return (
    <div style={{ width: 220, margin: '10px auto 0' }}>
      <BounceArrow />
      <div style={{ border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
        {['New tab', 'Downloads', 'Install'].map((item, i) => (
          <div key={item} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: item === 'Install' ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
            <span style={{ fontSize:12, color: item === 'Install' ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: item === 'Install' ? 500 : 400 }}>{item}</span>
            {item === 'Install' && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M7 9l-3-3M7 9l3-3M1 11h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </div>
        ))}
      </div>
      <Label>FIREFOX MENU ⋮</Label>
    </div>
  )
}

// Desktop Safari — File menu
function DesktopSafariVisual() {
  return (
    <div style={{ width: 220, margin: '10px auto 0' }}>
      <div style={{ border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
        <div style={{ padding:'6px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', letterSpacing:'0.05em' }}>File</span>
        </div>
        {['New Window', 'Open Location…', 'Add to Dock…'].map((item, i) => (
          <div key={item} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 14px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: item === 'Add to Dock…' ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
            <span style={{ fontSize:12, color: item === 'Add to Dock…' ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: item === 'Add to Dock…' ? 500 : 400 }}>{item}</span>
          </div>
        ))}
      </div>
      <Label>SAFARI → FILE MENU</Label>
    </div>
  )
}

// Desktop Chrome/Edge address bar install icon
function DesktopInstallVisual() {
  return (
    <div style={{ width: 220, margin: '10px auto 0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:'8px 14px' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/><path d="M4 6h4M6 4v4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/></svg>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', flex:1 }}>zrbudapest.store</span>
        <motion.div animate={{ scale:[1,1.15,1] }} transition={{ duration:1.4, repeat:Infinity, ease:'easeInOut' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="14" rx="3" stroke="white" strokeWidth="1.3"/>
            <path d="M8 4v6M8 10l-2.5-2.5M8 10l2.5-2.5M4 12h8" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>
      <Label>CLICK THE INSTALL ICON →</Label>
    </div>
  )
}

// Safari open-in hint for iOS non-Safari
function OpenInSafariVisual() {
  return (
    <div style={{ width: 220, margin: '10px auto 0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'10px 14px' }}>
        {/* Safari icon */}
        <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#1a9af7,#1af7c8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="1.3"/>
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M13 7l-4.5 4.5M13 7H9.5M13 7v3.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontSize:12, color:'white' }}>Open in Safari</span>
      </div>
      <Label>USE SAFARI TO INSTALL</Label>
    </div>
  )
}

// Tiny reusable bits
function Btn({ children, highlight }) {
  return (
    <div style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', background: highlight ? 'rgba(255,255,255,0.18)' : 'transparent', border: highlight ? '1px solid rgba(255,255,255,0.25)' : 'none', borderRadius:8, color: highlight ? 'white' : 'rgba(255,255,255,0.3)' }}>
      {children}
    </div>
  )
}

function Label({ children }) {
  return <p style={{ textAlign:'center', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em', margin:'6px 0 0' }}>{children}</p>
}

function Step({ n, text, visual }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display:'flex', gap:12, marginBottom:8 }}>
        <span style={{ color:'rgba(255,255,255,0.35)', fontSize:14, flexShrink:0 }}>{n}</span>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.65, margin:0 }}>{text}</p>
      </div>
      {visual}
    </div>
  )
}

// ── Content per case ─────────────────────────────────────────────────────────

function IOSSafariContent() {
  return (
    <>
      <Step n="①" text={<>Tap the <strong style={{color:'white'}}>Share</strong> button at the <strong style={{color:'white'}}>bottom</strong> of Safari</>} visual={<SafariToolbarVisual />} />
      <Step n="②" text={<>Scroll down and tap <strong style={{color:'white'}}>"Add to Home Screen"</strong></>} visual={<ShareSheetRowVisual />} />
      <Step n="③" text={<>Tap <strong style={{color:'white'}}>Add</strong> — done.</>} visual={<AddConfirmVisual />} />
    </>
  )
}

function IOSOtherContent() {
  const copyURL = () => navigator.clipboard?.writeText(window.location.href)
  return (
    <>
      <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 14px', marginBottom:20 }}>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.8)', lineHeight:1.6, margin:0 }}>
          Your current browser doesn't support home screen install on iPhone.{' '}
          <strong style={{color:'white'}}>Open this page in Safari</strong> to continue.
        </p>
      </div>
      <Step n="①" text={<>Tap the <strong style={{color:'white'}}>Share</strong> or <strong style={{color:'white'}}>⋯</strong> menu in your browser</>} visual={null} />
      <Step n="②" text={<>Tap <strong style={{color:'white'}}>"Open in Safari"</strong></>} visual={<OpenInSafariVisual />} />
      <Step n="③" text={<>Then follow the steps in Safari to install</>} visual={null} />
      <button onClick={copyURL} style={{ width:'100%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'white', fontSize:11, letterSpacing:'0.15em', padding:'10px 0', cursor:'pointer', marginTop:4 }}>
        COPY LINK
      </button>
    </>
  )
}

function AndroidFirefoxContent() {
  return (
    <>
      <Step n="①" text={<>Tap the <strong style={{color:'white'}}>⋮</strong> menu in the top-right corner</>} visual={<AndroidFirefoxVisual />} />
      <Step n="②" text={<>Tap <strong style={{color:'white'}}>Install</strong></>} visual={null} />
      <Step n="③" text={<>Confirm — done.</>} visual={null} />
    </>
  )
}

function DesktopSafariContent() {
  return (
    <>
      <Step n="①" text={<>In the menu bar, click <strong style={{color:'white'}}>File</strong></>} visual={<DesktopSafariVisual />} />
      <Step n="②" text={<>Select <strong style={{color:'white'}}>Add to Dock…</strong></>} visual={null} />
      <Step n="③" text={<>Click <strong style={{color:'white'}}>Add</strong> — done.</>} visual={null} />
    </>
  )
}

function PromptContent({ onInstall }) {
  return (
    <>
      <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.6, marginBottom:20 }}>
        One tap to install — no app store, no download.
      </p>
      <DesktopInstallVisual />
      <button onClick={onInstall} style={{ width:'100%', background:'white', color:'#3D4F3D', fontSize:11, letterSpacing:'0.2em', fontWeight:500, padding:'14px 0', border:'none', cursor:'pointer', marginTop:20 }}>
        DOWNLOAD OUR APP
      </button>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PWAInstallPrompt({ show }) {
  const [visible, setVisible]               = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (!show) return
    const env = detectEnv()
    if (localStorage.getItem(STORAGE_KEY)) return
    const installCase = resolveCase(env, !!deferredPrompt)
    if (installCase === 'installed' || installCase === 'unsupported') return

    timerRef.current = setTimeout(() => setVisible(true), 1400)
    return () => clearTimeout(timerRef.current)
  }, [show, deferredPrompt])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    dismiss()
  }

  const env         = detectEnv()
  const installCase = resolveCase(env, !!deferredPrompt)

  const subtitles = {
    'ios-safari':       'Download our app',
    'ios-other':        'Download our app',
    'android-firefox':  'Download our app',
    'desktop-safari':   'Add to your Dock',
    'prompt':           env.isDesktop ? 'Install on your desktop' : 'Download our app',
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-[70]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={dismiss}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[71] bg-[#3D4F3D] rounded-t-2xl px-7 pt-6 pb-10 overflow-y-auto overscroll-contain"
            style={{ maxHeight: 'min(92dvh, 92vh)' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 36, stiffness: 350 }}
          >
            {/* Handle */}
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Close */}
            <button onClick={dismiss} className="absolute top-5 right-5 text-white/40 hover:text-white/70 transition-colors">
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <p className="text-[9px] tracking-[0.25em] text-white/40 uppercase mb-1">Perfumerie</p>
              <p className="text-white text-lg tracking-[0.15em] font-light">Zielinski &amp; Rozen</p>
              <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase mt-3">
                {subtitles[installCase] || 'Download our app'}
              </p>
            </div>

            {/* Content */}
            {installCase === 'ios-safari'      && <IOSSafariContent />}
            {installCase === 'ios-other'       && <IOSOtherContent />}
            {installCase === 'android-firefox' && <AndroidFirefoxContent />}
            {installCase === 'desktop-safari'  && <DesktopSafariContent />}
            {installCase === 'prompt'          && <PromptContent onInstall={handleInstall} />}

            <button onClick={dismiss} className="w-full mt-8 text-white/30 text-xs tracking-wider hover:text-white/50 transition-colors py-2">
              Maybe later
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
