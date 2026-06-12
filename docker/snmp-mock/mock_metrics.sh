#!/bin/bash
START_TIME=$(cat /tmp/container_start_time 2>/dev/null || date +%s)
NOW=$(date +%s)

UPTIME=$(( NOW - START_TIME ))

DRAIN_SPEED=${BATTERY_DRAIN_SPEED:-1}
DRAINED=$(awk -v uptime="$UPTIME" -v speed="$DRAIN_SPEED" 'BEGIN {
    if (speed <= 0) {
        print 0
    } else {
        val = (uptime * speed) / 60
        print int(val)
    }
}')

SEED_BATTERY=${BATTERY_SEED:-${MOCK_BATTERY:-100}}
BATTERY=$(( SEED_BATTERY - DRAINED ))
if [ $BATTERY -lt 0 ]; then
    BATTERY=0
fi

STATUS=${DEVICE_STATUS:-${MOCK_STATUS:-1}}
if [ $BATTERY -eq 0 ]; then
    STATUS=3
fi

SEED_TEMP=${TEMP_SEED:-${MOCK_TEMP:-25}}
TEMP_FLUC=${TEMP_FLUCTUATION:-5}
TEMPERATURE=$(awk -v now="$NOW" -v seed="$SEED_TEMP" -v fluc="$TEMP_FLUC" 'BEGIN {
    fluc_int = int(fluc)
    if (fluc_int <= 1) {
        print int(seed)
    } else {
        val = (now % fluc_int) - int(fluc_int / 2)
        print int(seed + val)
    }
}')

SEED_SIGNAL=${SIGNAL_SEED:- -60}
SIGNAL_FLUC=$(( (NOW % 9) - 4 ))
SIGNAL_STRENGTH=$(( SEED_SIGNAL + SIGNAL_FLUC ))
if [ $SIGNAL_STRENGTH -lt -100 ]; then SIGNAL_STRENGTH=-100; fi
if [ $SIGNAL_STRENGTH -gt -30 ]; then SIGNAL_STRENGTH=-30; fi

SEED_MEMORY=${MEMORY_SEED:-40}
MEMORY_FLUC=$(( (NOW % 15) - 7 ))
MEMORY_USAGE=$(( SEED_MEMORY + MEMORY_FLUC ))
if [ $MEMORY_USAGE -lt 0 ]; then MEMORY_USAGE=0; fi
if [ $MEMORY_USAGE -gt 100 ]; then MEMORY_USAGE=100; fi

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
        .1.3.6.1.4.1.9999.1.5)
            echo "$OID"
            echo "integer"
            echo "$SIGNAL_STRENGTH"
            ;;
        .1.3.6.1.4.1.9999.1.6)
            echo "$OID"
            echo "integer"
            echo "$MEMORY_USAGE"
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
    elif [[ "$OID" == ".1.3.6.1.4.1.9999.1.4" || "$OID" < ".1.3.6.1.4.1.9999.1.5" ]]; then
        echo ".1.3.6.1.4.1.9999.1.5"
        echo "integer"
        echo "$SIGNAL_STRENGTH"
    elif [[ "$OID" == ".1.3.6.1.4.1.9999.1.5" || "$OID" < ".1.3.6.1.4.1.9999.1.6" ]]; then
        echo ".1.3.6.1.4.1.9999.1.6"
        echo "integer"
        echo "$MEMORY_USAGE"
    fi
fi
