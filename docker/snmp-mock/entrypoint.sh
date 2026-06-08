set -e

date +%s > /tmp/container_start_time

SNMP_USER=${SNMP_USER:-"bootstrapUser"}
SNMP_AUTH_PASS=${SNMP_AUTH_PASS:-"authPassword123"}
SNMP_PRIV_PASS=${SNMP_PRIV_PASS:-"privPassword456"}
SNMP_AUTH_PROTO=${SNMP_AUTH_PROTO:-"SHA"}
SNMP_PRIV_PROTO=${SNMP_PRIV_PROTO:-"AES"}

mkdir -p /etc/snmp
mkdir -p /var/lib/net-snmp

cat <<EOF > /etc/snmp/snmpd.conf
agentaddress udp:161

syslocation "Mock Location"
syscontact "admin@mock-fleet.com"
sysname "Mock IoT Drone"
rouser $SNMP_USER authpriv

pass .1.3.6.1.4.1.9999.1 /bin/bash /usr/local/bin/mock_metrics.sh
EOF

cat <<EOF > /var/lib/net-snmp/snmpd.conf
createUser $SNMP_USER $SNMP_AUTH_PROTO "$SNMP_AUTH_PASS" $SNMP_PRIV_PROTO "$SNMP_PRIV_PASS"
EOF

echo "Starting SNMP mock device with user '$SNMP_USER' ($SNMP_AUTH_PROTO / $SNMP_PRIV_PROTO)..."

exec snmpd -f -Lo -C -c /etc/snmp/snmpd.conf
