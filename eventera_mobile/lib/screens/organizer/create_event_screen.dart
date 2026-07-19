import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../eventera_api.dart';
import '../../organize/organizer_api.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Create a new event: name it, upload the card design (background), optionally
/// set when + where, then create. The event, its default variant AND a draft
/// `event_pages` row (schedule) are all written — so the event shows up with a
/// date instead of coming out schedule-less. Editable card zones are placed
/// later in the field editor.
class CreateEventScreen extends StatefulWidget {
  const CreateEventScreen({super.key});

  @override
  State<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends State<CreateEventScreen> {
  final _api = EventeraApi();
  final _org = const OrganizerApi();
  final _picker = ImagePicker();
  final _name = TextEditingController();
  final _desc = TextEditingController();
  final _venue = TextEditingController();
  final _city = TextEditingController();

  Uint8List? _imageBytes;
  String _contentType = 'image/jpeg';
  DateTime? _startsAt;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _desc.dispose();
    _venue.dispose();
    _city.dispose();
    super.dispose();
  }

  Future<void> _pickDesign() async {
    HapticFeedback.selectionClick();
    try {
      final picked = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 3000,
        maxHeight: 3000,
        imageQuality: 95,
      );
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      if (!mounted) return;
      setState(() {
        _imageBytes = bytes;
        _contentType = picked.path.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg';
        _error = null;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _error = describeError(e, context: 'that image'));
      }
    }
  }

  Future<void> _pickWhen() async {
    HapticFeedback.selectionClick();
    final now = DateTime.now();
    final base = _startsAt ?? now;
    final date = await showDatePicker(
      context: context,
      initialDate: base.isBefore(now) ? now : base,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 5),
      builder: _pickerTheme,
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(base),
      builder: _pickerTheme,
    );
    if (!mounted) return;
    setState(() {
      _startsAt = DateTime(
        date.year,
        date.month,
        date.day,
        time?.hour ?? 9,
        time?.minute ?? 0,
      );
    });
  }

  Widget _pickerTheme(BuildContext context, Widget? child) {
    return Theme(
      data: Theme.of(context).copyWith(
        colorScheme: const ColorScheme.light(
          primary: AppColors.forest,
          onPrimary: Colors.white,
          onSurface: AppColors.ink,
        ),
      ),
      child: child!,
    );
  }

  Future<void> _create() async {
    FocusScope.of(context).unfocus();
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Give your event a name.');
      return;
    }
    if (_imageBytes == null) {
      setState(() => _error = 'Add a card design first.');
      return;
    }
    HapticFeedback.lightImpact();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final eventId = await _api.createEvent(
        name: _name.text,
        imageBytes: _imageBytes!,
        contentType: _contentType,
      );
      // Seed the schedule row so the event isn't date-/venue-less. Non-fatal:
      // the event already exists, so a page hiccup shouldn't block the flow.
      try {
        await _org.upsertEventPage(
          eventId,
          title: _name.text,
          startsAt: _startsAt,
          venueName: _venue.text,
          city: _city.text,
          description: _desc.text,
          isPublic: false,
        );
      } catch (_) {/* schedule can be added later in event settings */}

      if (!mounted) return;
      Navigator.of(context).pop(true);
      showToast(context, 'Event created — it\'s in your events as a draft.');
    } on EventeraException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) {
        setState(() => _error = describeError(e, context: 'the event'));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'New event'),
      bottomBar: StickyCta(children: [
        Expanded(
          child: MButton(
            'Create event',
            icon: Icons.add,
            loading: _busy,
            onTap: _busy ? null : _create,
          ),
        ),
      ]),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        children: [
          // Card design — required.
          const SectionLabel('Card design'),
          const SizedBox(height: 8),
          Text(
            'Upload your finished design (PNG or JPG). You\'ll place the name '
            'and photo areas on it next.',
            style: AppText.bodySm,
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: _pickDesign,
            child: Container(
              height: 240,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.card),
                border: Border.all(
                  color: _error != null && _imageBytes == null
                      ? AppColors.danger
                      : AppColors.border,
                ),
                boxShadow: AppShadow.soft,
              ),
              clipBehavior: Clip.antiAlias,
              child: _imageBytes == null
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: AppColors.forestSoft,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.add_photo_alternate_outlined,
                              color: AppColors.forest, size: 26),
                        ),
                        const SizedBox(height: 12),
                        Text('Tap to upload your design',
                            style: AppText.bodySm
                                .copyWith(color: AppColors.inkSoft)),
                      ],
                    )
                  : Image.memory(_imageBytes!, fit: BoxFit.contain),
            ),
          ),
          if (_imageBytes != null) ...[
            const SizedBox(height: 8),
            Center(
              child: MButton('Change design',
                  kind: MBtnKind.text, fullWidth: false, onTap: _pickDesign),
            ),
          ],
          const SizedBox(height: 22),

          // Name — required.
          MInput(
            label: 'Event name',
            hint: 'e.g. Design Summit 2026',
            controller: _name,
            action: TextInputAction.next,
          ),
          const SizedBox(height: 18),

          // Description — optional. Writes event_pages.description so the event
          // isn't content-less like web-created events (parity).
          MInput(
            label: 'Description (optional)',
            hint: 'What is this event about? Who is it for?',
            controller: _desc,
            minLines: 3,
            maxLines: 6,
            keyboardType: TextInputType.multiline,
          ),
          const SizedBox(height: 18),

          // When — optional.
          Text('When', style: AppText.label),
          const SizedBox(height: 7),
          GestureDetector(
            onTap: _pickWhen,
            behavior: HitTestBehavior.opaque,
            child: Container(
              height: 50,
              padding: const EdgeInsets.symmetric(horizontal: 15),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.input),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(children: [
                const Icon(Icons.event_outlined,
                    size: 18, color: AppColors.inkMuted),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _startsAt == null ? 'Add date & time' : _formatWhen(_startsAt!),
                    style: AppText.body.copyWith(
                      color: _startsAt == null
                          ? AppColors.inkMuted
                          : AppColors.ink,
                    ),
                  ),
                ),
                if (_startsAt != null)
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _startsAt = null);
                    },
                    child: const Icon(Icons.close,
                        size: 18, color: AppColors.inkMuted),
                  )
                else
                  const Icon(Icons.chevron_right,
                      size: 18, color: AppColors.inkMuted),
              ]),
            ),
          ),
          const SizedBox(height: 18),

          // Where — optional.
          MInput(
            label: 'Venue (optional)',
            hint: 'e.g. Djibouti Palace Kempinski',
            controller: _venue,
            action: TextInputAction.next,
          ),
          const SizedBox(height: 14),
          MInput(
            label: 'City (optional)',
            hint: 'e.g. Djibouti',
            controller: _city,
            action: TextInputAction.done,
          ),

          if (_error != null) ...[
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.error_outline,
                    color: AppColors.danger, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_error!,
                      style: AppText.bodySm.copyWith(color: AppColors.danger)),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  static const _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  String _formatWhen(DateTime d) {
    final h = d.hour == 0 ? 12 : (d.hour > 12 ? d.hour - 12 : d.hour);
    final ampm = d.hour >= 12 ? 'PM' : 'AM';
    final min = d.minute.toString().padLeft(2, '0');
    return '${d.day} ${_months[d.month - 1]} ${d.year} · $h:$min $ampm';
  }
}
