FROM postgres:17-alpine

RUN apk add --no-cache aws-cli

COPY backup.sh /usr/local/bin/backup
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /usr/local/bin/backup /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
