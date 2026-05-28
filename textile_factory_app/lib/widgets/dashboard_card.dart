import 'package:flutter/material.dart';

class DashboardCard extends StatelessWidget {

  final IconData icon;
  final String title;

  const DashboardCard({
    super.key,
    required this.icon,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {

    return Card(
      elevation: 5,

      shape: RoundedRectangleBorder(
        borderRadius:
            BorderRadius.circular(15),
      ),

      child: Column(
        mainAxisAlignment:
            MainAxisAlignment.center,

        children: [

          Icon(
            icon,
            size: 50,
            color: Colors.indigo,
          ),

          const SizedBox(height: 10),

          Text(
            title,

            style: const TextStyle(
              fontSize: 18,
            ),
          ),
        ],
      ),
    );
  }
}