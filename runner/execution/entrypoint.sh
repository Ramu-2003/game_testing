#!/bin/sh
set -eu

case "${1:-}" in
  javascript)
    exec node --disable-proto=throw -
    ;;
  python)
    exec python3 -I -
    ;;
  java)
    mkdir -p /tmp/java-work /tmp/java-classes
    cat > /tmp/java-work/Main.java
    javac -J-Xms16m -J-Xmx160m -J-XX:+UseSerialGC -proc:none -d /tmp/java-classes /tmp/java-work/Main.java
    exec java -Xms16m -Xmx96m -XX:+UseSerialGC -cp /tmp/java-classes Main
    ;;
  *)
    echo "Unsupported language." >&2
    exit 64
    ;;
esac
