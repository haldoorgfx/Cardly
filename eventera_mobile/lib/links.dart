/// Extracts an event slug from an incoming deep link or pasted text.
///
/// Handles:
///   https://eventera.app/c/<slug>            (App Link)
///   https://eventera.app/c/<slug>/<variant>  (slug is the first segment)
///   eventera://c/<slug>                       (custom scheme, easy to test)
///   eventera://<slug>
///   a bare slug typed by the user
/// Event slugs are `lowercase-name-xxxx` — anything outside this shape is a
/// malformed or hostile link, not an event. Deep links come from outside the
/// app, so validate before handing the value to any query.
final _slugShape = RegExp(r'^[a-z0-9][a-z0-9-]{0,79}$');

String? _validSlug(String? s) {
  if (s == null) return null;
  final v = s.toLowerCase();
  return _slugShape.hasMatch(v) ? v : null;
}

String? slugFromText(String input) {
  final raw = input.trim();
  if (raw.isEmpty) return null;

  Uri? uri;
  try {
    uri = Uri.parse(raw);
  } catch (_) {
    uri = null;
  }

  if (uri != null && (uri.hasScheme || raw.contains('/'))) {
    final slug = _validSlug(_slugFromUri(uri));
    if (slug != null) return slug;
  }

  // Bare slug fallback — strip whitespace, then validate the shape.
  return _validSlug(raw.replaceAll(RegExp(r'\s+'), ''));
}

String? slugFromUri(Uri uri) => _validSlug(_slugFromUri(uri));

String? _slugFromUri(Uri uri) {
  // OAuth callback (eventera://login-callback/...) is handled by Supabase, not
  // treated as an event link.
  if (uri.host == 'login-callback' ||
      uri.path.contains('login-callback') ||
      uri.fragment.contains('access_token')) {
    return null;
  }

  final segs = uri.pathSegments.where((s) => s.isNotEmpty).toList();

  // .../c/<slug>
  final ci = segs.indexOf('c');
  if (ci != -1 && ci + 1 < segs.length) return segs[ci + 1];

  // Custom scheme: eventera://c/<slug> or eventera://<slug>
  if (uri.scheme == 'eventera') {
    if (uri.host == 'c' && segs.isNotEmpty) return segs.first;
    if (uri.host.isNotEmpty && uri.host != 'c') return uri.host;
    if (segs.isNotEmpty) return segs.last;
  }

  return null;
}
