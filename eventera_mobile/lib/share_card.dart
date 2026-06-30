import 'dart:io';
import 'dart:typed_data';

import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// A friendly, on-brand suggested caption for sharing a card.
String suggestedCaption(String eventName) {
  final name = eventName.trim().isEmpty ? 'this event' : eventName.trim();
  return "I'll be at $name. See you there. — made with Eventera";
}

String _safeName(String eventName) {
  final s = eventName
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-+|-+$'), '');
  return s.isEmpty ? 'card' : s;
}

/// Writes the PNG to a temp file and opens the OS share sheet (which includes
/// "Save Image" on both Android and iOS).
Future<void> shareCardBytes(Uint8List bytes, String eventName) async {
  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/eventera-${_safeName(eventName)}.png');
  await file.writeAsBytes(bytes);
  await Share.shareXFiles(
    [XFile(file.path, mimeType: 'image/png')],
    text: suggestedCaption(eventName),
  );
}
