/// App-level config (non-secret).
///
/// The render API base URL — where the existing Next.js `/api/render` endpoint
/// is deployed. This is the live web app's domain. Change it if your production
/// domain differs.
///
/// Found in the web project: `https://eventera.app` (newer) and
/// `https://karta.cre8so.com` (older). Confirm which one currently serves
/// `/api/render` and set it here.
class AppConfig {
  static const String renderBaseUrl = 'https://eventera.app';

  static Uri get renderEndpoint => Uri.parse('$renderBaseUrl/api/render');
}
