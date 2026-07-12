// EX04 · Directory preview — how the booth appears to attendees in the expo hall.
// Cover/logo, category, description, products, and a WORKING "Request meeting"
// CTA that inserts a real `meeting_requests` row bound to the signed-in account
// (the same write an attendee makes). Reuses booth data + `exhibitor_products`.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../sponsor/sponsor_api.dart';

class DirectoryPreviewScreen extends StatefulWidget {
  final String sponsorId;
  final String eventId;
  final String boothName;
  final String? description;
  final String? category;
  const DirectoryPreviewScreen({
    super.key,
    required this.sponsorId,
    required this.eventId,
    required this.boothName,
    this.description,
    this.category,
  });

  @override
  State<DirectoryPreviewScreen> createState() => _DirectoryPreviewScreenState();
}

class _DirectoryPreviewScreenState extends State<DirectoryPreviewScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = SponsorApi.fetchProducts(widget.sponsorId);
  }

  Future<void> _requestMeeting() async {
    final message = TextEditingController();
    DateTime? when;
    var sending = false;

    await showMSheet<void>(
      context,
      StatefulBuilder(builder: (ctx, setSheet) {
        Future<void> pick() async {
          final now = DateTime.now();
          final date = await showDatePicker(
            context: ctx,
            initialDate: now,
            firstDate: DateTime(now.year, now.month, now.day),
            lastDate: DateTime(now.year + 1, now.month, now.day),
            builder: (c, child) => Theme(
              data: Theme.of(c).copyWith(
                colorScheme: const ColorScheme.light(
                    primary: AppColors.forest,
                    onPrimary: Colors.white,
                    onSurface: AppColors.ink),
              ),
              child: child!,
            ),
          );
          if (date == null || !ctx.mounted) return;
          final t = await showTimePicker(
              context: ctx, initialTime: TimeOfDay.fromDateTime(now));
          if (t == null) return;
          setSheet(() => when =
              DateTime(date.year, date.month, date.day, t.hour, t.minute));
        }

        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Request a meeting',
                style: const TextStyle(
                    color: AppColors.ink, fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('Ask ${widget.boothName} to meet at the event.',
                style: const TextStyle(color: AppColors.inkSoft, fontSize: 13)),
            const SizedBox(height: 16),
            MInput(
                label: 'Message (optional)',
                hint: 'What would you like to discuss?',
                controller: message,
                minLines: 2,
                maxLines: 4),
            const SizedBox(height: 12),
            InkWell(
              onTap: pick,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                    color: AppColors.creamSoft,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border)),
                child: Row(children: [
                  const Icon(Icons.schedule, size: 18, color: AppColors.forest),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      when == null
                          ? 'Suggest a time (optional)'
                          : _stamp(when!),
                      style: TextStyle(
                          color: when == null
                              ? AppColors.inkSoft
                              : AppColors.ink,
                          fontSize: 14),
                    ),
                  ),
                  if (when != null)
                    GestureDetector(
                      onTap: () => setSheet(() => when = null),
                      child: const Icon(Icons.close,
                          size: 18, color: AppColors.inkMuted),
                    ),
                ]),
              ),
            ),
            const SizedBox(height: 18),
            MButton('Send request',
                icon: Icons.send_outlined,
                loading: sending,
                onTap: sending
                    ? null
                    : () async {
                        setSheet(() => sending = true);
                        try {
                          await SponsorApi.requestMeeting(
                            sponsorId: widget.sponsorId,
                            eventId: widget.eventId,
                            message: message.text,
                            requestedTime: when,
                          );
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (mounted) {
                            HapticFeedback.mediumImpact();
                            showToast(context,
                                'Meeting request sent to ${widget.boothName}.');
                          }
                        } catch (_) {
                          setSheet(() => sending = false);
                          if (ctx.mounted) {
                            showToast(ctx,
                                "Couldn't send that request. Try again.");
                          }
                        }
                      }),
          ],
        );
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Directory preview'),
      body: ListView(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: AppColors.goldSoft,
            child: const Text('Preview · this is how attendees see your booth',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: AppColors.goldHover,
                    fontSize: 12,
                    fontWeight: FontWeight.w600)),
          ),
          Container(
            height: 120,
            decoration: const BoxDecoration(
              gradient:
                  LinearGradient(colors: [AppColors.forest, AppColors.forestDark]),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.boothName,
                    style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 20,
                        fontWeight: FontWeight.w700)),
                if (widget.category != null) ...[
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, children: [
                    for (final c in widget.category!.split(','))
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                            color: AppColors.forestSoft,
                            borderRadius: BorderRadius.circular(999)),
                        child: Text(c.trim(),
                            style: const TextStyle(
                                color: AppColors.forest, fontSize: 12)),
                      ),
                  ]),
                ],
                const SizedBox(height: 12),
                Text(
                    (widget.description != null &&
                            widget.description!.trim().isNotEmpty)
                        ? widget.description!
                        : 'No description yet.',
                    style: const TextStyle(
                        color: AppColors.inkSoft, fontSize: 14, height: 1.5)),
                const SizedBox(height: 16),
                MButton('Request meeting',
                    icon: Icons.event_outlined, onTap: _requestMeeting),
                const SizedBox(height: 20),
                const Text('Products',
                    style: TextStyle(
                        color: AppColors.ink,
                        fontSize: 15,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                FutureBuilder<List<Map<String, dynamic>>>(
                  future: _future,
                  builder: (context, snap) {
                    if (snap.connectionState == ConnectionState.waiting) {
                      return const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Align(
                            alignment: Alignment.centerLeft,
                            child: SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2.2,
                                    color: AppColors.forest))),
                      );
                    }
                    if (snap.hasError) {
                      return const Text('Products could not be loaded.',
                          style: TextStyle(
                              color: AppColors.inkMuted, fontSize: 13));
                    }
                    final products = snap.data ?? [];
                    if (products.isEmpty) {
                      return const Text('No products listed.',
                          style: TextStyle(
                              color: AppColors.inkMuted, fontSize: 13));
                    }
                    return Column(
                      children: [
                        for (final p in products)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                    color: AppColors.creamSoft,
                                    borderRadius: BorderRadius.circular(10)),
                                child: const Icon(Icons.image_outlined,
                                    color: AppColors.inkMuted, size: 18),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text((p['name'] ?? '').toString(),
                                        style: const TextStyle(
                                            color: AppColors.ink,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600)),
                                    if ((p['description'] ?? '')
                                        .toString()
                                        .isNotEmpty)
                                      Text((p['description']).toString(),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                              color: AppColors.inkSoft,
                                              fontSize: 12.5)),
                                  ],
                                ),
                              ),
                            ]),
                          ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static String _stamp(DateTime at) {
    final l = at.toLocal();
    return '${l.month}/${l.day}/${l.year} · ${l.hour}:${l.minute.toString().padLeft(2, '0')}';
  }
}
