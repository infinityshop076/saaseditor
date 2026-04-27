import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:file_saver/file_saver.dart';
import 'package:http/http.dart' as http;
import 'package:desktop_drop/desktop_drop.dart';
import 'package:cross_file/cross_file.dart';

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

  const UploadScreen({Key? key, required this.intensity, required this.onSuccessProcess}) : super(key: key);

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  final List<ImageBatchItem> _items = [];
  bool _isDragging = false;

  void _onFilesDropped(DropDoneDetails details) async {
    final newFiles = details.files;
    int added = 0;
    
    for (var file in newFiles) {
      if (!file.name.toLowerCase().endsWith('.png') && 
          !file.name.toLowerCase().endsWith('.jpg') && 
          !file.name.toLowerCase().endsWith('.jpeg') &&
          !file.name.toLowerCase().endsWith('.webp')) continue;

      if (_items.length >= 10) {
         _showToast("🚀 Llegaste al límite simultáneo de 10 fotos.");
         break;
      }
      
      final bytes = await file.readAsBytes();
      final item = ImageBatchItem(
        id: DateTime.now().millisecondsSinceEpoch.toString() + added.toString(),
        name: file.name,
        originalBytes: bytes,
        isProcessing: true,
      );
      
      setState(() => _items.add(item));
      added++;
      _processItem(item); // Se envía en paralelo
    }
  }

  Future<void> _processItem(ImageBatchItem item) async {
    try {
      final uri = Uri.parse('http://127.0.0.1:8000/edit-image');
      var request = http.MultipartRequest('POST', uri);
      
      // Injectando el nivel del sider a la IA
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
        widget.onSuccessProcess(); // Suma al contador lateral
      } else {
        String errorMsg = 'Error ${response.statusCode}';
        try {
          final errorData = jsonDecode(response.body);
          if (errorData.containsKey('detail')) errorMsg = errorData['detail'];
        } catch (_) {}
        setState(() {
          item.error = errorMsg;
          item.isProcessing = false;
        });
      }
    } catch (e) {
      setState(() {
        item.error = 'Fallo de red al contactar con la IA.';
        item.isProcessing = false;
      });
    }
  }

  Future<void> _downloadItem(ImageBatchItem item) async {
    if (item.processedBytes != null) {
      try {
        String finalName = "limpia_${item.name.split('.').first}";

        await FileSaver.instance.saveFile(
          name: finalName,
          bytes: item.processedBytes,
          ext: 'png',
          mimeType: MimeType.png,
        );
        _showToast("✨ '$finalName' guardada con éxito en tu dispositivo."); 
      } catch (e) {
        _showToast("Error guárdandola: $e");
      }
    }
  }

  void _showToast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(fontWeight: FontWeight.w500, fontFamily: 'Inter')),
      backgroundColor: Colors.black87,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBFBFD), 
      body: DropTarget(
        onDragDone: _onFilesDropped,
        onDragEntered: (detail) => setState(() => _isDragging = true),
        onDragExited: (detail) => setState(() => _isDragging = false),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          color: _isDragging ? Colors.blueAccent.withOpacity(0.04) : Colors.transparent,
          child: Stack(
            children: [
              if (_items.isEmpty)
                _buildEmptyState()
              else
                _buildGridState(),
                
              if (_isDragging)
                Container(
                  color: Colors.white.withOpacity(0.85),
                  child: const Center(
                    child: Text("Suelta la magia aquí ✨", style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.blueAccent, letterSpacing: -1)),
                  ),
                )
            ],
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
          Container(
            padding: EdgeInsets.all(24),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(40), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 30)]),
            child: const Icon(Icons.collections_rounded, size: 80, color: Colors.black87)
          ),
          const SizedBox(height: 32),
          const Text("Arrastra tus fotos", style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.black87, letterSpacing: -1.5)),
          const SizedBox(height: 12),
          const Text("Lote Mágico de hasta 10 fotos a la vez.\nSuéltalas libremente en cualquier lugar.", textAlign: TextAlign.center, style: TextStyle(fontSize: 18, color: Colors.black54, height: 1.5, fontWeight: FontWeight.w400)),
        ],
      ),
    );
  }

  Widget _buildGridState() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
           padding: EdgeInsets.fromLTRB(40, 60, 40, 20),
           child: Text("Lote Mágico Gratis", style: TextStyle(fontSize: 44, fontWeight: FontWeight.bold, letterSpacing: -1.5)),
        ),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(40),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 320,
              crossAxisSpacing: 30,
              mainAxisSpacing: 30,
              childAspectRatio: 1.0, 
            ),
            itemCount: _items.length,
            itemBuilder: (context, index) {
              return AnimatedScale(
                scale: 1.0,
                duration: const Duration(milliseconds: 400),
                curve: Curves.easeOutQuart,
                child: _buildImageCard(_items[index]),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildImageCard(ImageBatchItem item) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          fit: StackFit.expand,
          children: [
             MagnifierImage(
               originalBytes: item.originalBytes,
               processedBytes: item.processedBytes,
               isProcessing: item.isProcessing,
               error: item.error,
             ),
             
             // MENSAJE DE URGENCIA Y DESCARGA LIBRE
             if (!item.isProcessing && item.processedBytes != null) ...[
               // Botón principal de descargar
               Positioned(
                 bottom: 16,
                 right: 16,
                 child: Material(
                   color: Colors.transparent,
                   child: InkWell(
                     borderRadius: BorderRadius.circular(30),
                     onTap: () => _downloadItem(item),
                     child: Container(
                       padding: const EdgeInsets.all(12),
                       decoration: const BoxDecoration(color: Colors.black87, shape: BoxShape.circle),
                       child: const Icon(Icons.download_rounded, color: Colors.white, size: 24),
                     ),
                   ),
                 ),
               ),

               // Etiqueta Urgencia Gratis
               Positioned(
                 bottom: 24,
                 left: 16,
                 child: Container(
                   padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                   decoration: BoxDecoration(
                     color: Colors.amberAccent.withOpacity(0.9),
                     borderRadius: BorderRadius.circular(8),
                     boxShadow: [BoxShadow(color: Colors.orange.withOpacity(0.2), blurRadius: 8)]
                   ),
                   child: const Text("Gratis por tiempo limitado", style: TextStyle(color: Colors.black87, fontSize: 10, fontWeight: FontWeight.bold)),
                 ),
               ),
             ]
          ]
        ),
      ),
    );
  }
}

// ----------------------------------------------------
// LUPA DE IA
// ----------------------------------------------------
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
          Image.memory(widget.originalBytes, fit: BoxFit.cover),
          if (widget.isProcessing)
             Container(color: Colors.white.withOpacity(0.4), child: const Center(child: CircularProgressIndicator(color: Colors.black, strokeWidth: 3)))
          else if (widget.error != null)
             Container(color: Colors.redAccent.withOpacity(0.9), padding: const EdgeInsets.all(16), child: Center(child: Text(widget.error!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14), textAlign: TextAlign.center)))
          else if (widget.processedBytes != null && _mousePosition != null) ...[
             ClipPath(clipper: CircleClipper(center: _mousePosition!, radius: 80), child: Container(color: const Color(0xFFE9E9EB), child: Image.memory(widget.processedBytes!, fit: BoxFit.cover))),
             Positioned(left: _mousePosition!.dx - 80, top: _mousePosition!.dy - 80, child: IgnorePointer(child: Container(width: 160, height: 160, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 3), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 10, spreadRadius: 0)])))),
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
