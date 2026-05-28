import 'package:flutter/material.dart';

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

  String _selectedType = "Stitching";
  bool _isSubmitting = false;

  final List<String> _defectTypes = [
    "Stitching",
    "Fabric",
    "Size",
    "Color",
    "Packaging",
  ];

  @override
  void dispose() {
    _descriptionController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  void _submitReport() {
    if (_descriptionController.text.trim().isEmpty ||
        _quantityController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please fill all required fields"),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    Future.delayed(const Duration(milliseconds: 400), () {
      if (!mounted) return;

      setState(() {
        _isSubmitting = false;
        _descriptionController.clear();
        _quantityController.clear();
        _selectedType = _defectTypes.first;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("QA report submitted"),
        ),
      );
    });
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
    return Scaffold(
      appBar: AppBar(
        title: const Text("QA Report"),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                            value: type,
                            child: Text(type),
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
                        padding: const EdgeInsets.symmetric(vertical: 14),
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
          Card(
            child: ListTile(
              leading: const Icon(
                Icons.report,
                color: Colors.redAccent,
              ),
              title: const Text("Loose stitching"),
              subtitle: const Text("Line B · 12 items"),
              trailing: Chip(
                label: const Text("Open"),
                backgroundColor: Colors.red.shade50,
              ),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(
                Icons.report,
                color: Colors.orange,
              ),
              title: const Text("Color mismatch"),
              subtitle: const Text("Line A · 6 items"),
              trailing: Chip(
                label: const Text("Review"),
                backgroundColor: Colors.orange.shade50,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
