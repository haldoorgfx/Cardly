import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../eventera_api.dart';
import '../models.dart';
import '../screens/organizer/checkin_scanner_screen.dart';
import '../screens/organizer/create_event_screen.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import 'attendees_tab.dart';
import 'events_tab.dart';
import 'profile_tab.dart';
import 'stats_tab.dart';

/// Organize-side navigation shell — Events · Attendees · [Scan] · Stats ·
/// Profile, matching the "Eventera Organize" design reference. The center Scan
/// button is not a tab: it opens the check-in camera for one of your events.
class OrganizeShell extends StatefulWidget {
  const OrganizeShell({super.key});

  @override
  State<OrganizeShell> createState() => _OrganizeShellState();
}

class _OrganizeShellState extends State<OrganizeShell> {
  int _index = 0;

  // Re-entrancy guard for the Scan button. `_openScan` awaits the network
  // (myEvents) before any sheet appears, so without this a second tap during
  // that silent gap would stack a second event-picker sheet on top of the
  // first (the "scanner opens twice" bug).
  bool _scanning = false;

  final _pages = const [
    OrganizerEventsTab(),
    OrganizerAttendeesTab(),
    OrganizerStatsTab(),
    OrganizerProfileTab(),
  ];

  void _select(int i) {
    if (i != _index) HapticFeedback.selectionClick();
    setState(() => _index = i);
  }

  // ── Scan: always functional ───────────────────────────────────────────────
  // One event → straight to the camera. Several → quick picker. None → a
  // friendly explanation with a way forward. Never a dead button.
  Future<void> _openScan() async {
    // Ignore taps while a scan flow is already opening/open — otherwise the
    // network gap before the picker appears lets a second tap stack a second
    // sheet.
    if (_scanning) return;
    _scanning = true;
    HapticFeedback.mediumImpact();
    try {
      List<OrganizerEvent> events;
      try {
        events = await EventeraApi().myEvents();
      } catch (_) {
        if (!mounted) return;
        showToast(context,
            "We couldn't load your events. Check your connection and try again.");
        return;
      }
      if (!mounted) return;

      final published = events.where((e) => e.isPublished).toList();
      final scannable = published.isNotEmpty ? published : events;

      if (scannable.isEmpty) {
        await showMSheet(context, _NoEventsToScan(onCreate: () {
          Navigator.of(context).pop();
          Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const CreateEventScreen()));
        }));
        return;
      }

      if (scannable.length == 1) {
        _pushScanner(scannable.first);
        return;
      }

      final picked = await showMSheet<OrganizerEvent>(
        context,
        _ScanEventPicker(events: scannable),
      );
      if (picked != null && mounted) _pushScanner(picked);
    } finally {
      _scanning = false;
    }
  }

  void _pushScanner(OrganizerEvent e) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => CheckinScannerScreen(eventId: e.id, eventName: e.name),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: _OrganizeNav(
        index: _index,
        onTap: _select,
        onScan: _openScan,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────── bottom nav

class _OrganizeNav extends StatelessWidget {
  final int index;
  final ValueChanged<int> onTap;
  final VoidCallback onScan;
  const _OrganizeNav(
      {required this.index, required this.onTap, required this.onScan});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
        boxShadow: AppShadow.tabbar,
      ),
      padding: const EdgeInsets.fromLTRB(6, 8, 6, 8),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 58,
          child: Row(
            children: [
              _tab(0, Icons.event_note_outlined, Icons.event_note, 'Events'),
              _tab(1, Icons.people_alt_outlined, Icons.people_alt, 'Attendees'),
              _ScanButton(onTap: onScan),
              _tab(2, Icons.bar_chart_outlined, Icons.bar_chart, 'Stats'),
              _tab(3, Icons.person_outline, Icons.person, 'Profile'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tab(int i, IconData off, IconData on, String label) {
    final active = i == index;
    final color = active ? AppColors.forest : AppColors.inkMuted;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onTap(i),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(active ? on : off, size: 23, color: color),
            const SizedBox(height: 4),
            Text(label,
                style: AppText.caption.copyWith(
                  fontSize: 10,
                  fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                  color: color,
                )),
          ],
        ),
      ),
    );
  }
}

/// The elevated center Scan button — 58px rounded square on the forest
/// gradient, gold scan-frame glyph, floating above the bar (design ref:
/// `.onav .scanbtn .b`).
class _ScanButton extends StatelessWidget {
  final VoidCallback onTap;
  const _ScanButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    // Fixed-height slot; the button floats above the bar via a non-clipping
    // Stack so nothing overflows the 58px nav row.
    return SizedBox(
      width: 74,
      height: 58,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.topCenter,
          children: [
            Positioned(
              top: -24,
              child: Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF2A6A50), AppColors.forest],
                    stops: [0.0, 0.7],
                  ),
                  borderRadius: BorderRadius.circular(19),
                  border: Border.all(color: AppColors.surface, width: 3),
                  boxShadow: const [
                    BoxShadow(
                        color: Color(0x991F4D3A),
                        blurRadius: 24,
                        offset: Offset(0, 10)),
                  ],
                ),
                alignment: Alignment.center,
                child: const CustomPaint(
                  size: Size(26, 26),
                  painter: _ScanFramePainter(),
                ),
              ),
            ),
            Positioned(
              top: 38,
              child: Text('Scan',
                  style: AppText.caption.copyWith(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.forest,
                  )),
            ),
          ],
        ),
      ),
    );
  }
}

/// Scan-frame glyph: four corner brackets + a horizontal scanline, matching
/// the design reference (NOT a QR matrix — that read as a code, not an action).
class _ScanFramePainter extends CustomPainter {
  const _ScanFramePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = AppColors.gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round;

    final w = size.width, h = size.height;
    const c = 7.0; // corner arm length
    const r = 5.0; // corner radius

    // Four corner brackets.
    void corner(Offset hStart, Offset hEnd, Offset vStart, Offset vEnd,
        Offset arcFrom, Offset arcTo, bool clockwise) {
      final path = Path()
        ..moveTo(hStart.dx, hStart.dy)
        ..lineTo(hEnd.dx, hEnd.dy)
        ..arcToPoint(arcTo, radius: const Radius.circular(r), clockwise: clockwise)
        ..lineTo(vEnd.dx, vEnd.dy);
      canvas.drawPath(path, p);
    }

    // top-left
    corner(Offset(c, 0), Offset(r, 0), const Offset(0, r), Offset(0, c),
        Offset(r, 0), const Offset(0, r), false);
    // top-right
    corner(Offset(w - c, 0), Offset(w - r, 0), Offset(w, r), Offset(w, c),
        Offset(w - r, 0), Offset(w, r), true);
    // bottom-left
    corner(Offset(c, h), Offset(r, h), Offset(0, h - r), Offset(0, h - c),
        Offset(r, h), Offset(0, h - r), true);
    // bottom-right
    corner(Offset(w - c, h), Offset(w - r, h), Offset(w, h - r),
        Offset(w, h - c), Offset(w - r, h), Offset(w, h - r), false);

    // Scanline.
    canvas.drawLine(Offset(w * 0.22, h / 2), Offset(w * 0.78, h / 2), p);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ─────────────────────────────────────────────────────── scan helper sheets

class _ScanEventPicker extends StatelessWidget {
  final List<OrganizerEvent> events;
  const _ScanEventPicker({required this.events});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Which event are you checking in?', style: AppText.h3),
        const SizedBox(height: 4),
        Text('Pick the event at the door — the camera opens next.',
            style: AppText.bodySm),
        const SizedBox(height: 14),
        for (final e in events)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: MCard(
              onTap: () => Navigator.of(context).pop(e),
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.forestSoft,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: const Icon(Icons.qr_code_scanner,
                        size: 20, color: AppColors.forest),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(e.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.h3.copyWith(fontSize: 15)),
                  ),
                  if (e.isPublished)
                    const Tag('Live', kind: TagKind.success, dot: true),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right,
                      size: 18, color: AppColors.inkMuted),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _NoEventsToScan extends StatelessWidget {
  final VoidCallback onCreate;
  const _NoEventsToScan({required this.onCreate});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 64,
          height: 64,
          alignment: Alignment.center,
          decoration: BoxDecoration(
              color: AppColors.forestSoft, shape: BoxShape.circle),
          child:
              const Icon(Icons.qr_code_scanner, size: 30, color: AppColors.forest),
        ),
        const SizedBox(height: 16),
        Text('Nothing to scan yet', style: AppText.h3),
        const SizedBox(height: 6),
        Text(
          'The scanner checks people in at the door of your events. '
          'Create your first event and it will be ready here.',
          textAlign: TextAlign.center,
          style: AppText.bodySm,
        ),
        const SizedBox(height: 18),
        MButton('Create an event', icon: Icons.add, onTap: onCreate),
      ],
    );
  }
}
