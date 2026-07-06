import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../eventera_api.dart';
import '../models.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import '../widgets/card_preview.dart';
import 'card_reveal_screen.dart';

/// The personalize form: shows the card design, lets the attendee switch
/// between designs (if more than one), fills one field per input zone, then
/// calls the render API and shows the result. Screens 14 (pick a design) and
/// 15 (personalize).
class PersonalizeScreen extends StatefulWidget {
  final EventModel event;
  final VariantModel initialVariant;
  const PersonalizeScreen({
    super.key,
    required this.event,
    required this.initialVariant,
  });

  @override
  State<PersonalizeScreen> createState() => _PersonalizeScreenState();
}

class _PersonalizeScreenState extends State<PersonalizeScreen> {
  final _api = EventeraApi();
  final _picker = ImagePicker();

  late VariantModel _variant;
  final Map<String, TextEditingController> _textControllers = {};
  final Map<String, PhotoUpload> _photos = {};
  final Map<String, Uint8List> _photoPreviews = {};
  final Map<String, String> _errors = {};

  bool _generating = false;
  String? _generateError;

  @override
  void initState() {
    super.initState();
    _variant = widget.initialVariant;
    _buildControllers();
  }

  void _buildControllers() {
    for (final z in _variant.inputZones) {
      if (z.isText) _textControllers[z.id] = TextEditingController();
    }
  }

  void _disposeControllers() {
    for (final c in _textControllers.values) {
      c.dispose();
    }
    _textControllers.clear();
  }

  void _switchVariant(VariantModel v) {
    if (v.id == _variant.id) return;
    setState(() {
      _disposeControllers();
      _photos.clear();
      _photoPreviews.clear();
      _errors.clear();
      _generateError = null;
      _variant = v;
      _buildControllers();
    });
  }

  @override
  void dispose() {
    _disposeControllers();
    super.dispose();
  }

  Future<void> _pickPhoto(ZoneModel zone, ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 2000,
        maxHeight: 2000,
        imageQuality: 90,
      );
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      if (!mounted) return;
      setState(() {
        _photos[zone.id] = PhotoUpload.fromPath(bytes, picked.path);
        _photoPreviews[zone.id] = bytes;
        _errors.remove(zone.id);
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _errors[zone.id] = 'Could not load that photo.');
    }
  }

  void _choosePhotoSource(ZoneModel zone) {
    showMSheet(
      context,
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListTile(
            leading: const Icon(Icons.camera_alt_outlined,
                color: AppColors.forest),
            title: Text('Take a photo', style: AppText.bodyStrong),
            onTap: () {
              Navigator.pop(context);
              _pickPhoto(zone, ImageSource.camera);
            },
          ),
          ListTile(
            leading: const Icon(Icons.photo_library_outlined,
                color: AppColors.forest),
            title: Text('Choose from gallery', style: AppText.bodyStrong),
            onTap: () {
              Navigator.pop(context);
              _pickPhoto(zone, ImageSource.gallery);
            },
          ),
        ],
      ),
    );
  }

  bool _validate() {
    final errs = <String, String>{};
    for (final z in _variant.inputZones) {
      if (!z.required) continue;
      if (z.isPhoto && !_photos.containsKey(z.id)) {
        errs[z.id] = 'Please add a photo';
      } else if (z.isText &&
          (_textControllers[z.id]?.text.trim().isEmpty ?? true)) {
        errs[z.id] = '${z.displayLabel} is required';
      }
    }
    setState(() => _errors
      ..clear()
      ..addAll(errs));
    return errs.isEmpty;
  }

  Future<void> _generate() async {
    FocusScope.of(context).unfocus();
    if (!_validate()) return;
    setState(() {
      _generating = true;
      _generateError = null;
    });
    try {
      final fields = <String, String>{};
      _textControllers.forEach((id, c) => fields[id] = c.text.trim());

      final bytes = await _api.generateCard(
        variantId: _variant.id,
        fields: fields,
        photos: _photos,
      );
      if (!mounted) return;
      // personalize → render → REVEAL → (existing preview + share/download).
      Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => CardRevealScreen(
          imageBytes: bytes,
          eventName: widget.event.name,
        ),
      ));
    } on EventeraException catch (e) {
      if (!mounted) return;
      setState(() => _generateError = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _generateError = 'Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final zones = _variant.inputZones;
    final hasMultiple = widget.event.variants.length > 1;
    return MScaffold(
      appBar: const MAppBar(title: 'Personalize', hairline: true),
      bottomBar: StickyCta(
        children: [
          Expanded(
            child: _generating
                ? Container(
                    height: 56,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.forest,
                      borderRadius: BorderRadius.circular(AppRadius.btn),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2.4, color: Colors.white),
                        ),
                        const SizedBox(width: 11),
                        Text('Generating…',
                            style: AppText.btn.copyWith(color: Colors.white)),
                      ],
                    ),
                  )
                : MButton(
                    'Generate card',
                    kind: MBtnKind.forest,
                    onTap: _generate,
                  ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxl),
        children: [
          // Screen 14/15 · live preview of the chosen design.
          CardPreview(variant: _variant),
          const SizedBox(height: 18),
          if (hasMultiple) ...[
            const SectionLabel('Designs'),
            const SizedBox(height: 12),
            VariantChooser(
              variants: widget.event.variants,
              selectedId: _variant.id,
              onSelected: _switchVariant,
            ),
            const SizedBox(height: 22),
          ],
          if (zones.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'This design has no fields to fill — just generate it.',
                style: AppText.bodySm,
              ),
            ),
          for (final z in zones) ...[
            if (z.isText) _textField(z) else _photoField(z),
            const SizedBox(height: 16),
          ],
          if (_generateError != null) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.danger.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(AppRadius.input),
                border:
                    Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.error_outline,
                      color: AppColors.danger, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(_generateError!,
                        style: AppText.bodySm
                            .copyWith(color: AppColors.danger)),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _textField(ZoneModel z) {
    return MInput(
      label: z.displayLabel + (z.required ? ' *' : ''),
      hint: z.placeholder ?? 'Type here',
      controller: _textControllers[z.id],
      errorText: _errors[z.id],
      onChanged: (_) {
        if (_errors.containsKey(z.id)) setState(() => _errors.remove(z.id));
      },
    );
  }

  // Screen 15 · photo upload row (circle crop, Change).
  Widget _photoField(ZoneModel z) {
    final err = _errors[z.id];
    final preview = _photoPreviews[z.id];
    final isCircle = z.shape == 'circle' || z.shape == null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(z.displayLabel + (z.required ? ' *' : ''), style: AppText.label),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () => _choosePhotoSource(z),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFBFAF6),
              borderRadius: BorderRadius.circular(AppRadius.input),
              border: Border.all(
                  color: err != null ? AppColors.danger : AppColors.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppColors.canvas,
                    shape: isCircle ? BoxShape.circle : BoxShape.rectangle,
                    borderRadius: isCircle ? null : BorderRadius.circular(10),
                    image: preview != null
                        ? DecorationImage(
                            image: MemoryImage(preview), fit: BoxFit.cover)
                        : null,
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: preview == null
                      ? PhotoPlaceholder(
                          hue: hueFromString(z.id),
                          child: const Icon(Icons.add_a_photo_outlined,
                              color: Colors.white70, size: 22),
                        )
                      : null,
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Your photo', style: AppText.bodyStrong),
                      const SizedBox(height: 2),
                      Text(
                        isCircle
                            ? 'Circle crop · looks great centered'
                            : 'Tap to add a photo',
                        style: AppText.bodySm.copyWith(
                            color: AppColors.inkMuted, fontSize: 11.5),
                      ),
                    ],
                  ),
                ),
                MButton(
                  preview == null ? 'Add' : 'Change',
                  kind: MBtnKind.sec,
                  small: true,
                  fullWidth: false,
                  onTap: () => _choosePhotoSource(z),
                ),
              ],
            ),
          ),
        ),
        if (err != null) ...[
          const SizedBox(height: 6),
          Text(err,
              style: AppText.caption
                  .copyWith(color: AppColors.danger, fontSize: 12)),
        ],
      ],
    );
  }
}
