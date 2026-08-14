import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '_shared.dart';

/// PhotoWallScreen — the attendee-facing half of the organizer's Photo Wall
/// moderation queue (web: components/events/PhotoWallAdmin.tsx).
///
/// The read used to go straight to `event_photos` via Supabase, which
/// bypassed the admin "photos" platform kill switch entirely (the switch is
/// enforced in the API route, not in RLS). Now routed through a new GET
/// handler on the same route the upload already used, gated by
/// isPlatformFeatureEnabled('photos').
///
/// Contracts:
///  - Read:   GET /api/events/[id]/photos → { photos: [{id, attendee_name,
///            image_url, caption}] }, already scoped to status
///            approved/featured, newest first, capped at 60 (same shape the
///            direct table read used).
///  - Upload: multipart POST /api/events/[id]/photos {file, attendee_name?,
///            caption?} — server-side only, always lands as 'pending'. There
///            is no registration_id column on event_photos, so — same trust
///            level as the web form — this never requires a registration.
class PhotoWallScreen extends StatefulWidget {
  final String eventId;
  const PhotoWallScreen({super.key, required this.eventId});

  @override
  State<PhotoWallScreen> createState() => _PhotoWallScreenState();
}

class _Photo {
  final String id;
  final String? attendeeName;
  final String imageUrl;
  final String? caption;
  _Photo({required this.id, required this.attendeeName, required this.imageUrl, required this.caption});
}

class _PhotoWallScreenState extends State<PhotoWallScreen> {
  bool _loading = true;
  String? _error;
  StatusReason _errorReason = StatusReason.generic;
  List<_Photo> _photos = [];
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await apiGet('/api/events/${widget.eventId}/photos');
      final rows = asMapList(data is Map ? data['photos'] : data);

      final list = <_Photo>[];
      for (final map in rows) {
        list.add(_Photo(
          id: asString(map['id']),
          attendeeName: map['attendee_name'] == null ? null : asString(map['attendee_name']),
          imageUrl: asString(map['image_url']),
          caption: map['caption'] == null ? null : asString(map['caption']),
        ));
      }
      if (!mounted) return;
      setState(() {
        _photos = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'the photo wall');
      setState(() {
        _error = msg;
        _errorReason = _reasonFor(e, msg);
        _loading = false;
      });
    }
  }

  Future<void> _openComposer() async {
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 1600,
      maxHeight: 1600,
      imageQuality: 85,
    );
    if (picked == null || !mounted) return;

    final result = await showMSheet<_ShareResult>(
      context,
      _ShareSheet(imagePath: picked.path),
    );
    if (result == null) return;

    setState(() => _submitting = true);
    try {
      await apiPostMultipart(
        '/api/events/${widget.eventId}/photos',
        filePath: picked.path,
        fileField: 'file',
        fields: {
          if (result.name.isNotEmpty) 'attendee_name': result.name,
          if (result.caption.isNotEmpty) 'caption': result.caption,
        },
      );
      if (mounted) {
        showToast(context, 'Thanks! Your photo is in for review.', type: ToastType.success);
      }
    } catch (e) {
      if (mounted) {
        showToast(context, describeError(e, context: 'your photo'), type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Photo wall', hairline: true),
      bottomBar: _loading || _error != null
          ? null
          : StickyCta(children: [
              Expanded(
                child: MButton('Add your photo',
                    icon: Icons.add_a_photo_outlined,
                    loading: _submitting,
                    onTap: _openComposer),
              ),
            ]),
      body: _body(),
    );
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load, reason: _errorReason);
    }
    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _load,
      child: _photos.isEmpty
          ? ListView(children: [
              SizedBox(height: MediaQuery.of(context).size.height * 0.18),
              EngageState(
                icon: Icons.photo_camera_outlined,
                title: 'No photos yet',
                subtitle: 'Nobody has shared a photo at this event. Yours would be first.',
                action: MButton('Add your photo',
                    icon: Icons.add_a_photo_outlined,
                    fullWidth: false,
                    small: true,
                    onTap: _openComposer),
              ),
            ])
          : GridView.builder(
              padding: const EdgeInsets.fromLTRB(
                  AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.xxxl),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: AppSpace.sm,
                crossAxisSpacing: AppSpace.sm,
                childAspectRatio: 1,
              ),
              itemCount: _photos.length,
              itemBuilder: (_, i) => _photoTile(_photos[i]),
            ),
    );
  }

  Widget _photoTile(_Photo p) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.network(
            p.imageUrl,
            fit: BoxFit.cover,
            errorBuilder: (_, error, stackTrace) => Container(color: AppColors.border),
          ),
          if ((p.caption ?? '').isNotEmpty || (p.attendeeName ?? '').isNotEmpty)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: const EdgeInsets.fromLTRB(8, 14, 8, 6),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0x99000000)],
                  ),
                ),
                child: Text(
                  [p.caption, p.attendeeName].where((s) => (s ?? '').isNotEmpty).join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.caption.copyWith(color: Colors.white, fontSize: 11),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Classifies a caught load error into a [StatusReason] so [ErrorStateView]
/// shows the right icon/copy — network for connectivity, and the
/// ApiException status code for anything the server told us (404 covers the
/// admin "photos" kill switch's 404 response).
StatusReason _reasonFor(Object? error, String message) {
  if (message.toLowerCase().contains("couldn't reach the server")) {
    return StatusReason.network;
  }
  if (error is ApiException) {
    switch (error.status) {
      case 402:
        return StatusReason.plan;
      case 403:
        return StatusReason.permission;
      case 404:
        return StatusReason.notFound;
    }
  }
  return StatusReason.generic;
}

class _ShareResult {
  final String name;
  final String caption;
  _ShareResult(this.name, this.caption);
}

class _ShareSheet extends StatefulWidget {
  final String imagePath;
  const _ShareSheet({required this.imagePath});

  @override
  State<_ShareSheet> createState() => _ShareSheetState();
}

class _ShareSheetState extends State<_ShareSheet> {
  final _nameController = TextEditingController();
  final _captionController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _captionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 4, 0, 4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Share a photo', style: AppText.h3),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.card),
            child: Image.file(
              File(widget.imagePath),
              height: 160,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(height: AppSpace.base),
          MInput(controller: _nameController, hint: 'Your name (optional)'),
          const SizedBox(height: AppSpace.sm),
          MInput(controller: _captionController, hint: 'Caption (optional)'),
          const SizedBox(height: AppSpace.md),
          MButton('Share to the photo wall', onTap: () {
            Navigator.of(context).pop(_ShareResult(
              _nameController.text.trim(),
              _captionController.text.trim(),
            ));
          }),
        ],
      ),
    );
  }
}
