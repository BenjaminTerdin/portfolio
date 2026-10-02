"use client";

import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Languages,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
  Moon,
  Settings,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  contactDetails,
  cvFiles,
  getMessages,
  portfolioAppIds,
  projectShowcase,
  type Locale,
  type LocaleMessages,
  type PortfolioAppId,
} from "../portfolio-content";

const AmbientScene = dynamic(() => import("./ambient-scene"), {
  ssr: false,
  loading: () => null,
});

type ExperienceStage = "boot" | "welcome" | "tabletop" | "opening" | "tablet" | "turning-off" | "closing";

function readPreferenceCookie(name: string) {
  const prefix = `${name}=`;
  const cookie = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return cookie?.slice(prefix.length) ?? null;
}

function writePreferenceCookie(name: string, value: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

const pattern = [1, 2, 3, 6, 9];
const appIcons: Record<PortfolioAppId, LucideIcon> = {
  projects: Blocks,
  about: UserRound,
  resume: FileText,
  contact: Mail,
  settings: Settings,
};

function applyCvPreviewTheme(frame: HTMLIFrameElement | null, lightMode: boolean) {
  const previewDocument = frame?.contentDocument;
  if (!previewDocument?.head) return;

  let themeStyle = previewDocument.getElementById("portfolio-cv-theme") as HTMLStyleElement | null;
  if (!themeStyle) {
    themeStyle = previewDocument.createElement("style");
    themeStyle.id = "portfolio-cv-theme";
    previewDocument.head.append(themeStyle);
  }

  const background = lightMode ? "#fff" : "#000";
  const foreground = lightMode ? "#111" : "#fff";
  const colorScheme = lightMode ? "light" : "dark";
  themeStyle.textContent = `
    :root { color-scheme: ${colorScheme} !important; }
    html, body { background: ${background} !important; color: ${foreground} !important; }
    body, body * { color: ${foreground} !important; border-color: ${foreground} !important; }
    body * { background-color: transparent !important; }
    body { background-color: ${background} !important; }
  `;
}

function formatStockholmDate(date: Date, locale: Locale) {
  const parts = new Intl.DateTimeFormat(locale === "sv" ? "sv-SE" : "en-GB", {
    timeZone: "Europe/Stockholm",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  return `${weekday}, ${day}/${month}-${year}`;
}

function TabletStatusBar({
  dateTime,
  time,
  onLock,
  lockLabel,
}: {
  dateTime?: string;
  time: string;
  onLock: () => void;
  lockLabel: string;
}) {
  return (
    <div className="tablet-status-bar">
      <div className="tablet-status-time">
        <time dateTime={dateTime}>{time}</time>
      </div>
      <div className="tablet-status-actions">
        <button className="icon-button" type="button" onClick={onLock} aria-label={lockLabel}>
          <LockKeyhole size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function PatternLock({
  onUnlock,
  messages,
}: {
  onUnlock: () => void;
  messages: LocaleMessages["pattern"];
}) {
  const [selectedDots, setSelectedDots] = useState<number[]>([]);
  const [status, setStatus] = useState("");
  const selectedDotsRef = useRef<number[]>([]);
  const isDrawingRef = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  function updateSelectedDots(dots: number[]) {
    selectedDotsRef.current = dots;
    setSelectedDots(dots);
  }

  function findDot(target: EventTarget | null) {
    if (!(target instanceof Element)) return null;

    const dot = target.closest<HTMLElement>("[data-dot]");
    if (!dot || !gridRef.current?.contains(dot)) return null;

    return Number(dot.dataset.dot);
  }

  function findDotAtPoint(x: number, y: number) {
    return findDot(document.elementFromPoint(x, y));
  }

  function validatePattern(dots: number[]) {
    if (dots.length === pattern.length && dots.every((dot, index) => dot === pattern[index])) {
      setStatus(messages.unlocked);
      onUnlock();
      return;
    }

    updateSelectedDots([]);
    setStatus(messages.tryAgain);
  }

  function addDot(dot: number) {
    const current = selectedDotsRef.current;
    if (current.includes(dot) || current.length >= 9) return;

    updateSelectedDots([...current, dot]);
    setStatus(messages.nextDot);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const dot = findDot(event.target);
    if (dot === null) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    addDot(dot);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDrawingRef.current) return;
    const dot = findDotAtPoint(event.clientX, event.clientY);
    if (dot !== null) addDot(dot);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDrawingRef.current) return;

    const finalDot = findDotAtPoint(event.clientX, event.clientY);
    if (finalDot !== null) addDot(finalDot);
    isDrawingRef.current = false;

    if (selectedDotsRef.current.length >= pattern.length) {
      setStatus(messages.ready);
    } else if (selectedDotsRef.current.length > 0) setStatus(messages.nextDot);
  }

  function handleKeyboardSelection(dot: number) {
    const current = selectedDotsRef.current;
    if (current.includes(dot) || current.length >= 9) return;

    const nextDots = [...current, dot];
    updateSelectedDots(nextDots);
    setStatus(
      nextDots.length >= pattern.length
        ? messages.ready
        : messages.nextDot,
    );
  }

  function clearPattern() {
    updateSelectedDots([]);
    isDrawingRef.current = false;
    setStatus("");
  }

  function submitPattern() {
    if (selectedDotsRef.current.length === 0) return;
    validatePattern(selectedDotsRef.current);
  }

  const points = selectedDots
    .map((dot) => {
      const index = dot - 1;
      const coordinate = 46 + (index % 3) * 92;
      const row = 46 + Math.floor(index / 3) * 92;
      return `${coordinate},${row}`;
    })
    .join(" ");

  return (
    <div className="pattern-area">
      <div
        ref={gridRef}
        className="pattern-grid"
        role="group"
        aria-label={messages.groupLabel}
        aria-describedby="pattern-status"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          isDrawingRef.current = false;
        }}
      >
        <svg className="pattern-lines" viewBox="0 0 276 276" aria-hidden="true">
          <polyline points={points} />
        </svg>
        {Array.from({ length: 9 }, (_, index) => {
          const dot = index + 1;
          const selected = selectedDots.includes(dot);

          return (
            <button
              key={dot}
              className={`pattern-dot${selected ? " is-selected" : ""}`}
              type="button"
              data-dot={dot}
              aria-label={`${messages.dotLabel} ${dot}`}
              aria-pressed={selected}
              onClick={(event) => {
                if (event.detail === 0) handleKeyboardSelection(dot);
              }}
            >
              <span />
            </button>
          );
        })}
      </div>
      <div className="pattern-feedback-row">
        <p className="visually-hidden" id="pattern-status" aria-live="polite">
          {status}
        </p>
        <button className="text-button clear-pattern" type="button" onClick={clearPattern}>
          {messages.clear}
        </button>
        <button
          className={`icon-button submit-pattern${selectedDots.length === 0 ? " is-disabled" : ""}`}
          type="button"
          aria-label={messages.enter}
          aria-disabled={selectedDots.length === 0}
          onClick={submitPattern}
        >
          <ArrowRight size={30} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function PortfolioExperience() {
  const [stage, setStage] = useState<ExperienceStage>("boot");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [isCvPreview, setIsCvPreview] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const [activeAppId, setActiveAppId] = useState<PortfolioAppId | null>(null);
  const [stockholmNow, setStockholmNow] = useState<Date | null>(null);
  const tabletCloseButtonRef = useRef<HTMLButtonElement>(null);
  const previousStageRef = useRef(stage);
  const closeTransitionTimerRef = useRef<number | null>(null);
  const lowerDeviceTimerRef = useRef<number | null>(null);
  const cvPreviewFrameRef = useRef<HTMLIFrameElement>(null);
  const reduceMotion = useReducedMotion();
  const messages = getMessages(locale);
  const activeApp = activeAppId ? { id: activeAppId, ...messages.apps[activeAppId] } : null;

  useEffect(() => {
    const savedTheme = readPreferenceCookie("portfolio-theme");
    let savedLocale = readPreferenceCookie("portfolio-locale");

    if (savedLocale !== "en" && savedLocale !== "sv") {
      try {
        const legacyLocale = window.localStorage.getItem("portfolio-locale");
        if (legacyLocale === "en" || legacyLocale === "sv") {
          savedLocale = legacyLocale;
          writePreferenceCookie("portfolio-locale", legacyLocale);
        }
      } catch {
        savedLocale = null;
      }
    }

    const initialLocale: Locale = savedLocale === "sv" ? "sv" : "en";
    document.documentElement.lang = initialLocale;
    startTransition(() => {
      setLocale(initialLocale);
      setLightMode(savedTheme === "light");
      setStage("welcome");
    });

    const updateClock = () => setStockholmNow(new Date());
    updateClock();

    const intervalId = window.setInterval(updateClock, 10_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const viewport = window.matchMedia("(max-width: 760px)");
    const updateDeviceType = () => setIsPhone(viewport.matches);
    updateDeviceType();
    viewport.addEventListener("change", updateDeviceType);
    return () => viewport.removeEventListener("change", updateDeviceType);
  }, []);

  useEffect(() => () => {
    if (closeTransitionTimerRef.current !== null) {
      window.clearTimeout(closeTransitionTimerRef.current);
    }
    if (lowerDeviceTimerRef.current !== null) {
      window.clearTimeout(lowerDeviceTimerRef.current);
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      window.document.title = messages.page.title;
      window.document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", messages.page.description);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [messages.page.description, messages.page.title]);

  useEffect(() => {
    if (isCvPreview) applyCvPreviewTheme(cvPreviewFrameRef.current, lightMode);
  }, [isCvPreview, lightMode]);

  useEffect(() => {
    if (stage === "tablet") tabletCloseButtonRef.current?.focus({ preventScroll: true });
    if ((previousStageRef.current === "tablet" || previousStageRef.current === "closing") && stage === "tabletop") {
      document.querySelector<HTMLCanvasElement>(".ambient-scene-canvas")?.focus({ preventScroll: true });
    }
    previousStageRef.current = stage;
  }, [stage]);

  const dateTime = stockholmNow?.toISOString();
  const stockholmTime = stockholmNow
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Stockholm",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(stockholmNow)
    : "--:--";
  const stockholmDate = stockholmNow ? formatStockholmDate(stockholmNow, locale) : "";

  function updateLocale(nextLocale: Locale) {
    writePreferenceCookie("portfolio-locale", nextLocale);
    document.documentElement.lang = nextLocale;
    setLocale(nextLocale);
  }

  function updateTheme(nextLightMode: boolean) {
    writePreferenceCookie("portfolio-theme", nextLightMode ? "light" : "dark");
    setLightMode(nextLightMode);
  }

  function lockDevice() {
    setIsCvPreview(false);
    setActiveAppId(null);
    setIsUnlocked(false);
  }

  function turnOffDevice() {
    if (stage !== "tablet" || closeTransitionTimerRef.current !== null || lowerDeviceTimerRef.current !== null) return;
    setIsCvPreview(false);
    setActiveAppId(null);
    setIsUnlocked(false);

    const powerOffDelay = reduceMotion ? 0 : 240;
    const lowerDelay = reduceMotion ? 0 : 220;

    setStage("turning-off");
    closeTransitionTimerRef.current = window.setTimeout(() => {
      closeTransitionTimerRef.current = null;

      if (sceneFailed) {
        setStage("tabletop");
        return;
      }

      setStage("closing");
      lowerDeviceTimerRef.current = window.setTimeout(() => {
        lowerDeviceTimerRef.current = null;
        setStage("tabletop");
      }, lowerDelay);
    }, powerOffDelay);
  }

  return (
    <>
      <h1 className="visually-hidden">{messages.page.documentTitle}</h1>
      {stage === "boot" ? (
        <motion.section
          key="boot"
          className="boot-screen"
          data-theme={lightMode ? "light" : "dark"}
          aria-label={messages.boot.status}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Image
            className="boot-logo"
            src={lightMode ? "/BenterBlack500x500.svg" : "/BenterWhite500x500.svg"}
            alt="Benter"
            width={72}
            height={72}
          />
          <p role="status">{messages.boot.status}</p>
          <span className="boot-progress" aria-hidden="true"><span /></span>
        </motion.section>
      ) : stage === "welcome" ? (
        <motion.section
          key="welcome"
          className="welcome-screen"
          data-theme={lightMode ? "light" : "dark"}
          aria-labelledby="welcome-heading"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.4 }}
        >
          <Image
            className="welcome-logo"
            src={lightMode ? "/BenterBlack500x500.svg" : "/BenterWhite500x500.svg"}
            alt="Benter"
            width={62}
            height={62}
            loading="eager"
          />
          <p className="welcome-eyebrow">{messages.welcome.eyebrow}</p>
          <h2 id="welcome-heading">{messages.welcome.heading}</h2>
          <p className="welcome-description">{messages.welcome.description}</p>

          <div className="welcome-preferences">
            <div className="welcome-preference">
              <span>{messages.welcome.themeLabel}</span>
              <div className="welcome-segment" role="group" aria-label={messages.welcome.themeLabel}>
                <button
                  className="welcome-option welcome-icon-option"
                  type="button"
                  aria-label={messages.aria.switchToDark}
                  aria-pressed={!lightMode}
                  title={messages.settings.darkMode}
                  onClick={() => updateTheme(false)}
                >
                  <Moon size={17} aria-hidden="true" />
                </button>
                <button
                  className="welcome-option welcome-icon-option"
                  type="button"
                  aria-label={messages.aria.switchToLight}
                  aria-pressed={lightMode}
                  title={messages.settings.lightMode}
                  onClick={() => updateTheme(true)}
                >
                  <Sun size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="welcome-preference">
              <span>{messages.welcome.languageLabel}</span>
              <div className="welcome-segment" role="group" aria-label={messages.welcome.languageLabel}>
                <button
                  className="welcome-option"
                  type="button"
                  aria-pressed={locale === "en"}
                  onClick={() => updateLocale("en")}
                >
                  {messages.settings.english}
                </button>
                <button
                  className="welcome-option"
                  type="button"
                  aria-pressed={locale === "sv"}
                  onClick={() => updateLocale("sv")}
                >
                  {messages.settings.swedish}
                </button>
              </div>
            </div>
          </div>

          <button className="welcome-enter-button" type="button" onClick={() => setStage("tabletop")}>
            <span>{messages.welcome.enter}</span>
            <ArrowRight size={19} aria-hidden="true" />
          </button>
        </motion.section>
      ) : (
        <>
          <div
            className={`scene-region${stage === "tablet" || stage === "turning-off" || stage === "closing" ? " is-covered" : ""}`}
            aria-hidden={stage === "tablet" || stage === "turning-off" || stage === "closing"}
          >
            {sceneFailed ? (
              <button
                className="tabletop-fallback"
                type="button"
                aria-label={messages.scene.openTablet}
                onClick={() => setStage("tablet")}
              >
                <span className="fallback-flowerpot" aria-hidden="true" />
                <span className="fallback-tablet" aria-hidden="true" />
                <span className="fallback-cup" aria-hidden="true" />
                <span className="fallback-open-label">{messages.scene.openTablet}</span>
              </button>
            ) : (
              <>
                {!sceneReady && <div className="scene-loading" role="status">{messages.scene.loading}</div>}
                <AmbientScene
                  isPhone={isPhone}
                  raised={stage === "opening" || stage === "tablet" || stage === "turning-off" || stage === "closing"}
                  reducedMotion={Boolean(reduceMotion)}
                  sceneLabel={messages.scene.label}
                  openLabel={messages.scene.openTablet}
                  onOpen={() => setStage("opening")}
                  onRaised={() => setStage("tablet")}
                  onLowered={() => setStage("tabletop")}
                  onReady={() => setSceneReady(true)}
                  onError={() => setSceneFailed(true)}
                />
              </>
            )}
          </div>
          {(stage === "tablet" || stage === "turning-off" || stage === "closing") && (
            <motion.div
              key="tablet-open"
              className={`tablet-open-layer${stage === "closing" ? " is-closing" : ""}`}
              role="dialog"
              aria-modal={stage !== "closing"}
              aria-hidden={stage === "closing"}
              aria-label={messages.page.tabletLabel}
              onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  turnOffDevice();
                  return;
                }
                if (event.key !== "Tab") return;

                const controls = Array.from(
                  event.currentTarget.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])',
                  ),
                );
                const firstControl = controls[0];
                const lastControl = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === firstControl) {
                  event.preventDefault();
                  lastControl?.focus();
                } else if (!event.shiftKey && document.activeElement === lastControl) {
                  event.preventDefault();
                  firstControl?.focus();
                }
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
            >
              <button
                className="tablet-stage-backdrop"
                type="button"
                aria-hidden="true"
                tabIndex={-1}
                onClick={turnOffDevice}
              />
              <motion.section
                className="tablet-frame"
                aria-label={messages.page.tabletLabel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
              >
      <span className="tablet-camera" aria-hidden="true" />
      <div className="tablet-screen" data-theme={lightMode ? "light" : "dark"}>
        <div className="screen-light" aria-hidden="true" />
        {stage !== "tablet" && (
          <motion.div
            className="tablet-power-off"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {!isUnlocked ? (
            <motion.section
              key="lock-screen"
              className="lock-screen"
              aria-label={messages.aria.lockScreen}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.3 }}
            >
              <Image
                className="tablet-logo"
                src={lightMode ? "/BenterBlack500x500.svg" : "/BenterWhite500x500.svg"}
                alt="Benter"
                width={56}
                height={56}
                loading="eager"
              />
              <div className="lock-clock" aria-label={messages.aria.clock}>
                <time className="lock-time" dateTime={dateTime} aria-label={messages.aria.time}>
                  {stockholmTime}
                </time>
                <time className="lock-date" dateTime={dateTime}>
                  {stockholmDate}
                </time>
              </div>

              <div className="unlock-panel">
                <PatternLock messages={messages.pattern} onUnlock={() => setIsUnlocked(true)} />
              </div>
            </motion.section>
          ) : activeApp ? (
            <motion.section
              key={`app-${activeApp.id}${isCvPreview ? "-cv-preview" : ""}`}
              className="app-screen"
              aria-label={`${messages.aria.appView}: ${isCvPreview ? messages.cv.previewTitle : activeApp.name}`}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: reduceMotion ? 0 : 0.24 }}
            >
              <TabletStatusBar
                dateTime={dateTime}
                time={stockholmTime}
                onLock={lockDevice}
                lockLabel={messages.aria.lockTablet}
              />
              <button
                className="icon-button app-back-button"
                type="button"
                onClick={() => {
                  if (isCvPreview) setIsCvPreview(false);
                  else setActiveAppId(null);
                }}
                aria-label={isCvPreview ? messages.cv.back : messages.aria.back}
              >
                <ArrowLeft size={19} />
              </button>
              {isCvPreview ? (
                <section className="cv-preview-page" aria-label={messages.cv.previewTitle}>
                  <h1 className="visually-hidden">{messages.cv.previewTitle}</h1>
                  <iframe
                    ref={cvPreviewFrameRef}
                    className="cv-preview-frame"
                    src={cvFiles.html}
                    title={messages.cv.previewTitle}
                    onLoad={(event) => applyCvPreviewTheme(event.currentTarget, lightMode)}
                  />
                </section>
              ) : (
              <article className="app-detail">
                {activeAppId === "about" ? (
                  <div className="about-heading-row">
                    <div className="about-heading-copy">
                      <h1>{activeApp.name}</h1>
                      {activeApp.summary && <p className="app-summary">{activeApp.summary}</p>}
                    </div>
                    <Image
                      className="about-profile-image"
                      src="/profile.jpg"
                      alt={messages.contact.profileImageAlt}
                      width={136}
                      height={136}
                    />
                  </div>
                ) : (
                  <h1>{activeApp.name}</h1>
                )}
                {activeApp.summary && activeAppId !== "about" && (
                  <p className="app-summary">{activeApp.summary}</p>
                )}
                {activeApp.description && <p className="app-description">{activeApp.description}</p>}
                {activeAppId === "resume" ? (
                  <CvActions messages={messages.cv} onPreview={() => setIsCvPreview(true)} />
                ) : activeAppId === "settings" ? (
                  <SettingsContent
                    locale={locale}
                    lightMode={lightMode}
                    messages={messages}
                    onLocaleChange={updateLocale}
                    onThemeChange={() => updateTheme(!lightMode)}
                  />
                ) : activeAppId === "contact" ? (
                  <ContactContent messages={messages} />
                ) : activeAppId === "projects" ? (
                  <ul className="project-list" aria-label={activeApp.name}>
                    {projectShowcase.map((project) => (
                      <li key={project.url} className="project-list-item">
                        <a className="project-card" href={project.url} target="_blank" rel="noreferrer">
                          <Image
                            className="project-card-image"
                            src={project.image}
                            alt={`${project.title} preview`}
                            width={720}
                            height={420}
                          />
                          <div className="project-card-copy">
                            <span className="project-card-accent" style={{ backgroundColor: `${project.accent}22`, color: project.accent }}>
                              {project.url.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
                            </span>
                            <strong>{project.title}</strong>
                            <span>Open site</span>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    {activeApp.paragraphs && (
                      <div className="about-copy">
                        {activeApp.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                      </div>
                    )}
                    {activeApp.sections.length > 0 && (
                      <div className="app-sections">
                        {activeApp.sections.map((section, index) => (
                          <section className="app-copy-section" key={section.title}>
                            <span className="section-index">{String(index + 1).padStart(2, "0")}</span>
                            <div>
                              <h2>{section.title}</h2>
                              <p>{section.body}</p>
                              {section.items && (
                                <ul className="topic-list">
                                  {section.items.map((item) => {
                                    const normalized = item.trim();
                                    const isUrl = /^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(normalized);
                                    const href = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;

                                    return (
                                      <li key={item}>
                                        {isUrl ? (
                                          <a href={href} target="_blank" rel="noreferrer">
                                            {item}
                                          </a>
                                        ) : (
                                          item
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          </section>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </article>
              )}
            </motion.section>
          ) : (
            <motion.section
              key="launcher"
              className="launcher-screen"
              aria-label="Portfolio launcher"
              initial={{ opacity: 0, y: 9 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -7 }}
              transition={{ duration: reduceMotion ? 0 : 0.28 }}
            >
              <Image
                className="tablet-logo"
                src={lightMode ? "/BenterBlack500x500.svg" : "/BenterWhite500x500.svg"}
                alt="Benter"
                width={56}
                height={56}
              />
              <TabletStatusBar
                dateTime={dateTime}
                time={stockholmTime}
                onLock={lockDevice}
                lockLabel={messages.aria.lockTablet}
              />
              <div className="launcher-content">
                <header className="launcher-intro">
                  <h1>{messages.page.launcherTitle}</h1>
                </header>
                <div className="app-grid" aria-label={messages.page.appsLabel}>
                  {portfolioAppIds.map((appId, index) => {
                    const app = messages.apps[appId];
                    const Icon = appIcons[appId];

                    return (
                      <motion.button
                        className="app-shortcut"
                        key={appId}
                        type="button"
                        onClick={() => setActiveAppId(appId)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduceMotion ? 0 : index * 0.055, duration: 0.25 }}
                        whileHover={reduceMotion ? undefined : { y: -3 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className={`app-icon accent-${appId}`}>
                          <Icon size={27} strokeWidth={1.65} aria-hidden="true" />
                        </span>
                        <span className="app-shortcut-copy">
                          <span className="app-name">{app.name}</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
        <div className="navigation-pill" aria-hidden="true" />
        </div>
              </motion.section>
              {stage === "tablet" && (
                <button
                  className="tablet-exit-button"
                  ref={tabletCloseButtonRef}
                  type="button"
                  onClick={turnOffDevice}
                  aria-label={messages.scene.closeTablet}
                  title={messages.scene.closeTablet}
                >
                  <X size={19} aria-hidden="true" />
                </button>
              )}
            </motion.div>
          )}
        </>
      )}
    </>
  );
}

function CvActions({
  messages,
  onPreview,
}: {
  messages: LocaleMessages["cv"];
  onPreview: () => void;
}) {
  return (
    <section className="cv-actions" aria-label={messages.actionsLabel}>
      <button className="cv-action" type="button" onClick={onPreview}>
        <Eye size={18} aria-hidden="true" />
        <span>{messages.preview}</span>
      </button>
      <a className="cv-action" href={cvFiles.pdf} download>
        <Download size={18} aria-hidden="true" />
        <span>{messages.download}</span>
      </a>
    </section>
  );
}

function SettingsContent({
  locale,
  lightMode,
  messages,
  onLocaleChange,
  onThemeChange,
}: {
  locale: Locale;
  lightMode: boolean;
  messages: LocaleMessages;
  onLocaleChange: (locale: Locale) => void;
  onThemeChange: () => void;
}) {
  return (
    <section className="settings-group" aria-labelledby="settings-heading">
      <div className="settings-heading">
        <span className="settings-heading-icon" aria-hidden="true">
          <Languages size={20} />
        </span>
        <div>
          <h2 id="settings-heading">{messages.settings.themeHeading}</h2>
          <p>{messages.settings.themeDescription}</p>
        </div>
      </div>

      <div className="settings-stack">
        <button
          className={`theme-setting-toggle${lightMode ? " is-light" : ""}`}
          type="button"
          aria-label={lightMode ? messages.aria.switchToDark : messages.aria.switchToLight}
          aria-pressed={lightMode}
          onClick={onThemeChange}
        >
          <span className="theme-setting-copy">
            <span className="theme-setting-label">{lightMode ? messages.settings.lightMode : messages.settings.darkMode}</span>
            <span className="theme-setting-status">{lightMode ? messages.settings.lightMode : messages.settings.darkMode}</span>
          </span>
          <span className="theme-setting-switch" aria-hidden="true">
            <span className="theme-setting-thumb">
              {lightMode ? <Sun size={12} /> : <Moon size={12} />}
            </span>
          </span>
        </button>

        <div className="settings-heading settings-language-heading">
          <span className="settings-heading-icon" aria-hidden="true">
            <Languages size={18} />
          </span>
          <div>
            <h2 id="language-heading">{messages.settings.languageHeading}</h2>
            <p>{messages.settings.languageDescription}</p>
          </div>
        </div>

        <div className="language-switch" role="group" aria-label={messages.settings.languageHeading}>
          <button
            className="language-option"
            type="button"
            aria-pressed={locale === "en"}
            onClick={() => onLocaleChange("en")}
          >
            {messages.settings.english}
          </button>
          <button
            className="language-option"
            type="button"
            aria-pressed={locale === "sv"}
            onClick={() => onLocaleChange("sv")}
          >
            {messages.settings.swedish}
          </button>
        </div>
      </div>
    </section>
  );
}

function ContactContent({ messages }: { messages: LocaleMessages }) {
  return (
    <section className="contact-methods" aria-label={messages.contact.heading}>
      <a
        className="contact-link"
        href={contactDetails.linkedin}
        target="_blank"
        rel="noreferrer"
      >
        <Image
          className="contact-profile-image"
          src="/profile.jpg"
          alt=""
          width={48}
          height={48}
        />
        <span className="contact-link-copy">
          <span className="contact-link-label">{messages.contact.linkedinLabel}</span>
          <span className="contact-link-description">{messages.contact.linkedinDescription}</span>
        </span>
        <ExternalLink size={17} aria-hidden="true" />
      </a>
      <a className="contact-link" href={`mailto:${contactDetails.email}`}>
        <span className="contact-method-icon accent-contact" aria-hidden="true">
          <Mail size={20} />
        </span>
        <span className="contact-link-copy">
          <span className="contact-link-label">{messages.contact.emailLabel}</span>
          <span className="contact-link-description">{contactDetails.email}</span>
        </span>
        <ExternalLink size={17} aria-hidden="true" />
      </a>
      <a className="contact-link" href={`tel:${contactDetails.phoneHref}`}>
        <span className="contact-method-icon accent-contact" aria-hidden="true">
          <Phone size={20} />
        </span>
        <span className="contact-link-copy">
          <span className="contact-link-label">{messages.contact.phoneLabel}</span>
          <span className="contact-link-description">{contactDetails.phoneDisplay}</span>
        </span>
        <ExternalLink size={17} aria-hidden="true" />
      </a>
    </section>
  );
}