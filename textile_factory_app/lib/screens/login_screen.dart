import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController =
      TextEditingController();
  final TextEditingController _passwordController =
      TextEditingController();

  bool _isSubmitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please enter email and password"),
        ),
      );
      return;
    }

    if (!_isValidEmail(email)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please enter a valid email"),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final response = await http.post(
        Uri.parse("${ApiConfig.baseUrl}/auth/login"),
        headers: {
          "Content-Type": "application/json",
        },
        body: jsonEncode({
          "email": email,
          "password": password,
        }),
      );

        if (response.statusCode == 200 ||
          response.statusCode == 201) {
        final data = jsonDecode(response.body)
            as Map<String, dynamic>;
        final token = data["access_token"] as String?;
        final user = data["user"] as Map<String, dynamic>?;

        if (token == null || token.isEmpty) {
          final message =
              _extractMessageFromBody(data);
          if (!mounted) return;
          ScaffoldMessenger.of(context)
              .showSnackBar(
            SnackBar(content: Text(message)),
          );
          return;
        }

        if (user != null &&
            user["email"] is String &&
            (user["email"] as String)
                .toLowerCase() !=
            email.toLowerCase()) {
          if (!mounted) return;
          ScaffoldMessenger.of(context)
              .showSnackBar(
            const SnackBar(
              content: Text(
                  "Email does not match the account"),
            ),
          );
          return;
        }

        final prefs =
            await SharedPreferences.getInstance();
        await prefs.setString("access_token", token);

        if (user != null) {
          final username = user["username"] as String?;
          final userEmail = user["email"] as String?;
          final roles = user["roles"];

          await prefs.setString(
            "user_json",
            jsonEncode(user),
          );

          if (username != null && username.isNotEmpty) {
            await prefs.setString("username", username);
          }
          if (userEmail != null && userEmail.isNotEmpty) {
            await prefs.setString("email", userEmail);
          }
          if (roles is List) {
            final roleNames = roles
                .whereType<String>()
                .toList();
            if (roleNames.isNotEmpty) {
              await prefs.setString(
                  "roles", roleNames.join(", "));
            }
          }
        }

        if (!mounted) return;

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) =>
                const DashboardScreen(),
          ),
        );
      } else {
        final message = _extractErrorMessage(response);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Login failed: $error"),
        ),
      );
    } finally {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  String _extractErrorMessage(http.Response response) {
    try {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) {
        final message = data["message"] ?? data["detail"];
        if (message is String && message.isNotEmpty) {
          return message;
        }
      }
    } catch (_) {
      // Fall back to status code below when response isn't JSON.
    }

    return "Login failed (HTTP ${response.statusCode})";
  }

  String _extractMessageFromBody(
      Map<String, dynamic> data) {
    final message = data["message"] ?? data["detail"];
    if (message is String && message.isNotEmpty) {
      return message;
    }
    return "Login failed: missing access token";
  }

  bool _isValidEmail(String email) {
    final emailRegex = RegExp(
      r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    );
    return emailRegex.hasMatch(email);
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text("Login"),
      ),

      body: Padding(
        padding: const EdgeInsets.all(20),

        child: Column(
          mainAxisAlignment:
              MainAxisAlignment.center,

          children: [

            const Icon(
              Icons.factory,
              size: 90,
              color: Colors.indigo,
            ),

            const SizedBox(height: 20),

            const Text(
              "Textile Factory App",

              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 40),

            TextField(
              controller: _emailController,
              keyboardType:
                  TextInputType.emailAddress,
              autofillHints: const [
                AutofillHints.email,
              ],
              decoration: InputDecoration(
                labelText: "Email",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),

            TextField(
              controller: _passwordController,
              obscureText: true,
              autofillHints: const [
                AutofillHints.password,
              ],

              decoration: InputDecoration(
                labelText: "Password",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 30),

            SizedBox(
              width: double.infinity,
              height: 50,

              child: ElevatedButton(

                style:
                    ElevatedButton.styleFrom(
                  shape:
                      RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(12),
                  ),
                ),

                onPressed: _isSubmitting
                    ? null
                    : _login,

                child: _isSubmitting
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child:
                            CircularProgressIndicator(
                          strokeWidth: 2,
                        ),
                      )
                    : const Text("Login"),
              ),
            )
          ],
        ),
      ),
    );
  }
}