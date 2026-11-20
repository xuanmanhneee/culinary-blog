#!/bin/sh
set -e

CERT_DIR=/etc/nginx/certs
mkdir -p "$CERT_DIR"

if [ -s "$CERT_DIR/tls.crt" ] && [ -s "$CERT_DIR/tls.key" ]; then
  echo "TLS: dùng chứng chỉ có sẵn trong $CERT_DIR"
  exit 0
fi

CN="${TLS_COMMON_NAME:-localhost}"
echo "TLS: sinh chứng chỉ self-signed cho CN=$CN (chỉ dùng cho dev/local)"
openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout "$CERT_DIR/tls.key" -out "$CERT_DIR/tls.crt" \
  -subj "/CN=$CN" -addext "subjectAltName=DNS:$CN,DNS:localhost,IP:127.0.0.1"
