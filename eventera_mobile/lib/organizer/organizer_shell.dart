import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../eventera_api.dart';
import '../models.dart';
import '../screens/organizer/entitlement_scanner_screen.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import 'organizer_attendees_tab.dart';
import 'organizer_events_tab.dart';
import 'organizer_profile_tab.dart';
import 'organizer_tools_tab.dart';

/// The organizer field shell. Bottom nav with a raised center Scan FAB:
/// Events · Attendees · [Scan] · Tools · Profile. No admin affordance anywhere.
class OrganizerShell extends StatefulWidget {
  const OrganizerShell({super.key});

  @override
  State<OrganizerShell> createState() => _OrganizerShellState();
}

class _OrganizerShellState extends State<OrganizerShell> {
  int _index = 0;

  // The event the Scan FAB targets. Remembered once chosen so scanning is one
  // tap thereafter; the picker only reappears if nothing is selected yet.
  OrganizerEvent? _scanEvent;

  final _pages = const [
    OrganizerEventsTab(),
    OrganizerAttendeesTab(),
    OrganizerToolsTab(),
    OrganizerProfileTab(),
  ];

  void _select(int i) {
    if (i != _index) HapticFeedback.selectionClick();
    setState(() => _index = i);
  }

  Future<void> _openScan() async {
    HapticFeedback.lightImpact();
    var event = _scanEvent;
    event ??= await showOrganizerEventPicker(context, title: 'Scan for');
    if (event == null || !mounted) return;
    setState(() => _scanEvent = event);
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) =>
          EntitlementScannerScreen(eventId: event!.id, eventName: event.name),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: IndexedStack(index: _index, children: _pages),
      floatingActionButton: _ScanFab(onTap: _openScan),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: _OrgBottomBar(index: _index, onTap: _select),
    );
  }
}

/// Raised, forest-filled Scan FAB — the priority field action, reachable from
/// every organizer tab.
class _ScanFab extends StatelessWidget {
  final VoidCallback onTap;
  const _ScanFab({required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 60,
        height: 60,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.forest,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.canvas, width: 4),
          boxShadow: AppShadow.lift,
        ),
        child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 26),
      ),
    );
  }
}

class _OrgBottomBar extends StatelessWidget {
  final int index;
  final ValueChanged<int> onTap;
  const _OrgBottomBar({required this.index, required this.onTap});

  static const _items = [
    (Icons.event_outlined, Icons.event, 'Events', 0),
    (Icons.people_outline, Icons.people, 'Attendees', 1),
    (Icons.handyman_outlined, Icons.handyman, 'Tools', 2),
    (Icons.person_outline, Icons.person, 'Profile', 3),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
        boxShadow: AppShadow.tabbar,
      ),
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 56,
          child: Row(
            children: [
              _tab(0),
              _tab(1),
              const SizedBox(
                width: 72,
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: EdgeInsets.only(bottom: 2),
                    child: Text('Scan',
                        style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: AppColors.forest)),
                  ),
                ),
              ),
              _tab(2),
              _tab(3),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tab(int i) {
    final item = _items[i];
    final on = i == index;
    final color = on ? AppColors.forest : AppColors.inkMuted;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onTap(i),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(on ? item.$2 : item.$1, size: 24, color: color),
            const SizedBox(height: 4),
            Text(item.$3,
                style: AppText.caption.copyWith(
                  fontSize: 10.5,
                  fontWeight: on ? FontWeight.w600 : FontWeight.w500,
                  color: color,
                )),
          ],
        ),
      ),
    );
  }
}

/// The single forest header band at the top of a role surface (§1.1). Slim on
/// most tabs; the Profile tab renders its own taller band.
class OrgHeaderBand extends StatelessWidget {
  final String title;
  final Widget? trailing;
  const OrgHeaderBand({super.key, required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.of(context).padding.top;
    return Container(
      color: AppColors.forest,
      padding: EdgeInsets.only(top: topInset + 10, left: 20, right: 12, bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Text(title,
                style: AppText.h2.copyWith(color: Colors.white, fontSize: 20)),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

/// Compact bottom-sheet picker of the organizer's events. Returns the chosen
/// event, or null if dismissed / none exist. Loads its own data with full
/// loading / empty / error states.
Future<OrganizerEvent?> showOrganizerEventPicker(
  BuildContext context, {
  String title = 'Choose event',
}) {
  return showMSheet<OrganizerEvent>(
    context,
    _EventPickerBody(title: title),
  );
}

class _EventPickerBody extends StatefulWidget {
  final String title;
  const _EventPickerBody({required this.title});
  @override
  State<_EventPickerBody> createState() => _EventPickerBodyState();
}

class _EventPickerBodyState extends State<_EventPickerBody> {
  late Future<List<OrganizerEvent>> _future;

  @override
  void initState() {
    super.initState();
    _future = EventeraApi().myEvents();
  }

  void _reload() => setState(() => _future = EventeraApi().myEvents());

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.title, style: AppText.h3),
        const SizedBox(height: 12),
        FutureBuilder<List<OrganizerEvent>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: LoadingState(),
              );
            }
            if (snap.hasError) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: ErrorStateView(
                    message: "Couldn't load your events.", onRetry: _reload),
              );
            }
            final events = snap.data ?? const [];
            if (events.isEmpty) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: EmptyState(
                  icon: Icons.event_note_outlined,
                  title: 'No events yet',
                  message: 'Create an event before you can scan for it.',
                ),
              );
            }
            return Column(
              children: [
                for (final e in events)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _EventPickRow(
                      event: e,
                      onTap: () => Navigator.of(context).pop(e),
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _EventPickRow extends StatelessWidget {
  final OrganizerEvent event;
  final VoidCallback onTap;
  const _EventPickRow({required this.event, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(event.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.h3.copyWith(fontSize: 15)),
            ),
            const SizedBox(width: 8),
            if (event.isPublished)
              const Tag('Published', kind: TagKind.success)
            else
              Tag(event.status, kind: TagKind.warning),
          ],
        ),
      ),
    );
  }
}
