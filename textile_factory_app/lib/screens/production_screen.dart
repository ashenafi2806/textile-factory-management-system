import 'package:flutter/material.dart';

import 'production_detail_screen.dart';

class ProductionScreen extends StatelessWidget {

  ProductionScreen({super.key});

  final List<Map<String, dynamic>> orders = [

    {
      "id": "PO-001",
      "product": "T-Shirt",
      "stage": "Cutting",
      "status": "In Progress",
    },

    {
      "id": "PO-002",
      "product": "Jacket",
      "stage": "Sewing",
      "status": "Pending",
    },
  ];

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title:
            const Text("Production Orders"),
      ),

      body: ListView.builder(
        itemCount: orders.length,

        itemBuilder: (context, index) {

          final order = orders[index];

          return Card(
            margin:
                const EdgeInsets.all(10),

            child: ListTile(
              leading:
                  const Icon(Icons.factory),

              title: Text(order["product"]),

              subtitle: Text(
                "Stage: ${order["stage"]}\n"
                "Status: ${order["status"]}",
              ),

              trailing: const Icon(
                Icons.arrow_forward_ios,
              ),

              onTap: () {

                Navigator.push(
                  context,

                  MaterialPageRoute(
                    builder: (context) =>
                        ProductionDetailScreen(
                      order: order,
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}