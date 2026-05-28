import 'package:flutter/material.dart';

import '../services/api_client.dart';
import 'production_detail_screen.dart';

class ProductionScreen extends StatefulWidget {
  ProductionScreen({super.key});

  @override
  State<ProductionScreen> createState() => _ProductionScreenState();
}

class _ProductionScreenState extends State<ProductionScreen> {
  late Future<List<dynamic>> _ordersFuture;

  @override
  void initState() {
    super.initState();
    _ordersFuture = _loadOrders();
  }

  Future<List<dynamic>> _loadOrders() async {
    final data = await ApiClient.getJson('/production');
    if (data is List) {
      return data;
    }
    return [];
  }

  String _formatStage(dynamic stageName) {
    if (stageName == null) return 'Not started';
    final label = stageName.toString().replaceAll('_', ' ');
    return label[0].toUpperCase() + label.substring(1).toLowerCase();
  }

  String _resolveStageName(Map<String, dynamic> order) {
    final currentStageId = order['currentStage'];
    final stages = order['stages'];

    if (currentStageId is String && stages is List) {
      final stageMatch = stages.firstWhere(
        (stage) => stage['id'] == currentStageId,
        orElse: () => null,
      );
      if (stageMatch is Map<String, dynamic>) {
        return _formatStage(stageMatch['stageName']);
      }
    }

    if (stages is List && stages.isNotEmpty) {
      stages.sort((a, b) {
        final orderA = a['stageOrder'] as int? ?? 0;
        final orderB = b['stageOrder'] as int? ?? 0;
        return orderA.compareTo(orderB);
      });
      return _formatStage(stages.first['stageName']);
    }

    return 'Not started';
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'IN_PROGRESS':
        return Colors.orange;
      case 'COMPLETED':
        return Colors.green;
      case 'STOPPED':
      case 'CANCELLED':
        return Colors.redAccent;
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Production Orders"),
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _ordersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Text(snapshot.error.toString()),
            );
          }

          final orders = snapshot.data ?? [];
          if (orders.isEmpty) {
            return const Center(child: Text('No production orders found'));
          }

          return ListView.builder(
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final order = orders[index] as Map<String, dynamic>;
              final stageName = _resolveStageName(order);
              final status = order['status']?.toString() ?? 'PLANNED';

              return Card(
                margin: const EdgeInsets.all(10),
                child: ListTile(
                  leading: const Icon(Icons.factory),
                  title: Text(order['productName']?.toString() ?? 'Order'),
                  subtitle: Text(
                    "Stage: $stageName\nStatus: $status",
                  ),
                  trailing: Chip(
                    label: Text(status.replaceAll('_', ' ')),
                    backgroundColor: _statusColor(status).withOpacity(0.15),
                    labelStyle: TextStyle(color: _statusColor(status)),
                  ),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ProductionDetailScreen(
                          order: order,
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}