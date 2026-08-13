"use client";

import { useEffect, useMemo, useRef } from "react";
import recon from "../data/canva-recon-full.json";
import assets from "../../docs/research/canva-portfolio/asset-manifest.json";

type PageData = (typeof recon.pages)[number];
type ImageNode = PageData["images"][number];

const TOTAL_PAGES = recon.pages.length;

const PAGE_COUNTER_RE = /^\d{1,2}(\s*\/\s*\d{1,2})?$/;
const FOOTER_PROJECT_CAPTIONS = [
  "DORF, HOF, HEILUNG - FRAUENTHERAPIEZENTRUM",
  "LIVING IN A PROMINENT LOCATION",
  "HALLE FUER ALLE",
  "SOFIIA VAN DER VIR",
];

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function imageUrl(src: string) {
  return (assets.manifest as Record<string, string>)[src];
}

function validRect(rect: { width: number; height: number; x: number; y: number }) {
  return rect.width > 50 && rect.height > 50 && rect.x > -50 && rect.y > -50;
}

function isLabelLike(s: string) {
  if (!s) return false;
  if (s.length > 40) return false;
  if (/[.!?]$/.test(s)) return false;
  return true;
}

function projectCaptionFor(page: number) {
  if (page >= 4 && page <= 13) return "DORF, HOF, HEILUNG - FRAUENTHERAPIEZENTRUM";
  if (page >= 14 && page <= 19) return "LIVING IN A PROMINENT LOCATION";
  if (page >= 20 && page <= 26) return "HALLE FUER ALLE";
  return "SOFIIA VAN DER VIR · PORTFOLIO 2026";
}

interface ContentModel {
  headerLeft: string;
  headerRight: string;
  footerLeft: string;
  footerRight: string;
  eyebrow: string;
  title: string;
  paras: string[];
  listHeading: string;
  rows: { label: string; desc: string }[];
}

function extractContent(page: PageData): ContentModel {
  const raw = page.textNodes.map((n) => cleanText(n.text)).filter(Boolean);
  const used = new Array(raw.length).fill(false);

  let footerRight = "";
  for (let i = raw.length - 1; i >= 0; i--) {
    if (!used[i] && PAGE_COUNTER_RE.test(raw[i])) {
      footerRight = raw[i];
      used[i] = true;
      break;
    }
  }

  let footerLeft = "";
  let footerLeftIdx = -1;
  for (let i = 0; i < raw.length; i++) {
    if (used[i]) continue;
    if (FOOTER_PROJECT_CAPTIONS.includes(raw[i])) {
      footerLeft = raw[i];
      footerLeftIdx = i;
      used[i] = true;
      break;
    }
  }

  let headerLeft = "";
  let headerRight = "";
  let headerLeftEndIdx = -1;
  if (raw.length && !used[0]) {
    if (/SOFIIA VAN DER VIR/i.test(raw[0])) {
      if (raw[0].trim().endsWith("·") && raw[1] && /PORTFOLIO/i.test(raw[1])) {
        headerLeft = `${raw[0]} ${raw[1]}`;
        used[0] = true;
        used[1] = true;
        headerLeftEndIdx = 1;
      } else {
        headerLeft = raw[0];
        used[0] = true;
        headerLeftEndIdx = 0;
      }
    } else if (/^\d{1,2}$/.test(raw[0])) {
      headerLeft = raw[0];
      used[0] = true;
      headerLeftEndIdx = 0;
    }
  }

  if (footerLeftIdx !== -1 && raw[footerLeftIdx + 1] && !used[footerLeftIdx + 1] && raw[footerLeftIdx + 1].length <= 40) {
    headerRight = raw[footerLeftIdx + 1];
    used[footerLeftIdx + 1] = true;
  } else if (headerLeftEndIdx !== -1 && raw[headerLeftEndIdx + 1] && !used[headerLeftEndIdx + 1] && raw[headerLeftEndIdx + 1].length <= 40) {
    headerRight = raw[headerLeftEndIdx + 1];
    used[headerLeftEndIdx + 1] = true;
  }

  const pool = raw.filter((_, i) => !used[i]);

  let eyebrow = "";
  let title = "";
  let cursor = 0;
  if (pool.length === 1) {
    title = pool[0];
    cursor = 1;
  } else if (pool.length > 1) {
    if (isLabelLike(pool[0])) {
      eyebrow = pool[0];
      cursor = 1;
    }
    if (pool[cursor] && pool[cursor].length <= 55) {
      title = pool[cursor];
      cursor++;
      if (title.length <= 20 && pool[cursor] && isLabelLike(pool[cursor])) {
        title += " " + pool[cursor];
        cursor++;
      }
    }
  }

  const rest = pool.slice(cursor);
  let paras: string[] = [];
  const rows: { label: string; desc: string }[] = [];
  for (let i = 0; i < rest.length; i++) {
    const cur = rest[i];
    const next = rest[i + 1];
    if (isLabelLike(cur) && next && !isLabelLike(next)) {
      rows.push({ label: cur, desc: next });
      i++;
    } else {
      paras.push(cur);
    }
  }

  let listHeading = "";
  if (rows.length > 0 && paras.length > 0) {
    const last = paras[paras.length - 1];
    if (last.length <= 30) {
      listHeading = last;
      paras = paras.slice(0, -1);
    }
  }

  return {
    headerLeft: headerLeft || "SOFIIA VAN DER VIR · PORTFOLIO 2026",
    headerRight,
    footerLeft: footerLeft || projectCaptionFor(page.page),
    footerRight: footerRight || `${String(page.page).padStart(2, "0")} / ${TOTAL_PAGES}`,
    eyebrow,
    title,
    paras,
    listHeading,
    rows,
  };
}

function ImageLayer({ page, max = 14 }: { page: PageData; max?: number }) {
  const vw = page.viewport?.width || 1440;
  const vh = page.viewport?.height || 900;
  const images = page.images.filter((img: ImageNode) => imageUrl(img.src) && validRect(img.rect)).slice(0, max);
  return (
    <div className="image-layer" aria-hidden="true">
      {images.map((img: ImageNode, i: number) => (
        <img
          key={`${img.src}-${i}`}
          src={imageUrl(img.src)}
          alt={img.alt || ""}
          className="image-plate"
          style={{
            left: `${(img.rect.x / vw) * 100}%`,
            top: `${(img.rect.y / vh) * 100}%`,
            width: `${(img.rect.width / vw) * 100}%`,
            height: `${(img.rect.height / vh) * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

function PageBar({ left, right, top }: { left: string; right: string; top?: boolean }) {
  return <div className={`bar ${top ? "bar-header" : "bar-footer"}`}><span>{left}</span><span>{right}</span></div>;
}

function ContentSlide({ page }: { page: PageData }) {
  const model = useMemo(() => extractContent(page), [page]);
  return (
    <div className="content-page">
      <PageBar left={model.headerLeft} right={model.headerRight} top />
      <div className="content-area">
        <ImageLayer page={page} />
        <div className="text-cols fade-up">
          <div className="text-col-main">
            {model.eyebrow && <p className="eyebrow-label">{model.eyebrow}</p>}
            {model.title && <h2 className="content-title">{model.title}</h2>}
            {model.paras.map((p, i) => (
              <p key={i} className="body-para">{p}</p>
            ))}
          </div>
          {model.rows.length > 0 && (
            <div className="text-col-list">
              {model.listHeading && <p className="eyebrow-label">{model.listHeading}</p>}
              {model.rows.map((r, i) => (
                <div key={i} className="feature-row">
                  <strong>{r.label}</strong>
                  <span>{r.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <PageBar left={model.footerLeft} right={model.footerRight} />
    </div>
  );
}

function CoverSlide({ page }: { page: PageData }) {
  const hero = page.images.filter((i: ImageNode) => imageUrl(i.src) && validRect(i.rect)).sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height)[0];
  return (
    <div className="cover-page">
      <p className="eyebrow-label cover-kicker fade-up">PORTFOLIO — 2026</p>
      <h1 className="cover-title fade-up">
        Architektur
        <br />
        portfolio
      </h1>
      <div className="cover-rule fade-up" />
      <p className="cover-name fade-up">Sofiia Van der Vir</p>
      {hero && (
        <img className="cover-hero fade-up" src={imageUrl(hero.src)} alt={hero.alt || ""} />
      )}
      <span className="cover-year fade-up">MMXXVI</span>
      <button className="pdf-btn fade-up" onClick={() => window.print()} title="Portfolio als PDF drucken / herunterladen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="4" x2="12" y2="16"/><polyline points="8 12 12 16 16 12"/>
          <line x1="6" y1="20" x2="18" y2="20"/>
        </svg>
        <span className="pdf-label">PDF</span>
      </button>
    </div>
  );
}

const INDEX_ROWS: [string, string, string][] = [
  ["01", "Über mich", "Kontakt & Biografie"],
  ["02", "Frauentherapiezentrum Lüssow", "Therapiezentrum für Flüchtlingsfrauen"],
  ["03", "Stadtbad Krefeld — Halle für Alle", "Umbau eines historischen Stadtbades"],
  ["04", "Apartment 61", "Wohnprojekt — Innenraumdesign"],
  ["05", "Weitere Projekte", "Auswahl studentischer Arbeiten"],
];

function IndexSlide({ page }: { page: PageData }) {
  return (
    <div className="content-page">
      <PageBar left="SOFIIA VAN DER VIR · PORTFOLIO 2026" right="INHALT" top />
      <div className="index-body">
        <p className="eyebrow-label fade-up">INDEX</p>
        <h1 className="index-title fade-up">Inhalt.</h1>
        <div className="index-rows fade-up">
          {INDEX_ROWS.map(([num, title, note]) => (
            <div className="index-row" key={num}>
              <span>{num}</span>
              <strong>{title}</strong>
              <em>{note}</em>
            </div>
          ))}
        </div>
      </div>
      <PageBar left="SOFIIA VAN DER VIR" right={`${String(page.page).padStart(2, "0")} / ${TOTAL_PAGES}`} />
    </div>
  );
}

function AboutSlide({ page }: { page: PageData }) {
  const heroImg = page.images.filter((i: ImageNode) => imageUrl(i.src) && validRect(i.rect)).sort((a, b) => b.rect.height - a.rect.height)[0];
  const hero = heroImg ? imageUrl(heroImg.src) : undefined;
  return (
    <div className="content-page">
      <PageBar left="SOFIIA VAN DER VIR · PORTFOLIO 2026" right="02 · PROJEKT" top />
      <div className="about-body">
        <p className="eyebrow-label about-num fade-up">01</p>
        <h2 className="about-title fade-up">Über mich</h2>
        <div className="about-columns fade-up">
          <div>
            <h3>Ausbildung</h3>
            <p>
              2016–2023
              <br />
              <b>Fachhochschule Aachen</b>
              <br />
              Bachelor of Arts Architektur
            </p>
            <p className="about-sub">Bachelorarbeit bei Prof. Dipl.-Ing. Ulrich Eckey: Die markante Ecke – Zwischen öffentlichem Raum und privatem Rückzug</p>
            <p>
              2023–2025
              <br />
              <b>Fachhochschule Düsseldorf</b>
              <br />
              Master of Arts Innenarchitektur
            </p>
            <p className="about-sub">Masterarbeit bei Prof. Dipl.-Ing. Christiane Ern-Heinzl: Healing Architecture — Schutz- und Therapiestätten für kriegstraumatisierte Frauen</p>
          </div>
          <div>
            <h3>Software</h3>
            <p className="about-sub">AVA-Software</p>
            <p>ORCA</p>
            <p className="about-sub">BIM &amp; 2D Software</p>
            <p>Revit · Vectorworks · ArchiCAD</p>
            <p className="about-sub">3D Software</p>
            <p>Rhinoceros · SketchUP · Grasshopper</p>
            <p className="about-sub">Visualisierung</p>
            <p>Enscape · Twinmotion</p>
            <p className="about-sub">Bildbearbeitung</p>
            <p>Illustrator · Photoshop · Indesign</p>
          </div>
        </div>
        {hero && <img className="about-portrait" src={hero} alt="Sofiia Van der Vir" />}
      </div>
      <PageBar left="SOFIIA VAN DER VIR" right={`03 / ${TOTAL_PAGES}`} />
    </div>
  );
}

interface OpenerData {
  headerLeft: string;
  headerRight: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  lead: string;
  rows: [string, string][];
  footerLeft: string;
  footerRight: string;
}

const OPENER_1: OpenerData = {
  headerLeft: "SOFIIA VAN DER VIR · PORTFOLIO 2026",
  headerRight: "PROJEKTAUFTAKT",
  eyebrow: "THERAPIEZENTRUM FÜR GEFLÜCHTETE FRAUEN · LÜSSOW · JUNI 2025",
  title: "DORF, HOF, HEILUNG",
  lead: "Therapiezentrum für geflüchtete Frauen im ländlichen Dorf Lüssow in Mecklenburg-Vorpommern.",
  rows: [
    ["STANDORT", "Lüssow, Mecklenburg-Vorpommern, Deutschland"],
    ["DATUM", "Juni 2025"],
    ["PROJEKTART", "Therapie- und Wohnzentrum für Frauen"],
    ["GEBÄUDEKATEGORIE", "Soziale Architektur und Wohnarchitektur"],
    ["BAUMASSNAHME", "Umnutzung und modularer Neubau"],
  ],
  footerLeft: "DORF, HOF, HEILUNG - FRAUENTHERAPIEZENTRUM",
  footerRight: "01 / 07",
};

const OPENER_2: OpenerData = {
  headerLeft: "01",
  headerRight: "PROJECT OPENER",
  eyebrow: "WOHNUNGSBAU · STOLBERG-ATSCH · 2025",
  title: "LIVING IN A PROMINENT LOCATION",
  lead: "Neubau eines Wohngebäudes an der Kreuzung von Sebastianusstraße und Goethestraße.",
  rows: [
    ["STANDORT", "Stolberg-Atsch, Deutschland"],
    ["PROJEKTART", "Wohnungsbau"],
    ["BAUMASSNAHME", "Neubau"],
    ["GRUNDSTÜCKSFLÄCHE", "ca. 650 m²"],
    ["BGF", "ca. 500 m²"],
    ["GESCHOSSIGKEIT", "4 Geschosse + Satteldach"],
  ],
  footerLeft: "LIVING IN A PROMINENT LOCATION",
  footerRight: "01 / 06",
};

const OPENER_3: OpenerData = {
  headerLeft: "SOFIIA VAN DER VIR · INTERIOR ARCHITECTURE PORTFOLIO",
  headerRight: "PROJECT OPENER",
  eyebrow: "KULTURELLE UND SOZIALE REVITALISIERUNG · KREFELD · FEBRUAR 2025",
  title: "HALLE FUER ALLE",
  subtitle: "Revitalisierung des historischen Stadtbads Krefeld",
  lead: "Umnutzung der ehemaligen Maennerhalle zu einem offenen Ort fuer Bewegung, Begegnung und Gemeinschaft.",
  rows: [
    ["STANDORT", "Krefeld, Deutschland"],
    ["DATUM", "Konzeptphase Februar 2025"],
    ["PROJEKTART", "Cultural & Social Revitalization"],
    ["GEBAEUDEKATEGORIE", "Heritage / Public Building"],
    ["BAUMASSNAHME", "Adaptive Reuse / Redevelopment"],
    ["AUSZEICHNUNG", "1. Platz · Wettbewerb Stadt Krefeld"],
  ],
  footerLeft: "HALLE FUER ALLE",
  footerRight: "01 / 07",
};

function OpenerSlide({ page, data }: { page: PageData; data: OpenerData }) {
  const hero = page.images.filter((i: ImageNode) => imageUrl(i.src) && validRect(i.rect)).sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height)[0];
  const vw = page.viewport?.width || 1440;
  const vh = page.viewport?.height || 900;
  return (
    <div className="content-page opener-slide">
      <PageBar left={data.headerLeft} right={data.headerRight} top />
      <div className="opener-body">
        <div className="opener-text">
          <p className="eyebrow-label fade-up">{data.eyebrow}</p>
          <h1 className="opener-title fade-up">{data.title}</h1>
          {data.subtitle && <p className="opener-subtitle">{data.subtitle}</p>}
          <p className="opener-lead">{data.lead}</p>
          <dl className="opener-dl">
            {data.rows.map(([dt, dd]) => (
              <div className="opener-dl-row" key={dt}>
                <dt>{dt}</dt>
                <dd>{dd}</dd>
              </div>
            ))}
          </dl>
        </div>
        {hero && (
          <img
            className="opener-hero"
            src={imageUrl(hero.src)}
            alt={hero.alt || ""}
            style={{
              left: `${(hero.rect.x / vw) * 100}%`,
              top: `${(hero.rect.y / vh) * 100}%`,
              width: `${(hero.rect.width / vw) * 100}%`,
              height: `${(hero.rect.height / vh) * 100}%`,
            }}
          />
        )}
      </div>
      <PageBar left={data.footerLeft} right={data.footerRight} />
    </div>
  );
}

function ContactSlide() {
  return (
    <div className="contact-page">
      <div className="contact-left">
        <p className="eyebrow-label">KONTAKT</p>
        <h1 className="contact-name">
          Sofiia
          <br />
          Van der Vir.
        </h1>
        <div className="cover-rule" />
        <p className="contact-role">Architektin · Portfolio 2026</p>
        <div className="contact-strip">
          <p>Ich freue mich auf Ihre Nachricht.</p>
        </div>
      </div>
      <div className="contact-right">
        <h1 className="contact-heading">
          Lassen Sie uns
          <br />
          sprechen.
        </h1>
        <dl className="contact-dl">
          <div className="contact-dl-row">
            <dt>E-MAIL</dt>
            <dd>sofiia.vandervir@gmail.com</dd>
          </div>
          <div className="contact-dl-row">
            <dt>TELEFON</dt>
            <dd>+49 157 53510064</dd>
          </div>
          <div className="contact-dl-row">
            <dt>WEB</dt>
            <dd>www.sofiiavandervir.com</dd>
          </div>
          <div className="contact-dl-row">
            <dt>STUDIO</dt>
            <dd>Stuttgart · Deutschland</dd>
          </div>
        </dl>
        <p className="contact-footnote">{TOTAL_PAGES} / {TOTAL_PAGES} · ENDE · DANKE</p>
      </div>
    </div>
  );
}

function Slide({ page }: { page: PageData }) {
  let body: React.ReactNode;
  switch (page.page) {
    case 1:
      body = <CoverSlide page={page} />;
      break;
    case 2:
      body = <IndexSlide page={page} />;
      break;
    case 3:
      body = <AboutSlide page={page} />;
      break;
    case 4:
      body = <OpenerSlide page={page} data={OPENER_1} />;
      break;
    case 14:
      body = <OpenerSlide page={page} data={OPENER_2} />;
      break;
    case 20:
      body = <OpenerSlide page={page} data={OPENER_3} />;
      break;
    case 27:
      body = <ContactSlide />;
      break;
    default:
      body = <ContentSlide page={page} />;
  }

  return (
    <section id={`page-${page.page}`} className="portfolio-slide" aria-label={`Page ${page.page}`}>
      <div className="slide-canvas">
        <div className="grain" aria-hidden="true" />
        {body}
      </div>
    </section>
  );
}

export default function Home() {
  const frameRef = useRef<HTMLDivElement>(null);
  const pages = useMemo(() => recon.pages, []);

  useEffect(() => {
    const frame = frameRef.current!;
    if (!frame) return;

    // Slide height = frame height (100dvh each)
    const slideH = () => frame.clientHeight;

    function getActiveIndex(): number {
      const h = slideH();
      if (!h) return 0;
      return Math.min(TOTAL_PAGES - 1, Math.round(frame.scrollTop / h));
    }

    function goTo(idx: number) {
      const h = slideH();
      frame.scrollTo({ top: idx * h, behavior: "smooth" });
    }

    function updateUI() {
      const idx = getActiveIndex();
      const numEl = document.querySelector<HTMLElement>(".rail-current");
      const dotEls = document.querySelectorAll<HTMLElement>(".rail-dots button");
      const fillEl = document.querySelector<HTMLElement>(".progress-fill");
      if (numEl) numEl.textContent = String(idx + 1).padStart(2, "0");
      dotEls.forEach((d, i) => d.classList.toggle("current", i === idx));
      const total = frame.scrollHeight - frame.clientHeight;
      if (fillEl && total > 0) fillEl.style.width = (frame.scrollTop / total * 100) + "%";
    }

    frame.addEventListener("scroll", updateUI, { passive: true });
    updateUI();

    // Dot button clicks (delegated to parent to avoid duplicate listeners)
    const railDots = document.querySelector<HTMLElement>(".rail-dots");
    function onDotClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest("button");
      if (!btn || !railDots) return;
      const idx = Array.from(railDots.querySelectorAll("button")).indexOf(btn);
      if (idx >= 0) goTo(idx);
    }
    railDots?.addEventListener("click", onDotClick);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest("input,textarea,[contenteditable]")) return;
      const fwd = ["ArrowDown", "PageDown", " "].includes(e.key);
      const bck = ["ArrowUp", "PageUp"].includes(e.key);
      if (!fwd && !bck && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      const cur = getActiveIndex();
      const next = e.key === "Home" ? 0 : e.key === "End" ? TOTAL_PAGES - 1 : fwd ? Math.min(TOTAL_PAGES - 1, cur + 1) : Math.max(0, cur - 1);
      goTo(next);
    };
    document.addEventListener("keydown", onKeyDown);

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll<HTMLElement>(".fade-up").forEach((el, i) => {
            setTimeout(() => el.classList.add("in"), i * 60);
          });
        }
      });
    }, { threshold: 0.15 });
    frame.querySelectorAll("[data-page]").forEach(s => io.observe(s));

    return () => {
      frame.removeEventListener("scroll", updateUI);
      railDots?.removeEventListener("click", onDotClick);
      document.removeEventListener("keydown", onKeyDown);
      io.disconnect();
    };
  }, []);

  return (
    <main className="portfolio-shell">
      <div className="progress-bar"><div className="progress-fill" /></div>
      <aside className="progress-rail" aria-label="Portfolio pages">
        <span className="rail-label">SCROLL / NAVIGATE</span>
        <span className="rail-current">01</span>
        <div className="rail-dots">
          {pages.map((page) => (
            <button key={page.page} className={page.page === 1 ? "current" : ""} aria-label={`Go to page ${page.page}`} />
          ))}
        </div>
      </aside>
      <div ref={frameRef} className="slides-scroller" tabIndex={0}>
        {pages.map((page) => (
          <div key={page.page} data-page={page.page}>
            <Slide page={page} />
          </div>
        ))}
      </div>
    </main>
  );
}
