import 'package:flutter/material.dart';
import 'upload_screen.dart'; 

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'SAAS IA Editor Libre',
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFFBFBFD), 
        fontFamily: 'Inter',
      ),
      home: const MainLayout(),
    );
  }
}

class MainLayout extends StatefulWidget {
  const MainLayout({Key? key}) : super(key: key);

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  // Ajustes en tiempo real extraidos desde la barra lateral minimalista
  double _cleanIntensity = 50.0;
  String _selectedLanguage = 'Español';
  
  // Contadores de IA (Sensación SAAS)
  int _localProcessedCount = 0; 
  final int _baseGlobalCount = 14205; 
  
  void _incrementCounter() {
    setState(() {
      _localProcessedCount++;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width > 800;

    return Scaffold(
      appBar: isDesktop ? null : AppBar(
        title: const Text("✨ IA Editor Libre", style: TextStyle(color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      drawer: isDesktop ? null : Drawer(child: _buildSidebarContent()),
      body: Row(
        children: [
          if (isDesktop) 
            Container(
              width: 320,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(right: BorderSide(color: Colors.grey.shade200, width: 2)),
              ),
              child: _buildSidebarContent(),
            ),
          
          Expanded(
            child: UploadScreen(
               intensity: _cleanIntensity.toInt(), // Pasamos el ajuste nativamente a rembg
               onSuccessProcess: _incrementCounter,
            ), 
          ),
        ],
      ),
    );
  }

  Widget _buildSidebarContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(32, 48, 32, 24),
          child: Text("✨ IA Editor", style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, letterSpacing: -1)),
        ),
        
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                const Text("Intensidad de Limpieza", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black45)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.blur_linear, size: 20, color: Colors.black54),
                    Expanded(
                      child: Slider(
                        value: _cleanIntensity,
                        min: 0,
                        max: 100,
                        activeColor: Colors.black87,
                        inactiveColor: Colors.grey.shade200,
                        onChanged: (val) => setState(() => _cleanIntensity = val),
                      ),
                    ),
                    Text("${_cleanIntensity.toInt()}%", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
                
                const SizedBox(height: 32),
                
                // Selector de Idioma Minimalista
                const Text("Idioma Global", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black45)),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: _selectedLanguage,
                      icon: const Icon(Icons.language, color: Colors.black54),
                      onChanged: (String? newValue) {
                        if (newValue != null) setState(() => _selectedLanguage = newValue);
                      },
                      items: <String>['Español', 'English', 'Français', 'Deutsch']
                          .map<DropdownMenuItem<String>>((String value) {
                        return DropdownMenuItem<String>(
                          value: value,
                          child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        
        // Footer: Contador de Fotos Magistral
        Container(
          padding: const EdgeInsets.all(24.0),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Colors.grey.shade100)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, color: Colors.green),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Fotos procesadas con éxito", style: TextStyle(color: Colors.black54, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                    "${(_baseGlobalCount + _localProcessedCount).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}",
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, letterSpacing: -1),
                  ),
                ],
              )
            ],
          ),
        ),
      ],
    );
  }
}
