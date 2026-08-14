"use client";

import { useEffect, useRef } from "react";
import pages from "../data/pdf-pages.json";

type PdfText = {
  top: number;
  left: number;
  width: number;
  height: number;
  fontSize: number;
  family: string;
  color: string;
  text: string;
};

type PdfImage = {
  top: number;
  left: number;
  width: number;
  height: number;
  src: string;
};

type PdfPageData = {
  page: number;
  pageW: number;
  pageH: number;
  texts: PdfText[];
  images: PdfImage[];
};

const TOTAL_PAGES = pages.length;
const PAGE_ASPECT = (pages[0] as PdfPageData).pageW / (pages[0] as PdfPageData).pageH;

const PAGE_COUNTER_RE = /^\d{1,2}\s*\/\s*\d{1,2}$/;

function fontFamilyFor(family: string) {
  return /Serif|Cormorant|Garamond/i.test(family)
    ? "var(--font-cormorant), Georgia, \"Times New Roman\", serif"
    : "var(--font-inter), Arial, sans-serif";
}

// The PDF renders letter-spaced uppercase labels with real space characters:
// a single space between glyphs, 3 spaces between words (e.g.
// "S O F I I A   V A N   D E R   V I R"). Detect that pattern and rebuild
// real words + CSS letter-spacing instead of showing every letter isolated.
function isLetterSpaced(raw: string) {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return false;
  const singleCharCount = tokens.filter((t) => t.length === 1).length;
  return singleCharCount / tokens.length > 0.6;
}

function reconstructLetterSpaced(raw: string) {
  return raw
    .trim()
    .split(/\s{2,}/)
    .filter(Boolean)
    .map((word) => word.replace(/ /g, ""))
    .join(" ");
}

// Skip the repeated footer-left name ("SOFIIA VAN DER VIR") — already in the header
function isFooterLeftText(t: PdfText) {
  return t.top > 90 && t.left < 20;
}

// Page counter (bottom-right) is shown in the rail instead
function isPageCounterText(t: PdfText) {
  return t.top > 90 && t.left > 75;
}

// Per-slide texts to suppress (overlaid section labels, etc.)
const SLIDE_HIDDEN_TEXTS: Record<number, Set<string>> = {
  4: new Set(["PROJEKTBILD / VISUALISIERUNG"]),
};

// Chapter number label (e.g. "01", "02") — small number top-left of content, not in topbar
function isChapterLabel(t: PdfText) {
  return /^0\s*\d$/.test(t.text.trim()) && t.top > 10 && t.top < 22 && t.left < 15;
}
const CHAPTER_LABEL_COLOR = '#9a8878';
function chapterLabelStyle(t: PdfText, pageW: number) {
  return {
    fontSize: `${(t.fontSize / pageW) * 100}cqw`,
    fontFamily: "var(--font-inter), Arial, sans-serif",
    fontWeight: '600' as const,
    color: CHAPTER_LABEL_COLOR,
  };
}

function isTopbarText(t: PdfText) {
  return t.top < 8;
}

// All-uppercase sans-serif label (eyebrow, data key) → needs extra weight
function isUppercaseLabel(t: PdfText) {
  if (isTopbarText(t) || isChapterLabel(t)) return false;
  const raw = t.text.trim();
  return raw.length > 2 && raw === raw.toUpperCase() && /[A-ZÄÖÜ]/.test(raw) && !/Serif/i.test(t.family);
}

// Build right-side label for each page from PDF data; override manually where needed
function extractRightLabel(data: PdfPageData): string {
  const t = data.texts.find(t => isTopbarText(t) && t.left > 50);
  if (!t) return '';
  return isLetterSpaced(t.text) ? reconstructLetterSpaced(t.text) : t.text.replace(/\s+/g, ' ').trim();
}

const PAGE_LABELS: Record<number, string> = {};
(pages as PdfPageData[]).forEach((p: PdfPageData) => {
  PAGE_LABELS[p.page] = extractRightLabel(p);
});
PAGE_LABELS[2] = 'Inhalt';
PAGE_LABELS[3] = 'Über mich';

const TOPBAR_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0, left: 0, right: 0,
  height: '8%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 6.5%',
  pointerEvents: 'none',
  zIndex: 2,
};
const TOPBAR_TEXT_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-inter), Arial, sans-serif',
  fontSize: '0.74cqw',
  letterSpacing: '0.1em',
  lineHeight: '1',
  whiteSpace: 'nowrap',
  fontWeight: 400,
};

// White bar at the bottom of each slide — creates uniform bottom margin, masks footer zone
function SlideFooterGuard({ page }: { page: number }) {
  if (page === 1) return null;
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '9%',
      background: '#fff',
      zIndex: 3,
      pointerEvents: 'none',
    }} />
  );
}

function SlideTopbar({ page }: { page: number }) {
  if (page === 1) return null;
  const label = PAGE_LABELS[page] ?? '';
  return (
    <div style={TOPBAR_STYLE}>
      <span style={{ ...TOPBAR_TEXT_STYLE, color: '#1a1a1a' }}>SOFIIA VAN DER VIR · PORTFOLIO 2026</span>
      {label && <span style={{ ...TOPBAR_TEXT_STYLE, color: '#6a6a6a' }}>{label.toUpperCase()}</span>}
    </div>
  );
}

function normalizeText(raw: string, page: number) {
  const cleaned = raw.trim().replace(/\s+/g, "");
  if (PAGE_COUNTER_RE.test(cleaned)) {
    return `${String(page).padStart(2, "0")} / ${TOTAL_PAGES}`;
  }
  if (isLetterSpaced(raw)) {
    return reconstructLetterSpaced(raw);
  }
  return raw.replace(/\s+/g, " ").trim();
}

function PdfPage({ data }: { data: PdfPageData }) {
  return (
    <div className="pdf-page">
      {data.images
        .filter(im => im.width > 1 && im.height > 1)
        .map((im, i) => (
        <img
          key={i}
          src={im.src}
          alt=""
          style={{
            position: "absolute",
            left: `${im.left}%`,
            top: `${im.top}%`,
            width: `${im.width}%`,
            height: `${im.height}%`,
            objectFit: "fill",
          }}
        />
      ))}
      {data.texts
        .filter(t => !isFooterLeftText(t) && !isPageCounterText(t) && !isTopbarText(t) && !SLIDE_HIDDEN_TEXTS[data.page]?.has(t.text.trim()))
        .map((t, i) => {
          const st = isChapterLabel(t)
            ? chapterLabelStyle(t, data.pageW)
            : {
                fontSize: `${(t.fontSize / data.pageW) * 100}cqw`,
                fontFamily: fontFamilyFor(t.family),
                letterSpacing: isLetterSpaced(t.text) ? "0.14em" : undefined,
                color: t.color,
                fontWeight: isUppercaseLabel(t) ? 600 : /Serif/i.test(t.family) && t.fontSize >= 40 ? 500 : undefined,
              };
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${t.left}%`,
                top: `${t.top}%`,
                whiteSpace: "nowrap",
                lineHeight: 1.15,
                ...st,
              }}
            >
              {normalizeText(t.text, data.page)}
            </span>
          );
        })}
    </div>
  );
}

function CoverSlide({ data }: { data: PdfPageData }) {
  const img = data.images[0];
  const byText = (needle: string) => data.texts.find((t) => t.text.trim() === needle);
  const line1 = data.texts[0]; // "Architektur"
  const line2 = data.texts[1]; // "portfolio"
  const label = byText("P O R T F O L I O   —   2 0 2 6") ?? data.texts[2];
  const name = byText("Sofiia Van der Vir") ?? data.texts[3];
  const year = byText("M M X X V I") ?? data.texts[4];

  const pos = (t: PdfText) => ({
    position: "absolute" as const,
    left: `${t.left}%`,
    top: `${t.top}%`,
    fontSize: `${(t.fontSize / data.pageW) * 100}cqw`,
    color: t.color,
  });

  return (
    <div className="pdf-page cover-slide">
      {img && (
        <img
          src={img.src}
          alt=""
          style={{
            position: "absolute",
            left: "68%",
            top: `${img.top}%`,
            width: `${img.width}%`,
            height: `${img.height}%`,
            objectFit: "fill",
          }}
        />
      )}
      {label && (
        <span className="cover-label" style={pos(label)}>PORTFOLIO — 2026</span>
      )}
      {line1 && (
        <span className="cover-title" style={pos(line1)}>Architektur</span>
      )}
      {line2 && (
        <span className="cover-title" style={pos(line2)}>portfolio</span>
      )}
      <div className="cover-rule" />
      {name && (
        <span className="cover-name" style={pos(name)}>Sofiia Van der Vir</span>
      )}
      {year && (
        <span className="cover-year" style={pos(year)}>MMXXVI</span>
      )}
    </div>
  );
}

// ── Slide 3: About / CV ──────────────────────────────────────────────────────

// pdftohtml misreads the large Cormorant headings as fs=14; override them.
const ABOUT_SECTION_HEADS = new Set(["Ausbildung", "Software"]);
const ABOUT_TITLE = "Über mich";
const ABOUT_SCHOOL_NAMES = new Set([
  "Fachhochschule Aachen",
  "Bachelor of Arts Architektur",
  "Fachhochschule Düsseldorf",
  "Master of Arts Innenarchitektur",
]);
const ABOUT_YEAR_RE = /^\d{4}-\d{4}/;
const ABOUT_CATEGORY_LABELS = new Set([
  "AVA-Software", "BIM & 2D Software", "3D Software",
  "Visualisierung", "Bildbearbeitung",
]);

function aboutTextStyle(t: PdfText, pageW: number) {
  const raw = t.text.trim();
  const cormorant = 'var(--font-cormorant), Georgia, serif';
  const inter = 'var(--font-inter), Arial, sans-serif';
  if (raw === ABOUT_TITLE)
    return { fontSize: `${(108 / pageW) * 100}cqw`, fontFamily: cormorant, color: '#1a1a1a' };
  if (isChapterLabel(t))
    return chapterLabelStyle(t, pageW);
  if (ABOUT_SECTION_HEADS.has(raw))
    return { fontSize: `${(35 / pageW) * 100}cqw`, fontFamily: cormorant, color: t.color };
  if (ABOUT_SCHOOL_NAMES.has(raw))
    return { fontSize: `${(44 / pageW) * 100}cqw`, fontFamily: cormorant, color: t.color };
  if (ABOUT_YEAR_RE.test(raw))
    return { fontSize: `${(20 / pageW) * 100}cqw`, fontFamily: inter, color: t.color };
  if (ABOUT_CATEGORY_LABELS.has(raw))
    return { fontSize: `${(t.fontSize / pageW) * 100}cqw`, fontFamily: inter, color: "#8a8a8a" };
  return {
    fontSize: `${(t.fontSize / pageW) * 100}cqw`,
    fontFamily: fontFamilyFor(t.family),
    color: t.color,
  };
}

function AboutSlide({ data }: { data: PdfPageData }) {
  const portrait = data.images[0];
  // Clip portrait to bottom of last content row (~79%), not footer
  const portraitHeight = portrait ? Math.min(portrait.height, 79 - portrait.top) : 0;
  return (
    <div className="pdf-page">
      {portrait && (
        <img
          src={portrait.src}
          alt=""
          style={{
            position: "absolute",
            left: `${portrait.left}%`,
            top: `${portrait.top}%`,
            width: `${portrait.width}%`,
            height: `${portraitHeight}%`,
            objectFit: "cover",
            objectPosition: "top",
          }}
        />
      )}
      {data.texts
        .filter(t => !isFooterLeftText(t) && !isPageCounterText(t) && !isTopbarText(t))
        .map((t, i) => {
          const st = aboutTextStyle(t, data.pageW);
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${t.left}%`,
                top: `${t.top}%`,
                whiteSpace: "nowrap",
                lineHeight: 1.15,
                letterSpacing: isLetterSpaced(t.text) ? "0.14em" : (st as Record<string,string>).letterSpacing,
                ...st,
              }}
            >
              {normalizeText(t.text, data.page)}
            </span>
          );
        })}
    </div>
  );
}

// Separator lines between index rows — top (6.46%) and bottom (93.51%) removed per design
const INDEX_RULE_TOPS = [40.72, 50.0, 59.25, 68.49, 77.77, 87.05];

function IndexSlide({ data }: { data: PdfPageData }) {
  return (
    <div className="pdf-page">
      {data.images.map((im, i) => (
        <img
          key={i}
          src={im.src}
          alt=""
          style={{
            position: "absolute",
            left: `${im.left}%`,
            top: `${im.top}%`,
            width: `${im.width}%`,
            height: `${im.height}%`,
            objectFit: "fill",
          }}
        />
      ))}
      {data.texts
        .filter(t => !isFooterLeftText(t) && !isPageCounterText(t) && !isTopbarText(t) && normalizeText(t.text, data.page) !== "INDEX")
        .map((t, i) => {
          // Right-column descriptors (70–89%) shifted left for rail clearance
          const left = t.left > 70 && t.left < 89 ? t.left - 8 : t.left;
          const st = {
            fontSize: `${(t.fontSize / data.pageW) * 100}cqw`,
            fontFamily: fontFamilyFor(t.family),
            letterSpacing: isLetterSpaced(t.text) ? "0.14em" : undefined,
            color: t.color,
          };
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: `${t.top}%`,
                whiteSpace: "nowrap",
                lineHeight: 1.15,
                ...st,
              }}
            >
              {normalizeText(t.text, data.page)}
            </span>
          );
        })}
      {INDEX_RULE_TOPS.map((top, i) => (
        <div key={i} className="page-rule" style={{ top: `${top}%` }} />
      ))}
    </div>
  );
}

export default function Home() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);
  const railCounterRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const slides = Array.from(scroller.querySelectorAll<HTMLElement>(".portfolio-slide"));
    const dots = Array.from(document.querySelectorAll<HTMLButtonElement>(".rail-dots button"));
    const currentEl = currentRef.current;
    const fillEl = fillRef.current;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = slides.indexOf(e.target as HTMLElement);
            if (idx >= 0) {
              if (currentEl) currentEl.textContent = String(idx + 1).padStart(2, "0");
              if (railCounterRef.current) railCounterRef.current.textContent = `${String(idx + 1).padStart(2, "0")} / ${TOTAL_PAGES}`;
              if (fillEl) fillEl.style.width = `${((idx + 1) / TOTAL_PAGES) * 100}%`;
              dots.forEach((d, i) => d.classList.toggle("current", i === idx));
            }
          }
        }
      },
      { root: scroller, threshold: 0.5 }
    );
    slides.forEach((s) => obs.observe(s));

    return () => obs.disconnect();
  }, []);

  return (
    <div className="portfolio-shell">
      <div className="progress-bar">
        <div className="progress-fill" ref={fillRef} />
      </div>

      <div className="slides-scroller" ref={scrollerRef} tabIndex={0}>
        {(pages as PdfPageData[]).map((pd) => (
          <div key={pd.page}>
            <div className="portfolio-slide">
              <div className="pdf-page-outer" style={{ width: 'calc(100% - 4.5rem)' }}>
                <div className="pdf-page-scaler" style={{ aspectRatio: PAGE_ASPECT }}>
                  <SlideTopbar page={pd.page} />
                  <SlideFooterGuard page={pd.page} />
                  {pd.page === 1 ? (
                    <CoverSlide data={pd} />
                  ) : pd.page === 2 ? (
                    <IndexSlide data={pd} />
                  ) : pd.page === 3 ? (
                    <AboutSlide data={pd} />
                  ) : (
                    <PdfPage data={pd} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="progress-rail">
        <span className="rail-label">SCROLL / NAVIGATE</span>
        <span className="rail-current" ref={currentRef}>01</span>
        <div className="rail-dots">
          {(pages as PdfPageData[]).map(({ page }) => (
            <button
              key={page}
              aria-label={`Go to page ${page}`}
              onClick={() => {
                const scroller = scrollerRef.current;
                if (!scroller) return;
                const slides = scroller.querySelectorAll<HTMLElement>(".portfolio-slide");
                slides[page - 1]?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          ))}
        </div>
        <a
          className="rail-pdf-btn"
          href="/portfolio.pdf"
          download="Sofiia-Van-der-Vir-Portfolio-2026.pdf"
          title="Portfolio als PDF herunterladen"
        >
          <svg viewBox="0 0 318.188 318.188" aria-hidden="true" fill="currentColor">
            <g><g><g>
              <path d="M283.149,52.722L232.625,2.197C231.218,0.79,229.311,0,227.321,0H40.342c-4.142,0-7.5,3.358-7.5,7.5v303.188c0,4.142,3.358,7.5,7.5,7.5h237.504c4.143,0,7.5-3.358,7.5-7.5V58.025C285.346,56.036,284.556,54.129,283.149,52.722z M234.821,25.607l24.918,24.919h-24.918V25.607z M47.842,15h171.98v10.263H47.842V15z M270.346,303.188H47.842V40.263h171.98v17.763c0,4.142,3.357,7.5,7.5,7.5h43.024V303.188z"/>
              <path d="M201.704,147.048c-3.615-0.024-7.177,0.154-10.693,0.354c-1.296,0.087-2.579,0.199-3.861,0.31c-1.314-1.36-2.584-2.765-3.813-4.202c-7.82-9.257-14.134-19.755-19.279-30.664c1.366-5.271,2.459-10.772,3.119-16.485c1.205-10.427,1.619-22.31-2.288-32.251c-1.349-3.431-4.946-7.608-9.096-5.528c-4.771,2.392-6.113,9.169-6.502,13.973c-0.313,3.883-0.094,7.776,0.558,11.594c0.664,3.844,1.733,7.494,2.897,11.139c1.086,3.342,2.283,6.658,3.588,9.943c-0.828,2.586-1.707,5.127-2.63,7.603c-2.152,5.643-4.479,11.004-6.717,16.161c-1.18,2.557-2.335,5.06-3.465,7.507c-3.576,7.855-7.458,15.566-11.814,23.02c-10.163,3.585-19.283,7.741-26.857,12.625c-4.063,2.625-7.652,5.476-10.641,8.603c-2.822,2.952-5.69,6.783-5.941,11.024c-0.141,2.394,0.807,4.717,2.768,6.137c2.697,2.015,6.271,1.881,9.4,1.225c10.25-2.15,18.121-10.961,24.824-18.387c4.617-5.115,9.872-11.61,15.369-19.465c0.012-0.018,0.024-0.036,0.037-0.054c9.428-2.923,19.689-5.391,30.579-7.205c4.975-0.825,10.082-1.5,15.291-1.974c3.663,3.431,7.621,6.555,11.939,9.164c3.363,2.069,6.94,3.816,10.684,5.119c3.786,1.237,7.595,2.247,11.528,2.886c1.986,0.284,4.017,0.413,6.092,0.335c4.631-0.175,11.278-1.951,11.714-7.57c0.134-1.721-0.237-3.229-0.98-4.551C220.067,150.006,207.479,147.966,201.704,147.048z"/>
              <path d="M158.594,233.392h-16.606v47.979h15.523c7.985,0,14.183-2.166,18.591-6.498c4.408-4.332,6.613-10.501,6.613-18.509c0-7.438-2.096-13.127-6.285-17.065C172.24,235.361,166.295,233.392,158.594,233.392z M166.503,267.309c-1.838,2.287-4.726,3.43-8.664,3.43h-2.888v-26.877h3.773c3.545,0,6.187,1.061,7.926,3.183c1.739,2.122,2.609,5.382,2.609,9.78C169.26,261.528,168.341,265.023,166.503,267.309z"/>
              <path d="M129.78,237.363c-3.041-2.647-7.592-3.971-13.652-3.971H99.522v47.979h12.963v-15.917h3.643c5.819,0,10.309-1.46,13.472-4.381c3.161-2.92,4.742-7.061,4.742-12.421C134.341,243.773,132.821,240.01,129.78,237.363z M119.492,253.247c-1.149,1.094-2.697,1.641-4.644,1.641h-2.363v-11.026h3.348c3.588,0,5.382,1.619,5.382,4.857C121.214,250.643,120.64,252.153,119.492,253.247z"/>
              <polygon points="191.314,281.371 204.08,281.371 204.08,263.354 218.454,263.354 218.454,252.951 204.08,252.951 204.08,243.795 219.669,243.795 219.669,233.392 191.314,233.392"/>
            </g></g></g>
          </svg>
        </a>
      </aside>
      <span className="rail-page-counter" ref={railCounterRef}>01 / {TOTAL_PAGES}</span>
    </div>
  );
}
