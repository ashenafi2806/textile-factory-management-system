import 'package:flutter/material.dart';

import '../services/api_client.dart';

class ProductionSummaryScreen extends StatefulWidget {
  ProductionSummaryScreen({super.key});

  @override
  State<ProductionSummaryScreen> createState() =>
      _ProductionSummaryScreenState();
}

class _ProductionSummaryScreenState extends State<ProductionSummaryScreen> {
  late Future<Map<String, dynamic>> _summaryFuture;

  @override
  void initState() {
    super.initState();
    _summaryFuture = _loadSummary();
  }

  Future<Map<String, dynamic>> _loadSummary() async {
    final data = await ApiClient.getJson('/production/summary');
    if (data is Map<String, dynamic>) {
      return data;
    }
    return {};
  }

  String _formatStageName(dynamic stageName) {
    if (stageName == null) return 'Stage';
    final label = stageName.toString().replaceAll('_', ' ');
    return label[0].toUpperCase() + label.substring(1).toLowerCase();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Production Summary"),
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _summaryFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError || !snapshot.hasData) {
            return Center(
              child: Text(
                snapshot.error?.toString() ?? 'Failed to load summary',
              ),
            );
          }

          final data = snapshot.data ?? {};
          final totals = data['totals'] as Map<String, dynamic>? ?? {};
          final stageProgress =
              data['stageProgress'] as List<dynamic>? ?? [];
          final weeklyOutput =
              data['weeklyOutput'] as List<dynamic>? ?? [];
          final maxWeeklyValue = weeklyOutput.fold<num>(
            0,
            (maxValue, entry) {
              final value = entry['value'] as num? ?? 0;
              return value > maxValue ? value : maxValue;
            },
          );

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  _buildSummaryCard(
                    title: "Today",
                    value: totals['todayOutput']?.toString() ?? '0',
                    subtitle: "Units completed",
                    color: Colors.teal,
                  ),
                  const SizedBox(width: 12),
                  _buildSummaryCard(
                    title: "Active",
                    value: totals['activeOrders']?.toString() ?? '0',
                    subtitle: "Orders running",
                    color: Colors.indigo,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildSummaryCard(
                    title: "Quality",
                    value: "${totals['qualityRate'] ?? 0}%",
                    subtitle: "Pass rate",
                    color: Colors.orange,
                  ),
                  const SizedBox(width: 12),
                  _buildSummaryCard(
                    title: "Delays",
                    value: totals['delayedOrders']?.toString() ?? '0',
                    subtitle: "Orders",
                    color: Colors.redAccent,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Text(
                "Stage Progress",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              if (stageProgress.isEmpty)
                const Text("No stage progress data yet")
              else
                ...stageProgress.map((stage) {
                  final completed = stage['completed'] as int? ?? 0;
                  final total = stage['total'] as int? ?? 0;
                  final color = Colors.indigo.shade400;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _formatStageName(stage['stage']),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text("$completed / $total stages"),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: LinearProgressIndicator(
                              value: total == 0 ? 0 : completed / total,
                              minHeight: 12,
                              backgroundColor: Colors.grey.shade200,
                              color: color,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              const SizedBox(height: 10),
              const Text(
                "Weekly Output",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    height: 160,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: weeklyOutput.map((day) {
                        final value = day['value'] as num? ?? 0;
                        final barHeight = maxWeeklyValue == 0
                          ? 0
                          : (value / maxWeeklyValue) * 120;

                        return Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Container(
                                height: barHeight,
                                margin: const EdgeInsets.symmetric(horizontal: 6),
                                decoration: BoxDecoration(
                                  color: Colors.indigo.shade300,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                day['day']?.toString() ?? '',
                                style: const TextStyle(fontSize: 12),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSummaryCard({
    required String title,
    required String value,
    required String subtitle,
    required Color color,
  }) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
