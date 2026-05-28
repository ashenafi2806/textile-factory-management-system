import 'package:flutter/material.dart';

import '../services/api_client.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  bool _checkedIn = false;
  bool _isLoading = true;
  double _hoursWorked = 0;
  String? _lastActionTime;
  List<Map<String, String>> _log = [];

  @override
  void initState() {
    super.initState();
    _loadAttendance();
  }

  Future<void> _loadAttendance() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final now = DateTime.now();
      final start = DateTime(now.year, now.month, now.day);
      final end = start.add(const Duration(days: 1));

      final data = await ApiClient.getJson(
        '/workforce/attendance/my-attendance?start=${start.toIso8601String()}&end=${end.toIso8601String()}',
      );

      final records = data is List ? data : <dynamic>[];
      _buildTodayState(records);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString())),
      );
    } finally {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _buildTodayState(List<dynamic> records) {
    if (records.isEmpty) {
      _checkedIn = false;
      _hoursWorked = 0;
      _lastActionTime = null;
      _log = [];
      return;
    }

    records.sort((a, b) {
      final aDate = DateTime.tryParse(a['checkIn'] ?? '') ?? DateTime(1970);
      final bDate = DateTime.tryParse(b['checkIn'] ?? '') ?? DateTime(1970);
      return bDate.compareTo(aDate);
    });

    final latest = records.first;
    final checkIn = DateTime.tryParse(latest['checkIn'] ?? '');
    final checkOut = DateTime.tryParse(latest['checkOut'] ?? '');

    _checkedIn = checkIn != null && checkOut == null;
    _lastActionTime = _checkedIn
        ? _formatTime(checkIn!)
        : (checkOut != null ? _formatTime(checkOut) : null);

    if (checkIn != null && checkOut != null) {
      final duration = checkOut.difference(checkIn);
      _hoursWorked = duration.inMinutes / 60.0;
    }

    _log = records.map((entry) {
      final action = entry['checkOut'] == null ? 'Checked in' : 'Checked out';
      final time = entry['checkOut'] == null
          ? _formatTime(DateTime.parse(entry['checkIn']))
          : _formatTime(DateTime.parse(entry['checkOut']));
      return {
        'action': action,
        'time': time,
      };
    }).toList();
  }

  Future<void> _toggleCheckIn() async {
    try {
      if (_checkedIn) {
        await ApiClient.postJson('/workforce/attendance/check-out', {});
      } else {
        await ApiClient.postJson('/workforce/attendance/check-in', {});
      }

      if (!mounted) return;
      await _loadAttendance();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString())),
      );
    }
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
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
                        if (_lastActionTime != null)
                          Text(
                            "Last action: $_lastActionTime",
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
                              padding:
                                  const EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  "Today's Activity",
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
