import 'package:flutter/material.dart';

import '../widgets/dashboard_card.dart';

import 'production_screen.dart';
import 'production_summary_screen.dart';
import 'inventory_screen.dart';
import 'attendance_screen.dart';
import 'qa_report_screen.dart';
import 'profile_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text("Dashboard"),
      ),

      bottomNavigationBar:
          BottomNavigationBar(

        currentIndex: 0,

        onTap: (index) {
          if (index == 1) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) =>
                    ProductionScreen(),
              ),
            );
          }

          if (index == 2) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) =>
                    const ProfileScreen(),
              ),
            );
          }
        },

        items: const [

          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: "Home",
          ),

          BottomNavigationBarItem(
            icon: Icon(Icons.factory),
            label: "Orders",
          ),

          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: "Profile",
          ),
        ],
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),

        child: GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 15,
          mainAxisSpacing: 15,

          children: [

            GestureDetector(
              onTap: () {

                Navigator.push(
                  context,

                  MaterialPageRoute(
                    builder: (context) =>
                        ProductionScreen(),
                  ),
                );
              },

              child: const DashboardCard(
                icon: Icons.factory,
                title: "Production",
                accentColor: Colors.indigo,
              ),
            ),

            GestureDetector(
              onTap: () {

                Navigator.push(
                  context,

                  MaterialPageRoute(
                    builder: (context) =>
                        ProductionSummaryScreen(),
                  ),
                );
              },

              child: const DashboardCard(
                icon: Icons.analytics,
                title: "Production Summary",
                accentColor: Colors.teal,
              ),
            ),

            GestureDetector(
              onTap: () {

                Navigator.push(
                  context,

                  MaterialPageRoute(
                    builder: (context) =>
                        InventoryScreen(),
                  ),
                );
              },

              child: const DashboardCard(
                icon: Icons.inventory,
                title: "Inventory",
                accentColor: Colors.orange,
              ),
            ),

            GestureDetector(
              onTap: () {

                Navigator.push(
                  context,

                  MaterialPageRoute(
                    builder: (context) =>
                        AttendanceScreen(),
                  ),
                );
              },

              child: const DashboardCard(
                icon: Icons.badge,
                title: "Attendance",
                accentColor: Colors.blueGrey,
              ),
            ),

            GestureDetector(
              onTap: () {

                Navigator.push(
                  context,

                  MaterialPageRoute(
                    builder: (context) =>
                        QaReportScreen(),
                  ),
                );
              },

              child: const DashboardCard(
                icon: Icons.fact_check,
                title: "QA Report",
                accentColor: Colors.deepPurple,
              ),
            ),

            const DashboardCard(
              icon: Icons.build,
              title: "Maintenance",
              accentColor: Colors.brown,
            ),
          ],
        ),
      ),
    );
  }
}