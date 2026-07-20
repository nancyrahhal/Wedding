import { useEffect, useRef, useState } from 'react'
import './App.css'

const asset = (name) => `/assets/${name}`
const REFERENCE_WIDTH = 1080
const REFERENCE_HEIGHT = 1920
const MAX_CANVAS_SCALE = 1
const MAX_CANVAS_DISPLAY_WIDTH = 480
const HORIZONTAL_PAGE_PADDING = 0
const DESIGN_LAYERS = {
  envelopeBack: 1,
  photo: 2,
  card: 3,
  envelopeFront: 4,
  text: 10,
  buttons: 10,
  logo: 10,
}
const PAGE_TWO_ASSETS = [
  'envelope-opened-back.webp',
  'hard-photo.webp',
  'card-oblique.webp',
  'envelope-opened-front.webp',
  'names.png',
  'arabic-button.png',
  'english-button.png',
  'wedding-logo-optimized.png',
]
const PAGE_THREE_ASSETS = [
  'card-zoomed-background.webp',
  'card-zoomed-envelope.webp',
  'flower1-back.webp',
  'flower2-back.webp',
  'card-zoomed-arabic.webp',
  'card-zoomed-english.webp',
  'flower1-front.webp',
  'flower2-front.webp',
  'details-frame-arabic.png',
  'details-frame-english.png',
  'location-button-arabic.png',
  'location-button-english.png',
  'wedding-logo-optimized.png',
]

const getCanvasScale = () => {
  if (typeof window === 'undefined') return MAX_CANVAS_SCALE
  const availableWidth = Math.min(
    window.innerWidth - HORIZONTAL_PAGE_PADDING * 2,
    MAX_CANVAS_DISPLAY_WIDTH,
  )
  return Math.min(availableWidth / REFERENCE_WIDTH, MAX_CANVAS_SCALE)
}

const hearts = [
  ['4%', '-2s', '16s', '7px', '7vw'], ['10%', '-12s', '19s', '9px', '-5vw'],
  ['17%', '-7s', '15s', '6px', '8vw'], ['23%', '-17s', '21s', '10px', '-6vw'],
  ['30%', '-4s', '18s', '8px', '5vw'], ['36%', '-14s', '17s', '6px', '-8vw'],
  ['43%', '-9s', '20s', '9px', '7vw'], ['49%', '-19s', '22s', '7px', '-5vw'],
  ['56%', '-5s', '16s', '10px', '8vw'], ['62%', '-15s', '19s', '6px', '-7vw'],
  ['69%', '-1s', '17s', '8px', '5vw'], ['75%', '-11s', '21s', '9px', '-8vw'],
  ['82%', '-6s', '18s', '6px', '6vw'], ['88%', '-16s', '20s', '10px', '-5vw'],
  ['95%', '-8s', '15s', '7px', '-7vw'], ['7%', '-20s', '23s', '6px', '5vw'],
  ['27%', '-10s', '22s', '7px', '-6vw'], ['52%', '-13s', '18s', '6px', '8vw'],
  ['72%', '-3s', '16s', '7px', '-5vw'], ['92%', '-18s', '23s', '6px', '6vw'],
]

function App() {
  const [isOpening, setIsOpening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [view, setView] = useState('home')
  const [invitationLanguage, setInvitationLanguage] = useState('english')
  const [canvasScale, setCanvasScale] = useState(getCanvasScale)
  const [rsvpStatus, setRsvpStatus] = useState('idle')
  const audioRef = useRef(null)
  const pageTwoRef = useRef(null)
  const pageThreeRef = useRef(null)
  const pageTwoAssetsReadyRef = useRef(Promise.resolve())
  const pageThreeAssetsReadyRef = useRef(Promise.resolve())

  useEffect(() => {
    const updateCanvasScale = () => setCanvasScale(getCanvasScale())
    window.addEventListener('resize', updateCanvasScale)
    return () => window.removeEventListener('resize', updateCanvasScale)
  }, [])

  const scrollToSlide = (slideRef) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        slideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  useEffect(() => {
    if (view !== 'details') return
    const imagePromises = PAGE_THREE_ASSETS.map((name) => new Promise((resolve) => {
      const image = new Image()
      image.onload = () => image.decode().catch(() => {}).finally(resolve)
      image.onerror = resolve
      image.src = asset(name)
    }))
    pageThreeAssetsReadyRef.current = Promise.all(imagePromises)
  }, [view])

  useEffect(() => {
    const imagePromises = PAGE_TWO_ASSETS.map((name) => new Promise((resolve) => {
      const image = new Image()
      image.onload = () => image.decode().catch(() => {}).finally(resolve)
      image.onerror = resolve
      image.src = asset(name)
    }))
    const fontPromise = (document.fonts?.load('43px "Cormorant Garamond"') ?? Promise.resolve())
      .catch(() => {})
    pageTwoAssetsReadyRef.current = Promise.all([...imagePromises, fontPromise])
  }, [])

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return

    // If autoplay was blocked, the first button press should start the music,
    // not put the already-silent player into a second muted state.
    if (audio.paused) {
      audio.muted = false
      setIsMuted(false)
      audio.play().catch(() => {})
      return
    }

    const nextMuted = !isMuted
    audio.muted = nextMuted
    setIsMuted(nextMuted)
  }

  useEffect(() => {
    if (view !== 'transition') return

    let cancelled = false
    const minimumTransition = new Promise((resolve) => window.setTimeout(resolve, 1500))

    Promise.all([minimumTransition, pageTwoAssetsReadyRef.current]).then(() => {
      if (cancelled) return
      setView('details')
      setIsOpening(false)
      scrollToSlide(pageTwoRef)
    })

    return () => { cancelled = true }
  }, [view])

  useEffect(() => {
    if (view !== 'details') return
    const audio = audioRef.current
    if (!audio) return

    audio.muted = false
    setIsMuted(false)
    audio.play().catch(() => {})
  }, [view])

  const openInvitation = () => {
    if (isOpening) return
    if (view === 'details' || view === 'invitation') {
      scrollToSlide(pageTwoRef)
      return
    }
    const audio = audioRef.current
    if (audio) {
      // Begin silently within the envelope click so browsers authorize playback;
      // it becomes audible only when page two is displayed.
      audio.muted = true
      setIsMuted(false)
      audio.play().catch(() => {})
    }
    window.dispatchEvent(new CustomEvent('invitation-opened'))
    setView('transition')
    setIsOpening(true)
  }

  const openLanguageInvitation = (language) => {
    setInvitationLanguage(language)
    pageThreeAssetsReadyRef.current.finally(() => {
      setView('invitation')
      scrollToSlide(pageThreeRef)
    })
  }

  const submitRsvp = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return

    const formData = new FormData(form)
    const attendees = formData.get('attendees')
    const names = formData.get('attendee-names')
    const song = formData.get('song-request')
    const message = invitationLanguage === 'arabic'
      ? [
          'تأكيد حضور حفل زفاف إبراهيم وزهراء',
          `عدد الحاضرين: ${attendees}`,
          `أسماء الحاضرين: ${names}`,
          `الأغنية المقترحة: ${song || 'لا يوجد'}`,
        ].join('\n')
      : [
          'Ibrahim & Zahraa Wedding RSVP',
          `Number of attendees: ${attendees}`,
          `Attendee names: ${names}`,
          `Song request: ${song || 'None'}`,
        ].join('\n')

    window.open(
      `https://wa.me/96181991004?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
    setRsvpStatus('idle')
  }

  const isCanvasView = view === 'details' || view === 'invitation'

  return (
    <main className={`invitation${isCanvasView ? ' view--details' : ''}`} aria-label="Wedding invitation">
      <section className="opening-stage" aria-label="Open the wedding invitation">
          <div className="photo" aria-hidden="true" />
          <div className="veil" aria-hidden="true" />

          <p className="welcome-line">To our beloved family</p>

          <button
            className={`envelope${isOpening ? ' is-opening' : ''}`}
            type="button"
            onClick={openInvitation}
            disabled={isOpening}
            aria-label="Open the wedding invitation envelope"
          >
            <span className="envelope__glow" aria-hidden="true" />
            <img
              src={asset('envelope-closed-optimized.webp')}
              alt=""
              decoding="async"
              fetchPriority="high"
            />
          </button>

          <img
            className="wedding-logo"
            src={asset('wedding-logo-optimized.png')}
            alt="Ibrahim and Zahraa"
            decoding="async"
          />
      </section>

      {(view === 'details' || view === 'invitation') && (
        <section ref={pageTwoRef} className="details-stage" aria-label="Choose invitation language">
          <div
            className="canvas-viewport"
            style={{
              width: REFERENCE_WIDTH * canvasScale,
              height: REFERENCE_HEIGHT * canvasScale,
            }}
          >
            <div
              className="invitation-canvas"
              style={{ transform: `scale(${canvasScale})` }}
            >
              <div className="envelope-back-position" style={{ zIndex: DESIGN_LAYERS.envelopeBack }}>
                <div className="design-animation-layer">
                  <img src={asset('envelope-opened-back.webp')} alt="" />
                </div>
              </div>

              <div className="photo-position" style={{ zIndex: DESIGN_LAYERS.photo }}>
                <div className="design-animation-layer photo-exit-animation">
                  <img src={asset('hard-photo.webp')} alt="" />
                </div>
              </div>

              <div className="card-position" style={{ zIndex: DESIGN_LAYERS.card }}>
                <div className="design-animation-layer card-exit-animation">
                  <img src={asset('card-oblique.webp')} alt="" />
                </div>
              </div>

              <div className="envelope-front-position" style={{ zIndex: DESIGN_LAYERS.envelopeFront }}>
                <div className="design-animation-layer">
                  <img src={asset('envelope-opened-front.webp')} alt="" />
                </div>
              </div>

              <div className="names-position" style={{ zIndex: DESIGN_LAYERS.text }}>
                <div className="design-animation-layer">
                  <img src={asset('names.png')} alt="Ibrahim and Zahraa" />
                </div>
              </div>

              <div className="subtitle-position" style={{ zIndex: DESIGN_LAYERS.text }}>
                <div className="design-animation-layer">
                  With grateful hearts, we invite you to<br />
                  celebrate the beginning of our forever.
                </div>
              </div>

              <button
                className="arabic-button-position"
                style={{ zIndex: DESIGN_LAYERS.buttons }}
                type="button"
                aria-label="Open the Arabic invitation"
                onClick={() => openLanguageInvitation('arabic')}
              >
                <span className="design-animation-layer">
                  <img src={asset('arabic-button.png')} alt="Arabic invitation" />
                </span>
              </button>

              <button
                className="english-button-position"
                style={{ zIndex: DESIGN_LAYERS.buttons }}
                type="button"
                aria-label="Open the English invitation"
                onClick={() => openLanguageInvitation('english')}
              >
                <span className="design-animation-layer">
                  <img src={asset('english-button.png')} alt="English invitation" />
                </span>
              </button>

              <div className="logo-position" style={{ zIndex: DESIGN_LAYERS.logo }}>
                <div className="design-animation-layer">
                  <img src={asset('wedding-logo-optimized.png')} alt="Ibrahim and Zahraa monogram" />
                </div>
              </div>

            </div>

            <button
              className={`music-toggle music-toggle--page${isMuted ? ' is-muted' : ''}`}
              type="button"
              onClick={toggleMusic}
              aria-label={isMuted ? 'Unmute music' : 'Mute music'}
              aria-pressed={isMuted}
            >
              <img src={asset('music-icon-optimized.png')} alt="" aria-hidden="true" />
              {isMuted && <span className="music-toggle__slash" aria-hidden="true" />}
            </button>
          </div>

        </section>
      )}

      {view === 'invitation' && (
        <section className="page-three-stage" aria-label={`${invitationLanguage} wedding invitation`}>
          <div
            ref={pageThreeRef}
            className="canvas-viewport page-three-slide"
            style={{
              width: REFERENCE_WIDTH * canvasScale,
              height: REFERENCE_HEIGHT * canvasScale,
            }}
          >
            <div
              className="invitation-canvas page-three-canvas"
              style={{ transform: `scale(${canvasScale})` }}
            >
              <div className="page-three-background-position">
                <div className="design-animation-layer">
                  <img src={asset('card-zoomed-background.webp')} alt="" />
                </div>
              </div>

              <div className="page-three-envelope-position">
                <div className="design-animation-layer">
                  <img src={asset('card-zoomed-envelope.webp')} alt="" />
                </div>
              </div>

              <div className="flower-one-position flower-one-back-position">
                <div className="design-animation-layer">
                  <img src={asset('flower1-back.webp')} alt="" />
                </div>
              </div>

              <div className="flower-two-position flower-two-back-position">
                <div className="design-animation-layer">
                  <img src={asset('flower2-back.webp')} alt="" />
                </div>
              </div>

              <div className="zoomed-card-position">
                <div className="design-animation-layer">
                  <img
                    src={asset(`card-zoomed-${invitationLanguage}.webp`)}
                    alt={`${invitationLanguage} wedding invitation card`}
                  />
                </div>
              </div>

              <div className="flower-one-position flower-one-front-position">
                <div className="design-animation-layer">
                  <img src={asset('flower1-front.webp')} alt="" />
                </div>
              </div>

              <div className="flower-two-position flower-two-front-position">
                <div className="design-animation-layer">
                  <img src={asset('flower2-front.webp')} alt="" />
                </div>
              </div>

              <div className="logo-position">
                <div className="design-animation-layer">
                  <img src={asset('wedding-logo-optimized.png')} alt="Ibrahim and Zahraa monogram" />
                </div>
              </div>
            </div>

            <button
              className={`music-toggle music-toggle--page${isMuted ? ' is-muted' : ''}`}
              type="button"
              onClick={toggleMusic}
              aria-label={isMuted ? 'Unmute music' : 'Mute music'}
              aria-pressed={isMuted}
            >
              <img src={asset('music-icon-optimized.png')} alt="" aria-hidden="true" />
              {isMuted && <span className="music-toggle__slash" aria-hidden="true" />}
            </button>

            <div className="page-three-scroll-cue" aria-hidden="true">
              <span>
                {invitationLanguage === 'arabic'
                  ? '\u0627\u0646\u0632\u0644 \u0644\u0627\u0643\u062a\u0634\u0627\u0641 \u0627\u0644\u0645\u0632\u064a\u062f'
                  : 'Scroll to discover more'}
              </span>
              <i />
            </div>
          </div>

          <div
            className="canvas-viewport details-page-viewport"
            style={{
              width: REFERENCE_WIDTH * canvasScale,
              height: REFERENCE_HEIGHT * canvasScale,
            }}
          >
            <div
              className="invitation-canvas details-page-canvas"
              style={{ transform: `scale(${canvasScale})` }}
            >
              <div className="details-frame-position">
                <div className="design-animation-layer">
                  <img
                    src={asset(`details-frame-${invitationLanguage}.png`)}
                    alt={`${invitationLanguage} wedding details`}
                  />
                </div>
              </div>

              <a
                className="location-button-position"
                href="https://www.google.com/maps/search/?api=1&query=Barraj+Garden"
                target="_blank"
                rel="noreferrer"
                aria-label="Open Barraj Garden location in Google Maps"
              >
                <span className="design-animation-layer">
                  <img
                    src={asset(`location-button-${invitationLanguage}.png`)}
                    alt="Open Barraj Garden location"
                  />
                </span>
              </a>

              <div className="details-logo-position">
                <div className="design-animation-layer">
                  <img src={asset('wedding-logo-optimized.png')} alt="Ibrahim and Zahraa monogram" />
                </div>
              </div>
            </div>

            <button
              className={`music-toggle music-toggle--page${isMuted ? ' is-muted' : ''}`}
              type="button"
              onClick={toggleMusic}
              aria-label={isMuted ? 'Unmute music' : 'Mute music'}
              aria-pressed={isMuted}
            >
              <img src={asset('music-icon-optimized.png')} alt="" aria-hidden="true" />
              {isMuted && <span className="music-toggle__slash" aria-hidden="true" />}
            </button>
          </div>

          <div
            className="canvas-viewport rsvp-page-viewport"
            style={{
              width: REFERENCE_WIDTH * canvasScale,
              height: REFERENCE_HEIGHT * canvasScale,
            }}
          >
            <div
              className={`invitation-canvas rsvp-page-canvas rsvp-page-canvas--${invitationLanguage}`}
              style={{ transform: `scale(${canvasScale})` }}
            >
              <div className="rsvp-background-position" aria-hidden="true">
                <img src={asset('background-rsvp.png')} alt="" loading="lazy" decoding="async" />
              </div>

              <div className="rsvp-frame-position" aria-hidden="true">
                <div className="design-animation-layer">
                  <img src={asset(`rsvp-frame-${invitationLanguage}.png`)} alt="" loading="lazy" decoding="async" />
                </div>
              </div>

              <form
                className="rsvp-form"
                onSubmit={submitRsvp}
                dir={invitationLanguage === 'arabic' ? 'rtl' : 'ltr'}
              >
                <select
                  className="rsvp-field rsvp-attendees-field"
                  name="attendees"
                  required
                  defaultValue=""
                  aria-label={invitationLanguage === 'arabic' ? 'عدد الأشخاص الحاضرين' : 'Number of attendees'}
                >
                  <option value="" disabled>
                    {invitationLanguage === 'arabic' ? 'اختر العدد' : 'Choose'}
                  </option>
                  {[1, 2, 3, 4, 5].map((number) => (
                    <option value={number} key={number}>{number}</option>
                  ))}
                </select>

                <textarea
                  className="rsvp-field rsvp-names-field"
                  name="attendee-names"
                  required
                  placeholder="Example: Ahmad Annan, Rania Rahhal,..."
                  aria-label={invitationLanguage === 'arabic' ? 'الأسماء الكاملة لجميع الحاضرين' : 'Full names of all attendees'}
                />

                <input
                  className="rsvp-field rsvp-song-field"
                  type="text"
                  name="song-request"
                  placeholder={invitationLanguage === 'arabic' ? 'اغنيتك المفضلة' : 'your fav dance floor song..'}
                  aria-label={invitationLanguage === 'arabic' ? 'أغنية مقترحة' : 'Optional song request'}
                />

                <button
                  className="rsvp-submit-position"
                  type="submit"
                  disabled={rsvpStatus === 'submitting'}
                  aria-label={invitationLanguage === 'arabic' ? 'إرسال تأكيد الحضور' : 'Submit RSVP'}
                >
                  <span className="design-animation-layer">
                    <img src={asset(`rsvp-submit-${invitationLanguage}.png`)} alt="" loading="lazy" decoding="async" />
                  </span>
                </button>

                <p className={`rsvp-status rsvp-status--${rsvpStatus}`} aria-live="polite">
                  {rsvpStatus === 'success' && (
                    invitationLanguage === 'arabic' ? 'تم فتح واتساب، يرجى الضغط على إرسال' : 'WhatsApp opened. Please tap Send.'
                  )}
                  {rsvpStatus === 'error' && (
                    invitationLanguage === 'arabic' ? 'يرجى السماح بفتح واتساب والمحاولة مجددًا' : 'Please allow WhatsApp to open and try again.'
                  )}
                </p>
              </form>

              <div className="rsvp-logo-position">
                <div className="design-animation-layer">
                  <img src={asset('wedding-logo-optimized.png')} alt="Ibrahim and Zahraa monogram" />
                </div>
              </div>
            </div>

            <button
              className={`music-toggle music-toggle--page${isMuted ? ' is-muted' : ''}`}
              type="button"
              onClick={toggleMusic}
              aria-label={isMuted ? 'Unmute music' : 'Mute music'}
              aria-pressed={isMuted}
            >
              <img src={asset('music-icon-optimized.png')} alt="" aria-hidden="true" />
              {isMuted && <span className="music-toggle__slash" aria-hidden="true" />}
            </button>
          </div>

          <div className="rsvp-keyboard-buffer" aria-hidden="true" />
        </section>
      )}

      <div className="heart-fall" aria-hidden="true">
        {hearts.map(([left, delay, duration, size, drift], index) => (
          <span
            className={`falling-heart${index % 4 === 1 ? ' falling-heart--olive' : ''}`}
            key={`${left}-${delay}`}
            style={{
              '--petal-left': left,
              '--petal-delay': delay,
              '--petal-duration': duration,
              '--petal-size': size,
              '--petal-drift': drift,
            }}
          />
        ))}
      </div>

      <audio
        ref={audioRef}
        src={asset('wedding-song1.mp3')}
        loop
        playsInline
        preload="none"
      />
    </main>
  )
}

export default App
