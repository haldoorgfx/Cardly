// Event-level config: Settings + Communications (email campaigns)

function EventSettingsPage({ event, onNav }) {
  const [tab, setTab] = React.useState("general");
  return (
    <PageShell title="Settings" subtitle={event.name} max="900px"
      actions={<Btn variant="primary" icon="Check" onClick={() => window.toast && window.toast("Settings saved")}>Save changes</Btn>}>
      <SegTabs active={tab} onChange={setTab} tabs={[
        { id: "general", label: "General" },
        { id: "registration", label: "Registration" },
        { id: "privacy", label: "Privacy" },
        { id: "danger", label: "Danger zone" },
      ]} />

      {tab === "general" && (
        <div className="grid gap-5">
          <Panel title="Event details">
            <div className="grid gap-4">
              <Field label="Event name" value={event.name} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Starts" value={`${event.date} · 09:00`} />
                <Field label="Ends" value={`${event.date} · 18:00`} />
              </div>
              <Field label="Venue" value={event.venue} />
              <Field label="Timezone" value="WAT · Lagos (GMT+1)" />
            </div>
          </Panel>
          <Panel title="Capacity & status">
            <InfoRow label="Status"><Pill tone={event.status === "live" ? "green" : "amber"} dot={STATUS_STYLE[event.status].dot}>{STATUS_STYLE[event.status].label}</Pill></InfoRow>
            <InfoRow label="Capacity">300 attendees</InfoRow>
            <InfoRow label="Waitlist" last><Toggle on={true} /></InfoRow>
          </Panel>
        </div>
      )}

      {tab === "registration" && (
        <Panel title="Registration form">
          <div className="grid gap-3.5">
            {[
              ["Collect organization", "Ask attendees for their company", true],
              ["Collect dietary needs", "For catered events", false],
              ["Custom question", "“What do you hope to learn?”", true],
              ["Require approval", "Manually approve each registration", false],
              ["Close registration at capacity", "Stop sales when full", true],
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div><div className="text-[13.5px] text-ink font-medium">{r[0]}</div><div className="text-[12px] text-muted mt-0.5">{r[1]}</div></div>
                <Toggle on={r[2]} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "privacy" && (
        <Panel title="Visibility & privacy">
          <div className="grid gap-3.5">
            {[
              ["Public event page", "Listed and discoverable", true],
              ["Show attendee list", "Let attendees see who's coming", true],
              ["Require login to register", "Attendees must create an account", false],
              ["Allow networking", "Attendees can message each other", true],
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div><div className="text-[13.5px] text-ink font-medium">{r[0]}</div><div className="text-[12px] text-muted mt-0.5">{r[1]}</div></div>
                <Toggle on={r[2]} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "danger" && (
        <div className="grid gap-4">
          <div className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between gap-4">
            <div><div className="font-display text-[14px] font-semibold text-ink">Duplicate event</div><div className="text-[12.5px] text-muted mt-0.5">Create a copy with the same agenda, tickets and settings.</div></div>
            <Btn icon="Grid">Duplicate</Btn>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between gap-4">
            <div><div className="font-display text-[14px] font-semibold text-ink">Cancel event</div><div className="text-[12.5px] text-muted mt-0.5">Notify all attendees and process refunds.</div></div>
            <button className="px-3.5 py-2 rounded-lg border border-amber-300 text-amber-700 text-[13px] font-medium hover:bg-amber-50 transition-colors whitespace-nowrap">Cancel event</button>
          </div>
          <div className="bg-red-50/60 border border-red-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div><div className="font-display text-[14px] font-semibold text-red-700">Delete event</div><div className="text-[12.5px] text-red-600/80 mt-0.5">Permanently remove this event and all its data. Can't be undone.</div></div>
            <button className="px-3.5 py-2 rounded-lg border border-red-300 text-red-700 text-[13px] font-medium hover:bg-red-100 transition-colors whitespace-nowrap">Delete</button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  "event-settings": EventSettingsPage,
});
