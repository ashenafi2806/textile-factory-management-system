import 'package:flutter/material.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(const TextileFactoryApp());
}

class TextileFactoryApp extends StatelessWidget {
  const TextileFactoryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,

      title: 'Textile Factory App',

      theme: ThemeData(
        primarySwatch: Colors.indigo,

        scaffoldBackgroundColor:
            Colors.grey.shade100,

        appBarTheme: const AppBarTheme(
          centerTitle: true,
        ),
      ),

      home: const LoginScreen(),
    );
  }
}