import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:path_provider/path_provider.dart';

/// A card the attendee generated, saved on this device.
class SavedCard {
  final String id;
  final String eventName;
  final DateTime createdAt;
  final String fileName; // png file inside the cards dir

  SavedCard({
    required this.id,
    required this.eventName,
    required this.createdAt,
    required this.fileName,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'eventName': eventName,
        'createdAt': createdAt.toIso8601String(),
        'fileName': fileName,
      };

  factory SavedCard.fromJson(Map<String, dynamic> j) => SavedCard(
        id: j['id'] as String,
        eventName: (j['eventName'] as String?) ?? 'Event',
        createdAt:
            DateTime.tryParse(j['createdAt'] as String? ?? '') ?? DateTime.now(),
        fileName: j['fileName'] as String,
      );
}

/// Local, on-device store for generated cards. No backend — just files in the
/// app's documents directory plus a small JSON index. Lets attendees re-open
/// and re-share cards they made.
class CardStore {
  CardStore._();
  static final CardStore instance = CardStore._();

  Directory? _dir;

  Future<Directory> _cardsDir() async {
    if (_dir != null) return _dir!;
    final base = await getApplicationDocumentsDirectory();
    final dir = Directory('${base.path}/eventera_cards');
    if (!await dir.exists()) await dir.create(recursive: true);
    _dir = dir;
    return dir;
  }

  Future<File> _indexFile() async {
    final dir = await _cardsDir();
    return File('${dir.path}/index.json');
  }

  /// Every card saved on this device, newest first.
  ///
  /// Returns an empty list ONLY when there genuinely are no cards yet. A read
  /// failure (unreadable or corrupt `index.json`) throws instead of returning
  /// `[]` — swallowing it told the user "No cards yet", i.e. that their cards
  /// were gone, when the file was merely unreadable.
  Future<List<SavedCard>> list() async {
    final f = await _indexFile();
    if (!await f.exists()) return [];
    final raw = jsonDecode(await f.readAsString());
    if (raw is! List) return [];
    final cards = raw
        .whereType<Map<String, dynamic>>()
        .map(SavedCard.fromJson)
        .toList();
    // Newest first.
    cards.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return cards;
  }

  Future<void> _writeIndex(List<SavedCard> cards) async {
    final f = await _indexFile();
    await f.writeAsString(jsonEncode(cards.map((c) => c.toJson()).toList()));
  }

  /// Save a freshly generated card. Returns the stored record.
  Future<SavedCard> save({
    required Uint8List bytes,
    required String eventName,
  }) async {
    final dir = await _cardsDir();
    final id = DateTime.now().microsecondsSinceEpoch.toString();
    final fileName = 'card_$id.png';
    await File('${dir.path}/$fileName').writeAsBytes(bytes);

    final card = SavedCard(
      id: id,
      eventName: eventName,
      createdAt: DateTime.now(),
      fileName: fileName,
    );
    final cards = await list();
    cards.insert(0, card);
    await _writeIndex(cards);
    return card;
  }

  Future<String> filePathFor(SavedCard card) async {
    final dir = await _cardsDir();
    return '${dir.path}/${card.fileName}';
  }

  Future<Uint8List?> bytesFor(SavedCard card) async {
    try {
      final path = await filePathFor(card);
      final f = File(path);
      if (!await f.exists()) return null;
      return await f.readAsBytes();
    } catch (_) {
      return null;
    }
  }

  Future<void> delete(SavedCard card) async {
    try {
      final path = await filePathFor(card);
      final f = File(path);
      if (await f.exists()) await f.delete();
    } catch (_) {}
    final cards = await list();
    cards.removeWhere((c) => c.id == card.id);
    await _writeIndex(cards);
  }
}
