import 'package:flutter/material.dart';

class ProductionDetailScreen
    extends StatefulWidget {

  final Map<String, dynamic> order;

  const ProductionDetailScreen({
    super.key,
    required this.order,
  });

  @override
  State<ProductionDetailScreen>
      createState() =>
          _ProductionDetailScreenState();
}

class _ProductionDetailScreenState
    extends State<ProductionDetailScreen> {

  int currentStep = 0;

  final List<String> stages = [
    "Cutting",
    "Sewing",
    "Finishing",
    "Packing",
  ];

  final TextEditingController
      goodController =
          TextEditingController();

  final TextEditingController
      defectiveController =
          TextEditingController();

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title:
            Text(widget.order["product"]),
      ),

      body: SingleChildScrollView(
        padding:
            const EdgeInsets.all(16),

        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,

          children: [

            Card(
              child: Padding(
                padding:
                    const EdgeInsets.all(16),

                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment
                          .start,

                  children: [

                    Text(
                      "Order ID: "
                      "${widget.order["id"]}",

                      style: const TextStyle(
                        fontSize: 18,
                      ),
                    ),

                    const SizedBox(
                        height: 10),

                    Text(
                      "Status: "
                      "${widget.order["status"]}",
                    ),

                    const SizedBox(
                        height: 10),

                    Text(
                      "Current Stage: "
                      "${stages[currentStep]}",

                      style:
                          const TextStyle(
                        fontWeight:
                            FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              height: 400,

              child: Stepper(
                currentStep: currentStep,

                onStepContinue: () {

                  if (currentStep <
                      stages.length - 1) {

                    setState(() {
                      currentStep++;
                    });
                  }
                },

                onStepCancel: () {

                  if (currentStep > 0) {

                    setState(() {
                      currentStep--;
                    });
                  }
                },

                steps: stages.map((stage) {

                  return Step(
                    title: Text(stage),

                    content: Text(
                      "$stage stage "
                      "in progress",
                    ),

                    isActive:
                        stages.indexOf(stage)
                            <= currentStep,
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 20),

            const Text(
              "Record Output",

              style: TextStyle(
                fontSize: 20,
                fontWeight:
                    FontWeight.bold,
              ),
            ),

            const SizedBox(height: 15),

            TextField(
              controller: goodController,

              keyboardType:
                  TextInputType.number,

              decoration:
                  const InputDecoration(
                labelText: "Good Quantity",

                border:
                    OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 15),

            TextField(
              controller:
                  defectiveController,

              keyboardType:
                  TextInputType.number,

              decoration:
                  const InputDecoration(
                labelText:
                    "Defective Quantity",

                border:
                    OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 50,

              child: ElevatedButton(

                onPressed: () {

                  if (goodController
                          .text
                          .isEmpty ||
                      defectiveController
                          .text
                          .isEmpty) {

                    ScaffoldMessenger.of(
                            context)
                        .showSnackBar(
                      const SnackBar(
                        content: Text(
                          "Please fill "
                          "all fields",
                        ),
                      ),
                    );

                    return;
                  }

                  ScaffoldMessenger.of(
                          context)
                      .showSnackBar(
                    const SnackBar(
                      content: Text(
                        "Output Recorded",
                      ),
                    ),
                  );
                },

                child:
                    const Text("Submit"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}