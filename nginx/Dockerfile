FROM nginx:1.27-alpine
RUN apk add --no-cache openssl
COPY nginx.conf /etc/nginx/nginx.conf
# Tự sinh chứng chỉ self-signed nếu chưa mount cert thật vào /etc/nginx/certs (dev/local).
COPY docker-entrypoint.d/10-self-signed-cert.sh /docker-entrypoint.d/10-self-signed-cert.sh
# tr -d '\r' phòng trường hợp checkout CRLF trên Windows làm hỏng shebang.
RUN tr -d '\r' < /docker-entrypoint.d/10-self-signed-cert.sh > /tmp/cert.sh \
    && mv /tmp/cert.sh /docker-entrypoint.d/10-self-signed-cert.sh \
    && chmod +x /docker-entrypoint.d/10-self-signed-cert.sh \
    && mkdir -p /var/cache/nginx/ready
EXPOSE 80 443
