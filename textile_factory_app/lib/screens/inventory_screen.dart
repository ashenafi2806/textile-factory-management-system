import 'package:flutter/material.dart';

class InventoryScreen extends StatelessWidget {

  InventoryScreen({super.key});

  final List<Map<String, dynamic>>
      inventory = [

    {
      "name": "Fabric",
      "quantity": 600,
      "low": false,
    },

    {
      "name": "Buttons",
      "quantity": 100,
      "low": true,
    },

    {
      "name": "Thread",
      "quantity": 300,
      "low": false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final lowStockCount = inventory
        .where((item) => item["low"] == true)
        .length;
    final totalItems = inventory.length;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Inventory"),
      ),

      body: ListView(
        children: [
          Card(
            margin: const EdgeInsets.all(12),

            child: Padding(
              padding: const EdgeInsets.all(16),

              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,

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
                    "$lowStockCount of $totalItems items "
                    "need attention",
                  ),

                  const SizedBox(height: 12),

                  ClipRRect(
                    borderRadius:
                        BorderRadius.circular(8),

                    child: LinearProgressIndicator(
                      value: totalItems == 0
                          ? 0
                          : lowStockCount / totalItems,
                      minHeight: 10,
                      backgroundColor:
                          Colors.grey.shade200,
                      color: Colors.redAccent,
                    ),
                  ),
                ],
              ),
            ),
          ),

          ...inventory.map((item) {
            return Card(
              margin: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 6,
              ),

              child: ListTile(
                leading: Icon(
                  Icons.inventory,
                  color: item["low"]
                      ? Colors.red
                      : Colors.green,
                ),

                title: Text(item["name"]),

                subtitle: Text(
                  "Quantity: "
                  "${item["quantity"]}",
                ),

                trailing: item["low"]
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
      ),
    );
  }
}