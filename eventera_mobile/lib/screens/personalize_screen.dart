import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../eventera_api.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/card_preview.dart';
import 'preview_screen.dart';

/// The personalize form: shows the card design, lets the attendee switch
/// between designs (if more than one), fills one field per input zone, then
/// calls the render API and shows the result.
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
      setState(() {
        _photos[zone.id] = PhotoUpload.fromPath(bytes, picked.path);
        _photoPreviews[zone.id] = bytes;
        _errors.remove(zone.id);
      });
    } catch (_) {
      setState(() => _errors[zone.id] = 'Could not load that photo.');
    }
  }

  void _choosePhotoSource(ZoneModel zone) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Brand.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Brand.forest),
              title: const Text('Take a photo'),
              onTap: () {
                Navigator.pop(ctx);
                _pickPhoto(zone, ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Brand.forest),
              title: const Text('Choose from gallery'),
              onTap: () {
                Navigator.pop(ctx);
                _pickPhoto(zone, ImageSource.gallery);
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
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
      Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => PreviewScreen(
          imageBytes: bytes,
          eventName: widget.event.name,
        ),
      ));
    } on EventeraException catch (e) {
      setState(() => _generateError = e.message);
    } catch (_) {
      setState(() => _generateError = 'Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final zones = _variant.inputZones;
    final hasMultiple = widget.event.variants.length > 1;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        title: Text(widget.event.name,
            style: const TextStyle(
                color: Brand.ink, fontSize: 17, fontWeight: FontWeight.w600)),
        iconTheme: const IconThemeData(color: Brand.ink),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
          children: [
            CardPreview(variant: _variant),
            const SizedBox(height: 18),
            if (hasMultiple) ...[
              const Text('Choose a design',
                  style: TextStyle(
                      color: Brand.inkSoft,
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              VariantChooser(
                variants: widget.event.variants,
                selectedId: _variant.id,
                onSelected: _switchVariant,
              ),
              const SizedBox(height: 22),
            ],
            const Text('Personalize your card',
                style: TextStyle(
                    color: Brand.ink,
                    fontSize: 22,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            const Text('Fill in your details, then generate.',
                style: TextStyle(color: Brand.muted, fontSize: 14)),
            const SizedBox(height: 22),
            if (zones.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  'This design has no fields to fill — just generate it.',
                  style: TextStyle(color: Brand.muted, fontSize: 14),
                ),
              ),
            for (final z in zones) ...[
              if (z.isText) _textField(z) else _photoField(z),
              const SizedBox(height: 18),
            ],
            if (_generateError != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFBEAE9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.error_outline,
                        color: Brand.danger, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_generateError!,
                          style: const TextStyle(
                              color: Brand.danger, fontSize: 13.5)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            FilledButton(
              onPressed: _generating ? null : _generate,
              child: _generating
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.5, color: Colors.white),
                    )
                  : const Text('Generate my card'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _textField(ZoneModel z) {
    final err = _errors[z.id];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          z.displayLabel + (z.required ? ' *' : ''),
          style: const TextStyle(
              color: Brand.inkSoft, fontSize: 13.5, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _textControllers[z.id],
          decoration: InputDecoration(
            hintText: z.placeholder ?? 'Type here',
            errorText: err,
          ),
        ),
      ],
    );
  }

  Widget _photoField(ZoneModel z) {
    final err = _errors[z.id];
    final preview = _photoPreviews[z.id];
    final isCircle = z.shape == 'circle';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          z.displayLabel + (z.required ? ' *' : ''),
          style: const TextStyle(
              color: Brand.inkSoft, fontSize: 13.5, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () => _choosePhotoSource(z),
          child: Container(
            height: 120,
            decoration: BoxDecoration(
              color: Brand.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: err != null ? Brand.danger : Brand.border),
            ),
            child: Row(
              children: [
                const SizedBox(width: 16),
                Container(
                  width: 84,
                  height: 84,
                  decoration: BoxDecoration(
                    color: Brand.cream,
                    shape: isCircle ? BoxShape.circle : BoxShape.rectangle,
                    borderRadius:
                        isCircle ? null : BorderRadius.circular(10),
                    image: preview != null
                        ? DecorationImage(
                            image: MemoryImage(preview), fit: BoxFit.cover)
                        : null,
                  ),
                  child: preview == null
                      ? const Icon(Icons.add_a_photo,
                          color: Brand.muted, size: 26)
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    preview == null ? 'Tap to add a photo' : 'Tap to change',
                    style: const TextStyle(color: Brand.muted, fontSize: 14),
                  ),
                ),
                const Icon(Icons.chevron_right, color: Brand.muted),
                const SizedBox(width: 12),
              ],
            ),
          ),
        ),
        if (err != null) ...[
          const SizedBox(height: 6),
          Text(err,
              style: const TextStyle(color: Brand.danger, fontSize: 12.5)),
        ],
      ],
    );
  }
}
