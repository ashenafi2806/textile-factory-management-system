import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String? _username;
  String? _email;
  String? _roles;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString("user_json");
    String? username;
    String? email;
    String? roles;

    if (userJson != null && userJson.isNotEmpty) {
      try {
        final data =
            jsonDecode(userJson) as Map<String, dynamic>;
        username = data["username"] as String?;
        email = data["email"] as String?;
        final roleList = data["roles"];
        if (roleList is List) {
          final roleNames = roleList
              .whereType<String>()
              .toList();
          if (roleNames.isNotEmpty) {
            roles = roleNames.join(", ");
          }
        }
      } catch (_) {
        // Fall back to stored fields below.
      }
    }

    setState(() {
      _username = username ?? prefs.getString("username");
      _email = email ?? prefs.getString("email");
      _roles = roles ?? prefs.getString("roles");
      _isLoading = false;
    });
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove("access_token");
    await prefs.remove("username");
    await prefs.remove("email");
    await prefs.remove("roles");
    await prefs.remove("user_json");

    if (!mounted) return;

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(
        builder: (context) => const LoginScreen(),
      ),
      (route) => false,
    );
  }

  Widget _buildInfoRow(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Expanded(
            child: Text(value ?? "-"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Profile"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(),
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInfoRow("Username", _username),
                  _buildInfoRow("Email", _email),
                  _buildInfoRow("Role", _roles),
                  const SizedBox(height: 30),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: _logout,
                      icon: const Icon(Icons.logout),
                      label: const Text("Logout"),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
