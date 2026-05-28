import 'package:flutter/material.dart';

import '../widgets/dashboard_card.dart';

import 'production_screen.dart';
import 'inventory_screen.dart';
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
              ),
            ),

            const DashboardCard(
              icon: Icons.people,
              title: "Workers",
            ),

            const DashboardCard(
              icon: Icons.build,
              title: "Maintenance",
            ),
          ],
        ),
      ),
    );
  }
}