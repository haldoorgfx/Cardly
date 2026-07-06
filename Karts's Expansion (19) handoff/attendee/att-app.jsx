// Attendee app — shell + stack router.

function App() {
  const [tab, setTab] = React.useState("discover");
  const [stack, setStack] = React.useState([]); // pushed screens over the active tab

  const nav = React.useMemo(() => {
    const fn = (screen, params, replace) => {
      setStack((s) => replace && s.length ? [...s.slice(0, -1), { screen, params }] : [...s, { screen, params }]);
    };
    fn.back = () => setStack((s) => s.slice(0, -1));
    fn.reset = (t) => { setStack([]); if (t) setTab(t); };
    return fn;
  }, []);

  const A_SCREENS = window.A_SCREENS || {};
  const isBase = stack.length === 0;
  const current = isBase ? { screen: tab } : stack[stack.length - 1];
  const Comp = A_SCREENS[current.screen] || A_SCREENS.discover;

  const onTab = (t) => { setStack([]); setTab(t); };

  return (
    <Phone>
      {isBase && (
        <TopBar right={
          <div className="flex items-center gap-1.5">
            <button className="relative w-9 h-9 grid place-items-center rounded-full text-ink-soft hover:bg-primary-soft hover:text-primary transition-colors">
              <Icon.Bell w={18} /><span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent ring-2 ring-cream" />
            </button>
            <button onClick={() => onTab("me")} className="ml-0.5"><Avatar initials={ME.initials} grad={ME.g} size={32} /></button>
          </div>
        } />
      )}
      <Comp nav={nav} params={current.params} />
      {isBase && <BottomTabs active={tab} onTab={onTab} />}
    </Phone>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
