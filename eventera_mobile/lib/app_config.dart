/// App-level config (non-secret).
///
/// The render API base URL — where the existing Next.js `/api/render` endpoint
/// is deployed. This is the live web app's domain. Change it if your production
/// domain differs.
///
/// The live production domain is now `https://eventera.so`. The old
/// `karta.cre8so.com` should remain attached as a Vercel alias during the
/// transition so older installed apps that still point at it keep working.
/// Once no active installs call karta.cre8so.com, that alias can be removed.
class AppConfig {
  static const String renderBaseUrl = 'https://eventera.so';

  static Uri get renderEndpoint => Uri.parse('$renderBaseUrl/api/render');
}
