// Offline preparation (G2 · O02) — pre-event data download.
//
// A normal light-theme organizer screen (NOT a scanner, so no dark surface). It
// caches the event's attendees + entitlements + days so the scanner keeps
// working with no signal. Real progress, a "Ready — N cached" result with the
// last-synced time, and an error state with Retry.

import 'package:flutter/material.dart';

import '../../offline/event_cache.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

class OfflinePrepareScreen extends StatefulWidget {
  final String eventId;
  final String eventName;
  const OfflinePrepareScreen({
    super.key,
    required this.eventId,
    required this.eventName,
  });

  @override
  State<OfflinePrepareScreen> createState() => _OfflinePrepareScreenState();
}

enum _Phase { idle, downloading, ready, error }

class _OfflinePrepareScreenState extends State<OfflinePrepareScreen> {
  _Phase _phase = _Phase.idle;
  double _progress = 0;
  String _step = '';
  String? _error;
  CachedEvent? _cache;

  @override
  void initState() {
    super.initState();
    _loadExisting();
  }

  Future<void> _loadExisting() async {
    final existing = await EventCache.load(widget.eventId);
    if (!mounted) return;
    setState(() {
      _cache = existing;
      _phase = existing != null ? _Phase.ready : _Phase.idle;
    });
  }

  Future<void> _download() async {
    setState(() {
      _phase = _Phase.downloading;
      _progress = 0;
      _step = 'Starting';
      _error = null;
    });
    try {
      final cache = await EventCache.download(
        widget.eventId,
        onProgress: (p) {
          if (!mounted) return;
          setState(() {
            _progress = p.fraction;
            _step = p.label;
          });
        },
      );
      if (!mounted) return;
      setState(() {
        _cache = cache;
        _phase = _Phase.ready;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = _Phase.error;
        _error = describeError(e, context: "this event's offline data");
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Offline check-in', hairline: true),
      body: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.eventName,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppText.h2),
            const SizedBox(height: 6),
            Text(
              'Cache attendees and passes so scanning works with no signal.',
              style: AppText.bodySm,
            ),
            const SizedBox(height: 20),
            _body(),
          ],
        ),
      ),
    );
  }

  Widget _body() {
    switch (_phase) {
      case _Phase.downloading:
        return _DownloadingCard(progress: _progress, step: _step);
      case _Phase.error:
        return _ErrorCard(message: _error ?? 'Something went wrong', onRetry: _download);
      case _Phase.ready:
        return _ReadyCard(
          cache: _cache,
          onRefresh: _download,
        );
      case _Phase.idle:
        return _IdleCard(onDownload: _download);
    }
  }
}

class _IdleCard extends StatelessWidget {
  final VoidCallback onDownload;
  const _IdleCard({required this.onDownload});
  @override
  Widget build(BuildContext context) {
    return MCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              _iconBadge(Icons.cloud_download_outlined),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Not downloaded', style: AppText.h3.copyWith(fontSize: 16)),
                    const SizedBox(height: 2),
                    Text('Download before you lose signal.', style: AppText.bodySm),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          MButton('Download event data', icon: Icons.download, onTap: onDownload),
        ],
      ),
    );
  }
}

class _DownloadingCard extends StatelessWidget {
  final double progress;
  final String step;
  const _DownloadingCard({required this.progress, required this.step});
  @override
  Widget build(BuildContext context) {
    final pct = (progress.clamp(0, 1) * 100).round();
    return MCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(step, style: AppText.h3.copyWith(fontSize: 16)),
              const Spacer(),
              Text('$pct%', style: AppText.numMd),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress <= 0 ? null : progress.clamp(0, 1).toDouble(),
              minHeight: 8,
              backgroundColor: AppColors.creamSoft,
              valueColor: const AlwaysStoppedAnimation(AppColors.forest),
            ),
          ),
          const SizedBox(height: 12),
          Text('Keep this screen open until it finishes.', style: AppText.bodySm),
        ],
      ),
    );
  }
}

class _ReadyCard extends StatelessWidget {
  final CachedEvent? cache;
  final VoidCallback onRefresh;
  const _ReadyCard({required this.cache, required this.onRefresh});
  @override
  Widget build(BuildContext context) {
    final n = cache?.registrationCount ?? 0;
    final synced = cache?.lastSyncedAt;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        MCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  _iconBadge(Icons.check_circle_outline, color: AppColors.success),
                  const SizedBox(width: 13),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Ready — $n cached', style: AppText.h3.copyWith(fontSize: 16)),
                        const SizedBox(height: 2),
                        Text(
                          synced == null
                              ? 'Synced just now'
                              : 'Synced ${_ago(synced)}',
                          style: AppText.bodySm,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        MButton('Refresh cache', kind: MBtnKind.sec, icon: Icons.refresh, onTap: onRefresh),
      ],
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorCard({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    return MCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              _iconBadge(Icons.cloud_off_outlined, color: AppColors.danger),
              const SizedBox(width: 13),
              Expanded(
                child: Text(message, style: AppText.bodySm.copyWith(color: AppColors.inkSoft)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          MButton('Retry', icon: Icons.refresh, onTap: onRetry),
        ],
      ),
    );
  }
}

Widget _iconBadge(IconData icon, {Color color = AppColors.forest}) => Container(
      width: 44,
      height: 44,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: color, size: 22),
    );

String _ago(DateTime tUtc) {
  final t = tUtc.toLocal();
  final d = DateTime.now().difference(t);
  if (d.inMinutes < 1) return 'just now';
  if (d.inMinutes < 60) return '${d.inMinutes} min ago';
  if (d.inHours < 24) return '${d.inHours} h ago';
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  final h = t.hour.toString().padLeft(2, '0');
  final m = t.minute.toString().padLeft(2, '0');
  return '${months[t.month - 1]} ${t.day}, $h:$m';
}
