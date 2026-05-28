import 'package:flutter/material.dart';

import '../services/api_client.dart';

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
  String? _selectedStageId;
  bool _isSubmitting = false;

  final TextEditingController goodController = TextEditingController();
  final TextEditingController defectiveController = TextEditingController();
  final TextEditingController noteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final stages = _sortedStages();
    if (stages.isNotEmpty) {
      _selectedStageId = stages.first['id']?.toString();
    }
    currentStep = _resolveCurrentStep(stages);
  }

  List<dynamic> _sortedStages() {
    final stages = (widget.order['stages'] as List<dynamic>?) ?? [];
    stages.sort((a, b) {
      final orderA = a['stageOrder'] as int? ?? 0;
      final orderB = b['stageOrder'] as int? ?? 0;
      return orderA.compareTo(orderB);
    });
    return stages;
  }

  int _resolveCurrentStep(List<dynamic> stages) {
    final currentStageId = widget.order['currentStage']?.toString();
    if (currentStageId != null) {
      final index = stages.indexWhere(
        (stage) => stage['id']?.toString() == currentStageId,
      );
      if (index >= 0) {
        return index;
      }
    }

    final inProgressIndex = stages.indexWhere(
      (stage) => stage['status']?.toString() == 'IN_PROGRESS',
    );
    if (inProgressIndex >= 0) {
      return inProgressIndex;
    }

    return 0;
  }

  String _formatStage(String? stageName) {
    if (stageName == null) return 'Stage';
    final label = stageName.replaceAll('_', ' ');
    return label[0].toUpperCase() + label.substring(1).toLowerCase();
  }

  Future<void> _submitOutput() async {
    if (_selectedStageId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a stage first')),
      );
      return;
    }

    if (goodController.text.isEmpty || defectiveController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }

    final goodQuantity = int.tryParse(goodController.text.trim());
    final defectiveQuantity = int.tryParse(defectiveController.text.trim());

    if (goodQuantity == null || defectiveQuantity == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter valid numbers')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await ApiClient.postJson(
        '/production/${widget.order['id']}/output',
        {
          'stageId': _selectedStageId,
          'shiftDate': DateTime.now().toIso8601String(),
          'goodQuantity': goodQuantity,
          'defectiveQuantity': defectiveQuantity,
          'notes': noteController.text.trim().isEmpty
              ? null
              : noteController.text.trim(),
        },
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Output recorded')),
      );
      goodController.clear();
      defectiveController.clear();
      noteController.clear();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString())),
      );
    } finally {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final stages = _sortedStages();
    final stageLabels = stages
        .map((stage) => _formatStage(stage['stageName']?.toString()))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title:
            Text(widget.order["productName"] ?? 'Order'),
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
                      "Order: "
                      "${widget.order["orderNumber"] ?? widget.order["id"]}",
                      style: const TextStyle(
                        fontSize: 18,
                      ),
                    ),

                    const SizedBox(
                        height: 10),

                    Text(
                      "Status: "
                      "${widget.order["status"] ?? 'PLANNED'}",
                    ),

                    const SizedBox(
                        height: 10),

                    Text(
                      "Current Stage: "
                      "${stageLabels.isNotEmpty ? stageLabels[currentStep] : 'N/A'}",

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

            if (stageLabels.isNotEmpty)
              SizedBox(
                height: 400,
                child: Stepper(
                  currentStep: currentStep,
                  onStepContinue: () {
                    if (currentStep < stageLabels.length - 1) {
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
                  steps: stageLabels.map((stage) {
                    return Step(
                      title: Text(stage),
                      content: Text("$stage stage in progress"),
                      isActive: stageLabels.indexOf(stage) <= currentStep,
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

            DropdownButtonFormField<String>(
              value: _selectedStageId,
              items: stages
                  .map(
                    (stage) => DropdownMenuItem(
                      value: stage['id']?.toString(),
                      child: Text(
                        _formatStage(stage['stageName']?.toString()),
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                setState(() {
                  _selectedStageId = value;
                });
              },
              decoration: const InputDecoration(
                labelText: "Stage",
                border: OutlineInputBorder(),
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

            const SizedBox(height: 15),

            TextField(
              controller: noteController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: "Notes (optional)",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 50,

              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitOutput,
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                        ),
                      )
                    : const Text("Submit"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}