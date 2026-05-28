import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';

class ApiClient {
  static String _buildUrl(String path, {bool withApiPrefix = false}) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    if (!withApiPrefix) {
      return '${ApiConfig.baseUrl}$normalizedPath';
    }

    final base = ApiConfig.baseUrl.endsWith('/')
        ? ApiConfig.baseUrl.substring(0, ApiConfig.baseUrl.length - 1)
        : ApiConfig.baseUrl;

    if (base.endsWith('/api')) {
      return '$base$normalizedPath';
    }

    return '$base/api$normalizedPath';
  }

  static Future<dynamic> _requestWithFallback(
    Future<http.Response> Function(String url) request,
    String path,
  ) async {
    final response = await request(_buildUrl(path));
    if (response.statusCode != 404) {
      return _decodeResponse(response);
    }

    final fallbackResponse = await request(_buildUrl(path, withApiPrefix: true));
    return _decodeResponse(fallbackResponse);
  }

  static Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };

    if (auth) {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('access_token');
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  static Future<dynamic> getJson(String path) async {
    return _requestWithFallback(
      (url) async => http.get(
        Uri.parse(url),
        headers: await _headers(),
      ),
      path,
    );
  }

  static Future<dynamic> postJson(String path, Map<String, dynamic> body) async {
    return _requestWithFallback(
      (url) async => http.post(
        Uri.parse(url),
        headers: await _headers(),
        body: jsonEncode(body),
      ),
      path,
    );
  }

  static dynamic _decodeResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) {
        return null;
      }
      return jsonDecode(response.body);
    }

    try {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) {
        final message = data['message'] ?? data['detail'];
        if (message is String && message.isNotEmpty) {
          throw Exception(message);
        }
      }
    } catch (_) {
      // Fall back to status message below.
    }

    throw Exception('Request failed (HTTP ${response.statusCode})');
  }
}
