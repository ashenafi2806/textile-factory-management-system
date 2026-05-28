import 'package:flutter/material.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  bool _checkedIn = false;
  DateTime? _lastCheckIn;
  double _hoursWorked = 0;

  final List<Map<String, String>> _log = [];

  void _toggleCheckIn() {
    final now = DateTime.now();

    setState(() {
      if (_checkedIn) {
        if (_lastCheckIn != null) {
          final duration = now.difference(_lastCheckIn!);
          _hoursWorked += duration.inMinutes / 60.0;
        }

        _log.insert(0, {
          "action": "Checked out",
          "time": _formatTime(now),
        });

        _checkedIn = false;
        _lastCheckIn = null;
      } else {
        _log.insert(0, {
          "action": "Checked in",
          "time": _formatTime(now),
        });

        _checkedIn = true;
        _lastCheckIn = now;
      }
    });
  }

  String _formatTime(DateTime time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return "$hour:$minute";
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _checkedIn ? Colors.green : Colors.redAccent;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Attendance"),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Status",
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _checkedIn ? "Checked In" : "Checked Out",
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Hours today: ${_hoursWorked.toStringAsFixed(1)}",
                    style: TextStyle(
                      color: Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _toggleCheckIn,
                      icon: Icon(
                        _checkedIn ? Icons.logout : Icons.login,
                      ),
                      label: Text(
                        _checkedIn ? "Check Out" : "Check In",
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: statusColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            "Today\'s Activity",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          if (_log.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  "No activity yet. Tap check in to start your day.",
                  style: TextStyle(
                    color: Colors.grey.shade700,
                  ),
                ),
              ),
            )
          else
            ..._log.map((entry) {
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: Icon(
                    entry["action"] == "Checked in"
                        ? Icons.login
                        : Icons.logout,
                    color: entry["action"] == "Checked in"
                        ? Colors.green
                        : Colors.redAccent,
                  ),
                  title: Text(entry["action"] ?? ""),
                  trailing: Text(entry["time"] ?? ""),
                ),
              );
            }).toList(),
        ],
      ),
    );
  }
}
