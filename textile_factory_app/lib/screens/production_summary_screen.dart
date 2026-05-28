import 'package:flutter/material.dart';

class ProductionSummaryScreen extends StatelessWidget {
  ProductionSummaryScreen({super.key});

  final List<Map<String, dynamic>> stageSummary = [
    {
      "stage": "Cutting",
      "completed": 940,
      "target": 1200,
      "color": Colors.teal,
    },
    {
      "stage": "Sewing",
      "completed": 760,
      "target": 1000,
      "color": Colors.indigo,
    },
    {
      "stage": "Finishing",
      "completed": 520,
      "target": 800,
      "color": Colors.orange,
    },
  ];

  final List<Map<String, dynamic>> dailyOutput = [
    {"day": "Mon", "value": 80},
    {"day": "Tue", "value": 95},
    {"day": "Wed", "value": 70},
    {"day": "Thu", "value": 110},
    {"day": "Fri", "value": 88},
    {"day": "Sat", "value": 60},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Production Summary"),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              _buildSummaryCard(
                title: "Today",
                value: "2,220",
                subtitle: "Units completed",
                color: Colors.teal,
              ),
              const SizedBox(width: 12),
              _buildSummaryCard(
                title: "Active",
                value: "6",
                subtitle: "Lines running",
                color: Colors.indigo,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildSummaryCard(
                title: "Quality",
                value: "97%",
                subtitle: "Pass rate",
                color: Colors.orange,
              ),
              const SizedBox(width: 12),
              _buildSummaryCard(
                title: "Delays",
                value: "2",
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
          ...stageSummary.map((stage) {
            final completed = stage["completed"] as int;
            final target = stage["target"] as int;
            final color = stage["color"] as Color;

            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      stage["stage"],
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text("$completed / $target units"),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: LinearProgressIndicator(
                        value: target == 0 ? 0 : completed / target,
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
                  children: dailyOutput.map((day) {
                    final value = day["value"] as int;
                    final barHeight = (value / 120) * 120;

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
                            day["day"],
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
