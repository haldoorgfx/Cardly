/// App-level config (non-secret).
///
/// The render API base URL — where the existing Next.js `/api/render` endpoint
/// is deployed. This is the live web app's domain. Change it if your production
/// domain differs.
///
/// The live production domain is `https://eventera.so` — the app calls it for
/// `/api/render` and for building shareable event links. If the production
/// domain ever changes, update this one constant.
class AppConfig {
  static const String renderBaseUrl = 'https://eventera.so';

  static Uri get renderEndpoint => Uri.parse('$renderBaseUrl/api/render');
}
