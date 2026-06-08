FROM alpine:3.18

RUN apk add --no-cache net-snmp net-snmp-tools bash

RUN mkdir -p /var/lib/net-snmp /etc/snmp /usr/local/bin

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY mock_metrics.sh /usr/local/bin/mock_metrics.sh

RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/mock_metrics.sh

EXPOSE 161/udp

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
