import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../eventera_api.dart';
import '../../theme.dart';

/// Create a new event: name it, upload the card design (background), create.
/// Defining the editable zones happens later in the editor.
class CreateEventScreen extends StatefulWidget {
  const CreateEventScreen({super.key});

  @override
  State<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends State<CreateEventScreen> {
  final _api = EventeraApi();
  final _picker = ImagePicker();
  final _name = TextEditingController();

  Uint8List? _imageBytes;
  String _contentType = 'image/jpeg';
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _pickDesign() async {
    try {
      final picked = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 3000,
        maxHeight: 3000,
        imageQuality: 95,
      );
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      setState(() {
        _imageBytes = bytes;
        _contentType =
            picked.path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        _error = null;
      });
    } catch (_) {
      setState(() => _error = 'Could not load that image.');
    }
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
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await _api.createEvent(
        name: _name.text,
        imageBytes: _imageBytes!,
        contentType: _contentType,
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Event created — it’s in your dashboard as a draft.')),
      );
    } on EventeraException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        title: const Text('New event',
            style: TextStyle(
                color: Brand.ink, fontSize: 17, fontWeight: FontWeight.w600)),
        iconTheme: const IconThemeData(color: Brand.ink),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text('Event name',
                style: TextStyle(
                    color: Brand.inkSoft,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            TextField(
              controller: _name,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                  hintText: 'e.g. Design Summit 2026'),
            ),
            const SizedBox(height: 22),
            const Text('Card design',
                style: TextStyle(
                    color: Brand.inkSoft,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            const Text(
              'Upload your finished design (PNG or JPG). You’ll place the name and photo areas on it next.',
              style: TextStyle(color: Brand.muted, fontSize: 13, height: 1.5),
            ),
            const SizedBox(height: 12),
            GestureDetector(
              onTap: _pickDesign,
              child: Container(
                height: 260,
                decoration: BoxDecoration(
                  color: Brand.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                      color: _error != null && _imageBytes == null
                          ? Brand.danger
                          : Brand.border),
                ),
                clipBehavior: Clip.antiAlias,
                child: _imageBytes == null
                    ? const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate_outlined,
                              color: Brand.muted, size: 34),
                          SizedBox(height: 10),
                          Text('Tap to upload your design',
                              style:
                                  TextStyle(color: Brand.muted, fontSize: 14)),
                        ],
                      )
                    : Image.memory(_imageBytes!, fit: BoxFit.contain),
              ),
            ),
            if (_imageBytes != null) ...[
              const SizedBox(height: 8),
              Center(
                child: TextButton(
                  onPressed: _pickDesign,
                  child: const Text('Change design',
                      style: TextStyle(color: Brand.forest)),
                ),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 14),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.error_outline, color: Brand.danger, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(_error!,
                        style: const TextStyle(
                            color: Brand.danger, fontSize: 13.5)),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 22),
            FilledButton(
              onPressed: _busy ? null : _create,
              child: _busy
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.5, color: Colors.white),
                    )
                  : const Text('Create event'),
            ),
          ],
        ),
      ),
    );
  }
}
