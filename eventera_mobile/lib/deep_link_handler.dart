import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';

import 'links.dart';
import 'screens/open_event_screen.dart';

/// Listens for incoming deep links (cold start + while running) and opens the
/// matching event. Wraps the app's home so it stays mounted for the whole
/// session. Navigation goes through the shared [navigatorKey].
class DeepLinkHandler extends StatefulWidget {
  final GlobalKey<NavigatorState> navigatorKey;
  final Widget child;
  const DeepLinkHandler({
    super.key,
    required this.navigatorKey,
    required this.child,
  });

  @override
  State<DeepLinkHandler> createState() => _DeepLinkHandlerState();
}

class _DeepLinkHandlerState extends State<DeepLinkHandler> {
  final AppLinks _appLinks = AppLinks();
  StreamSubscription<Uri>? _sub;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    // Cold start: a link that launched the app.
    try {
      final initial = await _appLinks.getInitialLink();
      if (initial != null) {
        WidgetsBinding.instance
            .addPostFrameCallback((_) => _handle(initial));
      }
    } catch (_) {
      // No initial link / not supported — ignore.
    }

    // While running: links tapped after the app is already open.
    _sub = _appLinks.uriLinkStream.listen(
      _handle,
      onError: (_) {},
    );
  }

  void _handle(Uri uri) {
    final slug = slugFromUri(uri);
    if (slug == null || slug.isEmpty) return;
    final nav = widget.navigatorKey.currentState;
    if (nav == null) return;
    nav.push(MaterialPageRoute(
      builder: (_) => OpenEventScreen(slug: slug),
    ));
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
