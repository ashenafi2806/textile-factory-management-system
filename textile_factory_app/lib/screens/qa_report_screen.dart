import 'package:flutter/material.dart';

import '../services/api_client.dart';

class QaReportScreen extends StatefulWidget {
  const QaReportScreen({super.key});

  @override
  State<QaReportScreen> createState() => _QaReportScreenState();
}

class _QaReportScreenState extends State<QaReportScreen> {
  final TextEditingController _descriptionController =
      TextEditingController();
  final TextEditingController _quantityController =
      TextEditingController();

  String _selectedType = "QUALITY_DEFECT";
  String _selectedPriority = "NORMAL";
  String? _selectedOrderId;
  String? _selectedStageId;
  bool _isSubmitting = false;
  bool _isLoading = true;

  List<dynamic> _orders = [];
  List<dynamic> _issues = [];

  final List<Map<String, String>> _defectTypes = [
    {"label": "Quality defect", "value": "QUALITY_DEFECT"},
    {"label": "Machine failure", "value": "MACHINE_FAILURE"},
    {"label": "Material shortage", "value": "MATERIAL_SHORTAGE"},
    {"label": "Other", "value": "OTHER"},
  ];

  final List<Map<String, String>> _priorityLevels = [
    {"label": "Normal", "value": "NORMAL"},
    {"label": "Critical", "value": "CRITICAL"},
  ];

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final data = await ApiClient.getJson('/production');
      _orders = data is List ? data : [];

      if (_orders.isNotEmpty) {
        _selectedOrderId = _orders.first['id']?.toString();
        _selectedStageId = _resolveStageId(_orders.first);
        await _loadIssues();
      }
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString())),
      );
    } finally {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
    }
  }

  String? _resolveStageId(Map<String, dynamic> order) {
    final stages = order['stages'] as List<dynamic>?;
    if (stages == null || stages.isEmpty) {
      return null;
    }

    stages.sort((a, b) {
      final orderA = a['stageOrder'] as int? ?? 0;
      final orderB = b['stageOrder'] as int? ?? 0;
      return orderA.compareTo(orderB);
    });

    return stages.first['id']?.toString();
  }

  String _formatStage(dynamic stageName) {
    if (stageName == null) return 'Stage';
    final label = stageName.toString().replaceAll('_', ' ');
    return label[0].toUpperCase() + label.substring(1).toLowerCase();
  }

  Future<void> _loadIssues() async {
    if (_selectedOrderId == null) {
      return;
    }

    try {
      final data = await ApiClient.getJson(
        '/production/${_selectedOrderId!}/issues',
      );
      setState(() {
        _issues = data is List ? data : [];
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString())),
      );
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    if (_selectedOrderId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Select a production order first"),
        ),
      );
      return;
    }

    if (_descriptionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please enter a description"),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    final quantityText = _quantityController.text.trim();
    final description = quantityText.isNotEmpty
        ? "Qty: $quantityText - ${_descriptionController.text.trim()}"
        : _descriptionController.text.trim();

    try {
      await ApiClient.postJson(
        '/production/${_selectedOrderId!}/issues',
        {
          'issueType': _selectedType,
          'description': description,
          'priority': _selectedPriority,
          'stageId': _selectedStageId,
        },
      );

      if (!mounted) return;
      _descriptionController.clear();
      _quantityController.clear();
      await _loadIssues();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("QA report submitted"),
        ),
      );
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

  void _attachPhoto() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Photo attachment coming soon"),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedOrder = _orders.firstWhere(
      (order) => order['id']?.toString() == _selectedOrderId,
      orElse: () => null,
    );
    final stages = selectedOrder is Map<String, dynamic>
        ? (selectedOrder['stages'] as List<dynamic>? ?? [])
        : <dynamic>[];

    return Scaffold(
      appBar: AppBar(
        title: const Text("QA Report"),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Production Order",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: _selectedOrderId,
                          items: _orders
                              .map(
                                (order) => DropdownMenuItem(
                                  value: order['id']?.toString(),
                                  child: Text(
                                    order['orderNumber']?.toString() ??
                                        order['productName']?.toString() ??
                                        'Order',
                                  ),
                                ),
                              )
                              .toList(),
                          onChanged: (value) async {
                            setState(() {
                              _selectedOrderId = value;
                              _selectedStageId = null;
                            });
                            if (value != null) {
                              final order = _orders.firstWhere(
                                (item) => item['id']?.toString() == value,
                                orElse: () => null,
                              );
                              if (order is Map<String, dynamic>) {
                                setState(() {
                                  _selectedStageId = _resolveStageId(order);
                                });
                              }
                              await _loadIssues();
                            }
                          },
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          "Stage",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: _selectedStageId,
                          items: stages
                              .map(
                                (stage) => DropdownMenuItem(
                                  value: stage['id']?.toString(),
                                  child: Text(
                                    _formatStage(stage['stageName']),
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
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          "Defect Type",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: _selectedType,
                          items: _defectTypes
                              .map(
                                (type) => DropdownMenuItem(
                                  value: type['value'],
                                  child: Text(type['label'] ?? ''),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            if (value == null) return;
                            setState(() {
                              _selectedType = value;
                            });
                          },
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          "Priority",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: _selectedPriority,
                          items: _priorityLevels
                              .map(
                                (priority) => DropdownMenuItem(
                                  value: priority['value'],
                                  child: Text(priority['label'] ?? ''),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            if (value == null) return;
                            setState(() {
                              _selectedPriority = value;
                            });
                          },
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          "Description",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _descriptionController,
                          maxLines: 3,
                          decoration: const InputDecoration(
                            hintText: "Describe the issue",
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          "Affected Quantity",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _quantityController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            hintText: "e.g. 25",
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 16),
                        OutlinedButton.icon(
                          onPressed: _attachPhoto,
                          icon: const Icon(Icons.photo_camera),
                          label: const Text("Attach Photo"),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : _submitReport,
                            style: ElevatedButton.styleFrom(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: _isSubmitting
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text("Submit Report"),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  "Recent Issues",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                if (_issues.isEmpty)
                  const Text('No issues reported yet')
                else
                  ..._issues.map((issue) {
                    final status = issue['status']?.toString() ?? 'OPEN';
                    final type = issue['issueType']?.toString() ?? 'ISSUE';
                    return Card(
                      child: ListTile(
                        leading: const Icon(
                          Icons.report,
                          color: Colors.redAccent,
                        ),
                        title: Text(type.replaceAll('_', ' ')),
                        subtitle: Text(issue['description']?.toString() ?? ''),
                        trailing: Chip(
                          label: Text(status.replaceAll('_', ' ')),
                          backgroundColor: Colors.red.shade50,
                        ),
                      ),
                    );
                  }).toList(),
              ],
            ),
    );
  }
}
