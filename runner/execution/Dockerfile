FROM node:22-alpine

RUN apk add --no-cache python3 openjdk17-jdk \
    && addgroup -S -g 10001 runner \
    && adduser -S -D -H -u 10001 -G runner runner

COPY --chown=10001:10001 entrypoint.sh /runner/entrypoint.sh
RUN chmod 0555 /runner/entrypoint.sh

USER 10001:10001
WORKDIR /workspace
ENV HOME=/tmp \
    TMPDIR=/tmp \
    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

ENTRYPOINT ["/runner/entrypoint.sh"]
