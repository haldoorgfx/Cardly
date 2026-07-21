import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../eventera_api.dart';
import '../../models.dart';
import '../../theme.dart';
import '../../ui/components.dart' show describeError, showToast, ToastType;

/// One editable area on the card, in BACKGROUND pixel coordinates.
class EditorZone {
  String id;
  String type; // 'text' | 'photo'
  String label;
  double x, y, w, h;
  bool required;
  String? shape; // photo: circle | square | rounded
  String color; // text colour hex

  EditorZone({
    required this.id,
    required this.type,
    required this.label,
    required this.x,
    required this.y,
    required this.w,
    required this.h,
    required this.required,
    this.shape,
    this.color = '#111111',
  });

  bool get isText => type == 'text';
  bool get isPhoto => type == 'photo';

  factory EditorZone.fromMap(Map<String, dynamic> m) {
    final t = (m['type'] as String?) ?? 'text';
    return EditorZone(
      id: (m['id'] as String?) ?? _newId(),
      type: t == 'photo' ? 'photo' : 'text',
      label: (m['label'] as String?) ?? (t == 'photo' ? 'Photo' : 'Field'),
      x: (m['x'] as num?)?.toDouble() ?? 0,
      y: (m['y'] as num?)?.toDouble() ?? 0,
      w: (m['w'] as num?)?.toDouble() ?? 300,
      h: (m['h'] as num?)?.toDouble() ?? 90,
      required: m['required'] == true,
      shape: m['shape'] as String?,
      color: (m['color'] as String?) ?? '#111111',
    );
  }

  Map<String, dynamic> toMap() {
    final base = <String, dynamic>{
      'id': id,
      'type': type,
      'label': label,
      'x': x.round(),
      'y': y.round(),
      'w': w.round(),
      'h': h.round(),
      'required': required,
    };
    if (isText) {
      base.addAll({
        'font': 'Inter',
        'size': (h * 0.55).clamp(12, 240).round(),
        'weight': 600,
        'color': color,
        'align': 'center',
        'placeholder': label,
      });
    } else {
      base['shape'] = shape ?? 'circle';
    }
    return base;
  }

  static String _newId() =>
      'z${DateTime.now().microsecondsSinceEpoch}${Random().nextInt(999)}';
}

class ZoneEditorScreen extends StatefulWidget {
  final OwnedEvent event;
  const ZoneEditorScreen({super.key, required this.event});

  @override
  State<ZoneEditorScreen> createState() => _ZoneEditorScreenState();
}

class _ZoneEditorScreenState extends State<ZoneEditorScreen> {
  final _api = EventeraApi();
  late List<EditorZone> _zones;
  String? _selectedId;
  bool _saving = false;

  double get _bgW => widget.event.bgWidth.toDouble();
  double get _bgH => widget.event.bgHeight.toDouble();

  @override
  void initState() {
    super.initState();
    _zones = widget.event.zonesRaw.map(EditorZone.fromMap).toList();
  }

  EditorZone? get _selected {
    for (final z in _zones) {
      if (z.id == _selectedId) return z;
    }
    return null;
  }

  void _addText() {
    final w = _bgW * 0.6, h = _bgH * 0.08;
    setState(() {
      final z = EditorZone(
        id: EditorZone._newId(),
        type: 'text',
        label: 'Full name',
        x: (_bgW - w) / 2,
        y: _bgH * 0.42,
        w: w,
        h: h,
        required: true,
      );
      _zones.add(z);
      _selectedId = z.id;
    });
  }

  void _addPhoto() {
    final w = _bgW * 0.32;
    setState(() {
      final z = EditorZone(
        id: EditorZone._newId(),
        type: 'photo',
        label: 'Photo',
        x: (_bgW - w) / 2,
        y: _bgH * 0.18,
        w: w,
        h: w,
        required: true,
        shape: 'circle',
      );
      _zones.add(z);
      _selectedId = z.id;
    });
  }

  void _deleteSelected() {
    setState(() {
      _zones.removeWhere((z) => z.id == _selectedId);
      _selectedId = null;
    });
  }

  Future<void> _save() async {
    HapticFeedback.lightImpact();
    setState(() => _saving = true);
    try {
      await _api.saveZones(
          widget.event.variantId, _zones.map((z) => z.toMap()).toList());
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        showToast(context, describeError(e, context: 'these fields'),
            type: ToastType.error);
      }
    } finally {
      // On success this used to stay true and rely entirely on the pop above —
      // so if the screen was no longer mounted it never popped AND never
      // cleared, leaving the editor stuck on a spinning Save button.
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEDE7DC),
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        title: const Text('Edit fields',
            style: TextStyle(
                color: Brand.ink, fontSize: 17, fontWeight: FontWeight.w600)),
        iconTheme: const IconThemeData(color: Brand.ink),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2.3, color: Brand.forest)),
                  )
                : const Text('Save',
                    style: TextStyle(
                        color: Brand.forest,
                        fontSize: 15,
                        fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: Column(
        children: [
          Expanded(child: _canvas()),
          _selected != null ? _settingsPanel(_selected!) : _addBar(),
        ],
      ),
    );
  }

  Widget _canvas() {
    return LayoutBuilder(
      builder: (ctx, c) {
        final pad = 16.0;
        final availW = c.maxWidth - pad * 2;
        final availH = c.maxHeight - pad * 2;
        final scale = min(availW / _bgW, availH / _bgH);
        final cw = _bgW * scale;
        final ch = _bgH * scale;
        return Center(
          child: GestureDetector(
            onTap: () => setState(() => _selectedId = null),
            child: SizedBox(
              width: cw,
              height: ch,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Background design
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        boxShadow: const [
                          BoxShadow(
                              color: Color(0x22000000),
                              blurRadius: 18,
                              offset: Offset(0, 8)),
                        ],
                      ),
                      child: widget.event.backgroundUrl == null
                          ? const SizedBox()
                          : Image.network(widget.event.backgroundUrl!,
                              fit: BoxFit.fill,
                              // The zone boxes are drawn on top of this, so
                              // without a loading state the editor briefly
                              // shows zones floating over a blank canvas.
                              loadingBuilder: (ctx, child, progress) =>
                                  progress == null
                                      ? child
                                      : const Center(
                                          child: SizedBox(
                                            width: 22,
                                            height: 22,
                                            child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                color: Brand.muted),
                                          ),
                                        ),
                              errorBuilder: (_, __, ___) => const Center(
                                  child: Text('Could not load design',
                                      style: TextStyle(color: Brand.muted)))),
                    ),
                  ),
                  for (final z in _zones) _zoneBox(z, scale),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _zoneBox(EditorZone z, double scale) {
    final selected = z.id == _selectedId;
    return Positioned(
      left: z.x * scale,
      top: z.y * scale,
      width: z.w * scale,
      height: z.h * scale,
      child: GestureDetector(
        onTap: () => setState(() => _selectedId = z.id),
        onPanUpdate: (d) {
          setState(() {
            z.x = (z.x + d.delta.dx / scale).clamp(0, _bgW - z.w);
            z.y = (z.y + d.delta.dy / scale).clamp(0, _bgH - z.h);
            _selectedId = z.id;
          });
        },
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              decoration: BoxDecoration(
                color: (selected ? Brand.forest : Brand.gold)
                    .withValues(alpha: 0.16),
                border: Border.all(
                    color: selected ? Brand.forest : Brand.gold,
                    width: selected ? 2 : 1.4),
                borderRadius: BorderRadius.circular(
                    z.isPhoto && z.shape == 'circle' ? 999 : 6),
              ),
              alignment: Alignment.center,
              child: Padding(
                padding: const EdgeInsets.all(2),
                child: Text(
                  z.isPhoto ? '◇ ${z.label}' : z.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: selected ? Brand.forest : Brand.forestDark,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            if (selected)
              Positioned(
                right: -10,
                bottom: -10,
                child: GestureDetector(
                  onPanUpdate: (d) {
                    setState(() {
                      z.w = (z.w + d.delta.dx / scale)
                          .clamp(_bgW * 0.06, _bgW - z.x);
                      z.h = (z.h + d.delta.dy / scale)
                          .clamp(_bgH * 0.03, _bgH - z.y);
                    });
                  },
                  child: Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: Brand.forest,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Icon(Icons.open_in_full,
                        color: Colors.white, size: 11),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _addBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: const BoxDecoration(
        color: Brand.surface,
        border: Border(top: BorderSide(color: Brand.border)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Brand.forest,
                  side: const BorderSide(color: Brand.border),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _addText,
                icon: const Icon(Icons.text_fields, size: 20),
                label: const Text('Add text'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Brand.forest,
                  side: const BorderSide(color: Brand.border),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _addPhoto,
                icon: const Icon(Icons.add_a_photo_outlined, size: 20),
                label: const Text('Add photo'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _settingsPanel(EditorZone z) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      decoration: const BoxDecoration(
        color: Brand.surface,
        border: Border(top: BorderSide(color: Brand.border)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(z.isPhoto ? Icons.photo_outlined : Icons.text_fields,
                    color: Brand.forest, size: 18),
                const SizedBox(width: 8),
                Text(z.isPhoto ? 'Photo field' : 'Text field',
                    style: const TextStyle(
                        color: Brand.ink,
                        fontSize: 15,
                        fontWeight: FontWeight.w600)),
                const Spacer(),
                IconButton(
                  onPressed: _deleteSelected,
                  icon: const Icon(Icons.delete_outline,
                      color: Brand.danger, size: 22),
                ),
              ],
            ),
            const SizedBox(height: 6),
            TextFormField(
              key: ValueKey('label_${z.id}'),
              initialValue: z.label,
              decoration: const InputDecoration(
                  labelText: 'Label (what the attendee fills in)'),
              onChanged: (v) => z.label = v,
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Text('Required',
                    style: TextStyle(color: Brand.inkSoft, fontSize: 14)),
                const Spacer(),
                Switch(
                  activeThumbColor: Colors.white, activeTrackColor: Brand.forest,
                  value: z.required,
                  onChanged: (v) => setState(() => z.required = v),
                ),
              ],
            ),
            if (z.isPhoto)
              Row(
                children: [
                  const Text('Shape',
                      style: TextStyle(color: Brand.inkSoft, fontSize: 14)),
                  const Spacer(),
                  _shapeChoice(z, 'circle', 'Circle'),
                  const SizedBox(width: 8),
                  _shapeChoice(z, 'square', 'Square'),
                  const SizedBox(width: 8),
                  _shapeChoice(z, 'rounded', 'Rounded'),
                ],
              ),
            if (z.isText)
              Row(
                children: [
                  const Text('Text colour',
                      style: TextStyle(color: Brand.inkSoft, fontSize: 14)),
                  const Spacer(),
                  _colorChoice(z, '#111111', Brand.ink),
                  const SizedBox(width: 10),
                  _colorChoice(z, '#FFFFFF', Colors.white),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _shapeChoice(EditorZone z, String value, String label) {
    final on = (z.shape ?? 'circle') == value;
    return GestureDetector(
      onTap: () => setState(() => z.shape = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: on ? Brand.forest : Brand.cream,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: on ? Brand.forest : Brand.border),
        ),
        child: Text(label,
            style: TextStyle(
                color: on ? Colors.white : Brand.inkSoft, fontSize: 12.5)),
      ),
    );
  }

  Widget _colorChoice(EditorZone z, String hex, Color color) {
    final on = z.color.toUpperCase() == hex.toUpperCase();
    return GestureDetector(
      onTap: () => setState(() => z.color = hex),
      child: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(
              color: on ? Brand.forest : Brand.border,
              width: on ? 2.5 : 1),
        ),
      ),
    );
  }
}
