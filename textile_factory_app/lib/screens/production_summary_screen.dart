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
    try {
      final data = await ApiClient.getJson('/production/summary');
      if (data is Map<String, dynamic>) {
        return data;
      }
      return {};
    } catch (error) {
      if (error.toString().contains('HTTP 404')) {
        final orders = await ApiClient.getJson('/production');
        if (orders is List) {
          return _buildSummaryFromOrders(orders);
        }
      }
      rethrow;
    }
  }

  Map<String, dynamic> _buildSummaryFromOrders(List<dynamic> orders) {
    final now = DateTime.now();
    final startOfToday = DateTime(now.year, now.month, now.day);
    final startOfWeek = startOfToday.subtract(const Duration(days: 6));

    int activeOrders = 0;
    int completedOrders = 0;
    int delayedOrders = 0;
    int todayOutput = 0;
    int totalGood = 0;
    int totalDefective = 0;

    final stageProgressMap = <String, Map<String, int>>{};
    final weeklyOutputMap = <String, int>{};

    for (final rawOrder in orders) {
      if (rawOrder is! Map<String, dynamic>) {
        continue;
      }

      final status = rawOrder['status']?.toString() ?? 'PLANNED';
      if (status == 'IN_PROGRESS') {
        activeOrders += 1;
      }
      if (status == 'COMPLETED') {
        completedOrders += 1;
      }

      final deadline = DateTime.tryParse(rawOrder['deadline']?.toString() ?? '');
      if (deadline != null &&
          deadline.isBefore(now) &&
          status != 'COMPLETED' &&
          status != 'CANCELLED') {
        delayedOrders += 1;
      }

      final stages = rawOrder['stages'];
      if (stages is List) {
        for (final stage in stages) {
          if (stage is! Map<String, dynamic>) {
            continue;
          }
          final stageName = stage['stageName']?.toString() ?? 'UNKNOWN';
          final entry = stageProgressMap.putIfAbsent(
            stageName,
            () => {'total': 0, 'completed': 0},
          );
          entry['total'] = (entry['total'] ?? 0) + 1;

          final stageStatus = stage['status']?.toString() ?? '';
          if (stageStatus == 'COMPLETED' || stageStatus == 'QA_APPROVED') {
            entry['completed'] = (entry['completed'] ?? 0) + 1;
          }
        }
      }

      final outputs = rawOrder['outputs'];
      if (outputs is List) {
        for (final output in outputs) {
          if (output is! Map<String, dynamic>) {
            continue;
          }
          final shiftDate = DateTime.tryParse(output['shiftDate']?.toString() ?? '');
          final goodQuantity = (output['goodQuantity'] as num?)?.toInt() ?? 0;
          final defectiveQuantity = (output['defectiveQuantity'] as num?)?.toInt() ?? 0;

          totalGood += goodQuantity;
          totalDefective += defectiveQuantity;

          if (shiftDate != null && !shiftDate.isBefore(startOfWeek)) {
            final dateKey = shiftDate.toIso8601String().substring(0, 10);
            weeklyOutputMap[dateKey] =
                (weeklyOutputMap[dateKey] ?? 0) + goodQuantity;
          }

          if (shiftDate != null && !shiftDate.isBefore(startOfToday)) {
            todayOutput += goodQuantity;
          }
        }
      }
    }

    final weeklyOutput = List.generate(7, (index) {
      final day = startOfWeek.add(Duration(days: index));
      final key = day.toIso8601String().substring(0, 10);

      return {
        'day': _formatShortDay(day),
        'value': weeklyOutputMap[key] ?? 0,
      };
    });

    final stageProgress = stageProgressMap.entries
        .map(
          (entry) => {
            'stage': entry.key,
            'total': entry.value['total'] ?? 0,
            'completed': entry.value['completed'] ?? 0,
          },
        )
        .toList();

    final qualityRate =
        totalGood + totalDefective > 0
            ? ((totalGood / (totalGood + totalDefective)) * 100).round()
            : 0;

    return {
      'totals': {
        'totalOrders': orders.length,
        'activeOrders': activeOrders,
        'completedOrders': completedOrders,
        'delayedOrders': delayedOrders,
        'todayOutput': todayOutput,
        'qualityRate': qualityRate,
      },
      'stageProgress': stageProgress,
      'weeklyOutput': weeklyOutput,
    };
  }

  String _formatShortDay(DateTime date) {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final index = date.weekday - 1;
    if (index < 0 || index >= labels.length) {
      return 'Day';
    }
    return labels[index];
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
                                height: barHeight.toDouble(),
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
