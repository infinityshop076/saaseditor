#!/bin/bash
cd frontend-flutter
if [ ! -d "flutter" ]; then
    git clone https://github.com/flutter/flutter.git -b stable
fi
export PATH="$PATH:`pwd`/flutter/bin"
flutter config --enable-web
flutter build web --release
