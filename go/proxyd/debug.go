package proxyd

import (
	"reflect"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/log"
)

func debugResult(method string, defaultRes *RPCRes, debugRes *RPCRes) {
	debugResult, ok := debugRes.Result.(string)
	if !ok {
		log.Error("Failed to decode debugResult", "method", method, "debugResult", debugResult)
	}
	defaultResult, ok := defaultRes.Result.(string)
	if !ok {
		log.Error("Failed to decode defaultResult", "method", method, "defaultResult", defaultResult)
	}
	if debugResult != defaultResult {
		log.Error("Found difference", "method", method, "debugResult", debugResult, "defaultResult", defaultResult)
	} else {
		log.Debug("Response matches", "method", method, "result", debugResult)
	}
	return
}

func debugLogs(method string, defaultRes *RPCRes, debugRes *RPCRes) {
	var debugLogs *types.Log
	var defaultLogs *types.Log
	debugLogs, ok := debugRes.Result.(*types.Log)
	if !ok {
		log.Error("Failed to decode debugLogs", "method", method, "debugLogs", debugLogs)
	}
	defaultLogs, ok = defaultRes.Result.(*types.Log)
	if !ok {
		log.Error("Failed to decode defaultLogs", "method", method, "defaultLogs", defaultLogs)
	}
	if !reflect.DeepEqual(debugLogs, defaultLogs) {
		log.Error("Found difference", "method", method, "debugLogs", debugLogs, "defaultLogs", defaultLogs)
	} else {
		log.Debug("Response matches", "method", method, "result", debugLogs)
	}
	return
}
