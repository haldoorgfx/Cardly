/// Extracts an event slug from an incoming deep link or pasted text.
///
/// Handles:
///   https://eventera.app/c/<slug>            (App Link)
///   https://eventera.app/c/<slug>/<variant>  (slug is the first segment)
///   eventera://c/<slug>                       (custom scheme, easy to test)
///   eventera://<slug>
///   a bare slug typed by the user
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
    final slug = _slugFromUri(uri);
    if (slug != null && slug.isNotEmpty) return slug.toLowerCase();
  }

  // Bare slug fallback — strip whitespace.
  return raw.replaceAll(RegExp(r'\s+'), '').toLowerCase();
}

String? slugFromUri(Uri uri) {
  final s = _slugFromUri(uri);
  return s?.toLowerCase();
}

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
