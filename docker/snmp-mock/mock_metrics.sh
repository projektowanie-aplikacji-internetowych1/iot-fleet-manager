START_TIME=$(cat /tmp/container_start_time 2>/dev/null || date +%s)
NOW=$(date +%s)

UPTIME=$(( NOW - START_TIME ))

MOCK_BATTERY=${MOCK_BATTERY:-100}
DRAINED=$(( UPTIME / 60 ))
BATTERY=$(( MOCK_BATTERY - DRAINED ))
if [ $BATTERY -lt 0 ]; then
    BATTERY=0
fi

STATUS=${MOCK_STATUS:-1}
if [ $BATTERY -eq 0 ]; then
    STATUS=3
fi

MOCK_TEMP=${MOCK_TEMP:-25}
FLUC=$(( (NOW % 5) - 2 ))
TEMPERATURE=$(( MOCK_TEMP + FLUC ))

if [ "$1" = "-g" ]; then
    OID="$2"
    case "$OID" in
        .1.3.6.1.4.1.9999.1.1)
            echo "$OID"
            echo "integer"
            echo "$BATTERY"
            ;;
        .1.3.6.1.4.1.9999.1.2)
            echo "$OID"
            echo "integer"
            echo "$UPTIME"
            ;;
        .1.3.6.1.4.1.9999.1.3)
            echo "$OID"
            echo "integer"
            echo "$STATUS"
            ;;
        .1.3.6.1.4.1.9999.1.4)
            echo "$OID"
            echo "integer"
            echo "$TEMPERATURE"
            ;;
        *)
            exit 0
            ;;
    esac
fi

if [ "$1" = "-n" ]; then
    OID="$2"
    if [[ "$OID" == ".1.3.6.1.4.1.9999.1" || "$OID" == ".1.3.6.1.4.1.9999.1.0" || "$OID" < ".1.3.6.1.4.1.9999.1.1" ]]; then
        echo ".1.3.6.1.4.1.9999.1.1"
        echo "integer"
        echo "$BATTERY"
    elif [[ "$OID" == ".1.3.6.1.4.1.9999.1.1" || "$OID" < ".1.3.6.1.4.1.9999.1.2" ]]; then
        echo ".1.3.6.1.4.1.9999.1.2"
        echo "integer"
        echo "$UPTIME"
    elif [[ "$OID" == ".1.3.6.1.4.1.9999.1.2" || "$OID" < ".1.3.6.1.4.1.9999.1.3" ]]; then
        echo ".1.3.6.1.4.1.9999.1.3"
        echo "integer"
        echo "$STATUS"
    elif [[ "$OID" == ".1.3.6.1.4.1.9999.1.3" || "$OID" < ".1.3.6.1.4.1.9999.1.4" ]]; then
        echo ".1.3.6.1.4.1.9999.1.4"
        echo "integer"
        echo "$TEMPERATURE"
    fi
fi
