import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../widgets/dashboard_card.dart';

import 'production_screen.dart';
import 'production_summary_screen.dart';
import 'inventory_screen.dart';
import 'attendance_screen.dart';
import 'qa_report_screen.dart';
import 'profile_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isLoading = true;
  List<String> _roles = [];

  @override
  void initState() {
    super.initState();
    _loadRoles();
  }

  Future<void> _loadRoles() async {
    final prefs = await SharedPreferences.getInstance();
    final storedRoles = prefs.getStringList('roles_list') ?? [];

    setState(() {
      _roles = storedRoles;
      _isLoading = false;
    });
  }

  bool _hasAnyRole(List<String> allowedRoles) {
    if (_roles.contains('ADMIN')) {
      return true;
    }
    return _roles.any(allowedRoles.contains);
  }

  void _navigateIfAllowed(
    BuildContext context,
    List<String> roles,
    Widget screen,
  ) {
    if (_hasAnyRole(roles)) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => screen),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Access denied for this role'),
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    final items = [
      _DashboardItem(
        title: 'Production',
        icon: Icons.factory,
        accentColor: Colors.indigo,
        roles: const [
          'PRODUCTION_MANAGER',
          'PRODUCTION_SUPERVISOR',
          'QA_MANAGER',
          'QA_STAFF',
          'MANAGER',
        ],
        onTap: () => _navigateIfAllowed(
          context,
          const [
            'PRODUCTION_MANAGER',
            'PRODUCTION_SUPERVISOR',
            'QA_MANAGER',
            'QA_STAFF',
            'MANAGER',
          ],
          ProductionScreen(),
        ),
      ),
      _DashboardItem(
        title: 'Production Summary',
        icon: Icons.analytics,
        accentColor: Colors.teal,
        roles: const [
          'PRODUCTION_MANAGER',
          'PRODUCTION_SUPERVISOR',
          'QA_MANAGER',
          'QA_STAFF',
          'MANAGER',
        ],
        onTap: () => _navigateIfAllowed(
          context,
          const [
            'PRODUCTION_MANAGER',
            'PRODUCTION_SUPERVISOR',
            'QA_MANAGER',
            'QA_STAFF',
            'MANAGER',
          ],
          ProductionSummaryScreen(),
        ),
      ),
      _DashboardItem(
        title: 'Inventory',
        icon: Icons.inventory,
        accentColor: Colors.orange,
        roles: const [
          'STOREKEEPER',
          'MANAGER',
          'PRODUCTION_MANAGER',
        ],
        onTap: () => _navigateIfAllowed(
          context,
          const ['STOREKEEPER', 'MANAGER', 'PRODUCTION_MANAGER'],
          InventoryScreen(),
        ),
      ),
      _DashboardItem(
        title: 'Attendance',
        icon: Icons.badge,
        accentColor: Colors.blueGrey,
        roles: const ['WORKER', 'SUPERVISOR', 'MANAGER'],
        onTap: () => _navigateIfAllowed(
          context,
          const ['WORKER', 'SUPERVISOR', 'MANAGER'],
          const AttendanceScreen(),
        ),
      ),
      _DashboardItem(
        title: 'QA Report',
        icon: Icons.fact_check,
        accentColor: Colors.deepPurple,
        roles: const ['QA_STAFF', 'QA_MANAGER'],
        onTap: () => _navigateIfAllowed(
          context,
          const ['QA_STAFF', 'QA_MANAGER'],
          const QaReportScreen(),
        ),
      ),
      _DashboardItem(
        title: 'Maintenance',
        icon: Icons.build,
        accentColor: Colors.brown,
        roles: const ['MAINTENANCE_MANAGER', 'MAINTENANCE_TECHNICIAN'],
        onTap: () => _navigateIfAllowed(
          context,
          const ['MAINTENANCE_MANAGER', 'MAINTENANCE_TECHNICIAN'],
          const _EmptyScreen(),
        ),
      ),
    ];

    final visibleItems = items
        .where((item) => _hasAnyRole(item.roles))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text("Dashboard"),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (index) {
          if (index == 1) {
            _navigateIfAllowed(
              context,
              const [
                'PRODUCTION_MANAGER',
                'PRODUCTION_SUPERVISOR',
                'QA_MANAGER',
                'QA_STAFF',
                'MANAGER',
              ],
              ProductionScreen(),
            );
          }

          if (index == 2) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ProfileScreen(),
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_roles.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _roles
                          .map(
                            (role) => Chip(
                              label: Text(role.replaceAll('_', ' ')),
                              backgroundColor: Colors.indigo.shade50,
                            ),
                          )
                          .toList(),
                    ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: GridView.count(
                      crossAxisCount: 2,
                      crossAxisSpacing: 15,
                      mainAxisSpacing: 15,
                      children: visibleItems
                          .map(
                            (item) => GestureDetector(
                              onTap: item.onTap,
                              child: DashboardCard(
                                icon: item.icon,
                                title: item.title,
                                accentColor: item.accentColor,
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class _DashboardItem {
  final String title;
  final IconData icon;
  final Color accentColor;
  final List<String> roles;
  final VoidCallback onTap;

  _DashboardItem({
    required this.title,
    required this.icon,
    required this.accentColor,
    required this.roles,
    required this.onTap,
  });
}

class _EmptyScreen extends StatelessWidget {
  const _EmptyScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Coming soon')),
    );
  }
}