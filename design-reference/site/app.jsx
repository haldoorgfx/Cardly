const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "titleWeight": "Bold",
  "titleScale": 1.08,
  "titleTracking": -0.04
}/*EDITMODE-END*/;

const WEIGHT_MAP = { Regular: 400, Medium: 500, Semibold: 600, Bold: 700 };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--title-weight", String(WEIGHT_MAP[t.titleWeight] || 700));
    r.setProperty("--title-scale", String(t.titleScale));
    r.setProperty("--title-tracking", `${t.titleTracking}em`);
  }, [t.titleWeight, t.titleScale, t.titleTracking]);

  return (
    <div className="text-ink min-h-screen">
      <Nav />
      <main>
        <Hero />
        <TrustStripHero />
        <PlatformFeatures />
        <KartaDifference />
        <div className="section-wash" aria-hidden />
        <HowItWorks />
        <div className="section-wash" aria-hidden />
        <UseCases />
        <Pricing />
        <Testimonial />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />

      <TweaksPanel>
        <TweakSection label="Titles" />
        <TweakRadio
          label="Weight"
          value={t.titleWeight}
          options={["Regular", "Medium", "Semibold", "Bold"]}
          onChange={(v) => setTweak("titleWeight", v)}
        />
        <TweakSlider
          label="Size"
          value={t.titleScale}
          min={0.85}
          max={1.35}
          step={0.01}
          unit="×"
          onChange={(v) => setTweak("titleScale", v)}
        />
        <TweakSlider
          label="Tracking"
          value={t.titleTracking}
          min={-0.06}
          max={0.01}
          step={0.005}
          unit="em"
          onChange={(v) => setTweak("titleTracking", v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
