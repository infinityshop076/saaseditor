import 'dart:io';
import 'dart:typed_data';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:file_saver/file_saver.dart';
import 'package:http/http.dart' as http;
import 'package:desktop_drop/desktop_drop.dart';

class ImageBatchItem {
  final String id;
  final String name;
  final Uint8List originalBytes;
  Uint8List? processedBytes;
  bool isProcessing;
  String? error;

  ImageBatchItem({
    required this.id,
    required this.name,
    required this.originalBytes,
    this.isProcessing = true,
  });
}

class UploadScreen extends StatefulWidget {
  final int intensity;
  final VoidCallback onSuccessProcess;

  const UploadScreen({super.key, required this.intensity, required this.onSuccessProcess});

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> with SingleTickerProviderStateMixin {
  final List<ImageBatchItem> _items = [];
  bool _isDragging = false;
  late AnimationController _bgController;

  @override
  void initState() {
    super.initState();
    _bgController = AnimationController(vsync: this, duration: const Duration(seconds: 10))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _bgController.dispose();
    super.dispose();
  }

  void _onFilesDropped(DropDoneDetails details) async {
    final newFiles = details.files;
    int added = 0;
    
    for (var file in newFiles) {
      if (!file.name.toLowerCase().endsWith('.png') && 
          !file.name.toLowerCase().endsWith('.jpg') && 
          !file.name.toLowerCase().endsWith('.jpeg') &&
          !file.name.toLowerCase().endsWith('.webp')) continue;

      if (_items.length >= 10) break;
      
      final bytes = await file.readAsBytes();
      final item = ImageBatchItem(
        id: DateTime.now().millisecondsSinceEpoch.toString() + added.toString(),
        name: file.name,
        originalBytes: bytes,
        isProcessing: true,
      );
      
      setState(() => _items.add(item));
      added++;
      _processItem(item);
    }
  }

  Future<void> _processItem(ImageBatchItem item) async {
    try {
      final uri = Uri.base.resolve('/edit-image');
      var request = http.MultipartRequest('POST', uri);
      request.fields['intensity'] = widget.intensity.toString(); 
      request.files.add(
        http.MultipartFile.fromBytes('file', item.originalBytes, filename: item.name)
      );
      
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200) {
        setState(() {
          item.processedBytes = response.bodyBytes;
          item.isProcessing = false;
        });
        widget.onSuccessProcess(); 
      } else {
        setState(() {
          item.error = "Error al conectar";
          item.isProcessing = false;
        });
      }
    } catch (e) {
      setState(() {
        item.error = 'Fallo de red';
        item.isProcessing = false;
      });
    }
  }

  Future<void> _downloadItem(ImageBatchItem item) async {
    if (item.processedBytes != null) {
      try {
        String finalName = "ai_clean_${item.name.split('.').first}.png";
        await FileSaver.instance.saveFile(
          name: finalName,
          bytes: item.processedBytes,
        );
      } catch (e) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000), // Dark Mode Puro (Estilo iOS Premium)
      body: Stack(
        children: [
          // Malla Neuronal Animada / Ambient Mesh Gradient
          AnimatedBuilder(
            animation: _bgController,
            builder: (context, child) {
              return Stack(
                children: [
                  Positioned(
                    top: -150 + (50 * _bgController.value),
                    left: -100 - (50 * _bgController.value),
                    child: Container(
                      width: 500,
                      height: 500,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFF320066), // Deep Purple
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -200 - (40 * _bgController.value),
                    right: -100 + (60 * _bgController.value),
                    child: Container(
                      width: 600,
                      height: 600,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFF001F4D), // Deep Dark Blue
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
          
          // Desenfoque Masivo sobre los orbes logrando un Degradado Suave
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 120, sigmaY: 120),
            child: Container(color: Colors.transparent),
          ),

          // Interfaz Activa Principal Glassmorphism
          DropTarget(
            onDragDone: _onFilesDropped,
            onDragEntered: (detail) => setState(() => _isDragging = true),
            onDragExited: (detail) => setState(() => _isDragging = false),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              color: _isDragging ? Colors.white.withOpacity(0.04) : Colors.transparent,
              child: SafeArea(
                child: Stack(
                  children: [
                    if (_items.isEmpty)
                      _buildEmptyState()
                    else
                      _buildGridState(),
                      
                    if (_isDragging)
                      _buildDragOverlay()
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDragOverlay() {
    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
      child: Container(
        color: Colors.black.withOpacity(0.5),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 30),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.08),
              border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.5),
              borderRadius: BorderRadius.circular(45),
            ),
            child: const Text("Suelta las fotos aquí 👋", style: TextStyle(fontFamily: 'Inter', fontSize: 36, fontWeight: FontWeight.w600, color: Colors.white, letterSpacing: -1.2)),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(55),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
              child: Container(
                padding: const EdgeInsets.all(45),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.04),
                  border: Border.all(color: Colors.white.withOpacity(0.12), width: 1.5),
                  borderRadius: BorderRadius.circular(55),
                ),
                child: const Icon(CupertinoIcons.sparkles, size: 90, color: Colors.white)
              ),
            ),
          ),
          const SizedBox(height: 40),
          const Text("Mágico y Profesional", style: TextStyle(fontFamily: 'Inter', fontSize: 48, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: -1.5)),
          const SizedBox(height: 16),
          Text("Arrastra hasta 10 imágenes al lienzo.\nLos cortes neuronales se completarán en la nube.", textAlign: TextAlign.center, style: TextStyle(fontFamily: 'Inter', fontSize: 20, color: Colors.white.withOpacity(0.6), height: 1.5, fontWeight: FontWeight.normal)),
        ],
      ),
    );
  }

  Widget _buildGridState() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
         Padding(
           padding: const EdgeInsets.fromLTRB(40, 40, 40, 10),
           child: Text("Cámara Oscura", style: TextStyle(fontFamily: 'Inter', fontSize: 40, fontWeight: FontWeight.bold, letterSpacing: -1.5, color: Colors.white.withOpacity(0.95))),
        ),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(40),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 380,
              crossAxisSpacing: 40,
              mainAxisSpacing: 40,
              childAspectRatio: 0.85, 
            ),
            itemCount: _items.length,
            itemBuilder: (context, index) {
              return _buildCupertinoImageCard(_items[index]);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCupertinoImageCard(ImageBatchItem item) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(45), // Extremadamente Redondeado Apple FaceID Flow
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            border: Border.all(color: Colors.white.withOpacity(0.15), width: 1.5),
            borderRadius: BorderRadius.circular(45), 
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
               MagnifierImage(
                 originalBytes: item.originalBytes,
                 processedBytes: item.processedBytes,
                 isProcessing: item.isProcessing,
                 error: item.error,
               ),
               
               if (!item.isProcessing && item.processedBytes != null)
                 Positioned(
                   bottom: 25,
                   left: 25,
                   right: 25,
                   child: ClipRRect(
                     borderRadius: BorderRadius.circular(35),
                     child: BackdropFilter(
                       filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
                       child: Container(
                         padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
                         decoration: BoxDecoration(
                           color: Colors.black.withOpacity(0.45),
                           border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.2),
                           borderRadius: BorderRadius.circular(35)
                         ),
                         child: Row(
                           mainAxisAlignment: MainAxisAlignment.spaceBetween,
                           children: [
                             const Text("HD Extraído", style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w600, color: Colors.white, fontSize: 17, letterSpacing: -0.5)),
                             GestureDetector(
                               onTap: () => _downloadItem(item),
                               child: Container(
                                 padding: const EdgeInsets.all(10),
                                 decoration: BoxDecoration(
                                   color: Colors.white, 
                                   shape: BoxShape.circle,
                                   boxShadow: [BoxShadow(color: Colors.white.withOpacity(0.3), blurRadius: 15)]
                                 ),
                                 child: const Icon(CupertinoIcons.down_arrow, color: Colors.black, size: 22),
                               )
                             )
                           ],
                         ),
                       ),
                     ),
                   ),
                 ),
            ]
          ),
        ),
      ),
    );
  }
}

class MagnifierImage extends StatefulWidget {
  final Uint8List originalBytes;
  final Uint8List? processedBytes;
  final bool isProcessing;
  final String? error;

  const MagnifierImage({Key? key, required this.originalBytes, this.processedBytes, required this.isProcessing, this.error}) : super(key: key);

  @override
  State<MagnifierImage> createState() => _MagnifierImageState();
}

class _MagnifierImageState extends State<MagnifierImage> {
  Offset? _mousePosition;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onHover: (event) {
        if (!widget.isProcessing && widget.processedBytes != null) {
          setState(() => _mousePosition = event.localPosition);
        }
      },
      onExit: (event) => setState(() => _mousePosition = null),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.memory(widget.originalBytes, fit: BoxFit.cover, color: Colors.black.withOpacity(0.4), colorBlendMode: BlendMode.darken),
          if (widget.isProcessing)
             Center(child: Container(
               padding: const EdgeInsets.all(22),
               decoration: BoxDecoration(color: Colors.black.withOpacity(0.65), borderRadius: BorderRadius.circular(25)),
               child: const CupertinoActivityIndicator(radius: 26, color: Colors.white)
             ))
          else if (widget.error != null)
             Center(child: Text(widget.error!, style: const TextStyle(fontFamily: 'Inter', color: CupertinoColors.destructiveRed, fontWeight: FontWeight.bold, fontSize: 18)))
          else if (widget.processedBytes != null && _mousePosition != null) ...[
             ClipPath(
               clipper: CircleClipper(center: _mousePosition!, radius: 110), 
               child: Stack(
                 fit: StackFit.expand,
                 children: [
                   Container(color: const Color(0xFF1C1C1E)), 
                   Image.memory(widget.processedBytes!, fit: BoxFit.cover)
                 ],
               )
             ),
             Positioned(
               left: _mousePosition!.dx - 110, 
               top: _mousePosition!.dy - 110, 
               child: IgnorePointer(
                 child: Container(
                   width: 220, 
                   height: 220, 
                   decoration: BoxDecoration(
                     shape: BoxShape.circle, 
                     border: Border.all(color: Colors.white.withOpacity(0.85), width: 4.5), 
                     boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.6), blurRadius: 40, spreadRadius: 10)]
                   )
                 )
               )
             ),
          ]
        ],
      )
    );
  }
}

class CircleClipper extends CustomClipper<Path> {
  final Offset center;
  final double radius;
  CircleClipper({required this.center, required this.radius});
  @override
  Path getClip(Size size) => Path()..addOval(Rect.fromCircle(center: center, radius: radius));
  @override
  bool shouldReclip(CircleClipper oldClipper) => oldClipper.center != center || oldClipper.radius != radius;
}
