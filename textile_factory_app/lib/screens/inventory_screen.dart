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

    return Scaffold(
      appBar: AppBar(
        title: const Text("Inventory"),
      ),

      body: ListView.builder(
        itemCount: inventory.length,

        itemBuilder: (context, index) {

          final item = inventory[index];

          return Card(
            margin:
                const EdgeInsets.all(10),

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
                        fontWeight:
                            FontWeight.bold,
                      ),
                    )

                  : null,
            ),
          );
        },
      ),
    );
  }
}