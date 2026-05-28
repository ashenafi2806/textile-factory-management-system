import 'package:flutter/material.dart';

import '../services/api_client.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  late Future<List<dynamic>> _inventoryFuture;

  @override
  void initState() {
    super.initState();
    _inventoryFuture = _loadInventory();
  }

  Future<List<dynamic>> _loadInventory() async {
    final items = await ApiClient.getJson('/inventory');
    return items is List ? items : <dynamic>[];
  }

  String _formatQuantity(dynamic value) {
    if (value is int) {
      return value.toString();
    }
    if (value is double) {
      return value.toStringAsFixed(1);
    }
    if (value is num) {
      return value.toString();
    }
    return value?.toString() ?? '0';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Inventory"),
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _inventoryFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError || !snapshot.hasData) {
            return Center(
              child: Text(
                snapshot.error?.toString() ?? 'Failed to load inventory',
              ),
            );
          }

          final inventory = snapshot.data ?? [];
          final lowStockCount = inventory.where((item) {
            final quantity = item['quantity'];
            final minThreshold = item['minThreshold'];
            return quantity is num &&
                minThreshold is num &&
                quantity <= minThreshold;
          }).length;
          final totalItems = inventory.length;

          return ListView(
            children: [
              Card(
                margin: const EdgeInsets.all(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Low Stock Alerts",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        "$lowStockCount of $totalItems items need attention",
                      ),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: totalItems == 0
                              ? 0
                              : lowStockCount / totalItems,
                          minHeight: 10,
                          backgroundColor: Colors.grey.shade200,
                          color: Colors.redAccent,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              ...inventory.map((item) {
                final quantity = item['quantity'];
                final minThreshold = item['minThreshold'];
                final isLow = quantity is num &&
                    minThreshold is num &&
                    quantity <= minThreshold;

                return Card(
                  margin: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  child: ListTile(
                    leading: Icon(
                      Icons.inventory,
                      color: isLow ? Colors.red : Colors.green,
                    ),
                    title: Text(item['name']?.toString() ?? 'Item'),
                    subtitle: Text(
                      "Quantity: ${_formatQuantity(quantity)} ${item['unit'] ?? ''}",
                    ),
                    trailing: isLow
                        ? const Text(
                            "LOW",
                            style: TextStyle(
                              color: Colors.red,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : const Text(
                            "OK",
                            style: TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                );
              }).toList(),
            ],
          );
        },
      ),
    );
  }
}