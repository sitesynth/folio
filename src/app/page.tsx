"use client";

import { useEffect, useRef } from "react";

const TOTAL_PAGES = 25;

type SlideInfo = {
  page: number;
  headerRight: string;
  footerLeft: string;
  cover?: boolean;   // bottom-bar only, no text
  plain?: boolean;   // no overlay at all
  imgCaption?: string; // extra caption label shown in top-right header area
};

const SLIDES: SlideInfo[] = [
  { page: 1,  headerRight: "",                           footerLeft: "",                                    cover: true },
  { page: 2,  headerRight: "INHALT",                     footerLeft: "SOFIIA VAN DER VIR" },
  { page: 3,  headerRight: "",                           footerLeft: "SOFIIA VAN DER VIR" },
  { page: 4,  headerRight: "PROJEKTAUFTAKT",             footerLeft: "DORF, HOF, HEILUNG — FRAUENTHERAPIEZENTRUM", imgCaption: "PROJEKTBILD / VISUALISIERUNG" },
  { page: 5,  headerRight: "KONTEXT + SCHLÜSSELMERKMALE",footerLeft: "DORF, HOF, HEILUNG — FRAUENTHERAPIEZENTRUM" },
  { page: 6,  headerRight: "LAGERPLANMODELL",            footerLeft: "DORF, HOF, HEILUNG — FRAUENTHERAPIEZENTRUM" },
  { page: 7,  headerRight: "KONZEPT",                    footerLeft: "DORF, HOF, HEILUNG — FRAUENTHERAPIEZENTRUM" },
  { page: 8,  headerRight: "WOHNKONZEPT",                footerLeft: "DORF, HOF, HEILUNG — FRAUENTHERAPIEZENTRUM" },
  { page: 9,  headerRight: "WOHNKONZEPT",                footerLeft: "DORF, HOF, HEILUNG — FRAUENTHERAPIEZENTRUM" },
  { page: 10, headerRight: "WOHNKONZEPT",                footerLeft: "DORF, HOF, HEILUNG — FRAUENTHERAPIEZENTRUM" },
  { page: 11, headerRight: "GEMEINSCHAFTSHAUS",          footerLeft: "DORF, HOF, HEILUNG — FRAUENTHERAPIEZENTRUM" },
  { page: 12, headerRight: "THERAPIEHAUS",               footerLeft: "DORF, HOF, HEILUNG — FRAUENTHERAPIEZENTRUM" },
  { page: 13, headerRight: "PROJEKTAUFTAKT",             footerLeft: "LIVING IN A PROMINENT LOCATION" },
  { page: 14, headerRight: "KONTEXT + SCHLÜSSELMERKMALE",footerLeft: "LIVING IN A PROMINENT LOCATION" },
  { page: 15, headerRight: "KONTEXT + SCHLÜSSELMERKMALE",footerLeft: "LIVING IN A PROMINENT LOCATION" },
  { page: 16, headerRight: "KONTEXT + SCHLÜSSELMERKMALE",footerLeft: "LIVING IN A PROMINENT LOCATION" },
  { page: 17, headerRight: "KONTEXT + SCHLÜSSELMERKMALE",footerLeft: "LIVING IN A PROMINENT LOCATION" },
  { page: 18, headerRight: "GRUNDRISSE",                 footerLeft: "LIVING IN A PROMINENT LOCATION" },
  { page: 19, headerRight: "PROJEKTAUFTAKT",             footerLeft: "HALLE FÜR ALLE" },
  { page: 20, headerRight: "KONZEPT",                    footerLeft: "HALLE FÜR ALLE" },
  { page: 21, headerRight: "KONTEXT + BESTANDSGEBÄUDE",  footerLeft: "HALLE FÜR ALLE" },
  { page: 22, headerRight: "GRUNDRISSE + SCHNITT",       footerLeft: "HALLE FÜR ALLE" },
  { page: 23, headerRight: "INNENARCHITEKTUR",           footerLeft: "HALLE FÜR ALLE" },
  { page: 24, headerRight: "INFORMATION + ZUGÄNGLICHKEIT",footerLeft: "HALLE FÜR ALLE" },
  { page: 25, headerRight: "",                           footerLeft: "" },
];

export default function Home() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);
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
        {SLIDES.map((slide) => {
          const n = String(slide.page).padStart(2, "0");
          const src = `/pdf-slides/pdfpage-${n}.png`;
          const counter = `${n} / ${TOTAL_PAGES}`;

          return (
            <div key={slide.page}>
              <div className="portfolio-slide">
                <div className="pdf-slide-wrap">
                  <img
                    className="pdf-slide-img"
                    src={src}
                    alt={`Portfolio page ${slide.page}`}
                    loading={slide.page <= 3 ? "eager" : "lazy"}
                  />

                  {/* Cover: bottom bar only to hide MMXXVI */}
                  {slide.cover && (
                    <div className="slide-bar slide-bar-bottom slide-bar-blank" />
                  )}

                  {/* Standard pages: top + bottom bars */}
                  {!slide.plain && !slide.cover && (
                    <>
                      <div className={`slide-bar slide-bar-top${slide.imgCaption ? " slide-bar-tall" : ""}`}>
                        <span>SOFIIA VAN DER VIR · PORTFOLIO 2026</span>
                        <span className="bar-right-col">
                          <span>{slide.headerRight}</span>
                          {slide.imgCaption && (
                            <span className="bar-img-caption">{slide.imgCaption}</span>
                          )}
                        </span>
                      </div>
                      <div className="slide-bar slide-bar-bottom">
                        <span>{slide.footerLeft}</span>
                        <span>{counter}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <aside className="progress-rail">
        <span className="rail-label">SCROLL / NAVIGATE</span>
        <span className="rail-current" ref={currentRef}>01</span>
        <div className="rail-dots">
          {SLIDES.map(({ page }) => (
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
    </div>
  );
}
