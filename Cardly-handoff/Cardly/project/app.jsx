function App() {
  return (
    <div className="text-ink min-h-screen">
      <Nav />
      <main>
        <Hero />
        <div className="section-wash" aria-hidden />
        <SocialProof />
        <div className="section-wash" aria-hidden />
        <Problem />
        <Solution />
        <div className="section-wash" aria-hidden />
        <UseCases />
        <div className="section-wash" aria-hidden />
        <HowItWorks />
        <Features />
        <div className="section-wash" aria-hidden />
        <Pricing />
        <Testimonial />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
