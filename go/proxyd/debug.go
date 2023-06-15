package proxyd

import (
	"context"
	"reflect"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/log"
)

func debugResult(ctx context.Context, method string, defaultRes *RPCRes, debugRes *RPCRes) {
	if defaultRes.Result == nil && debugRes.Result == nil {
		return
	}
	reqID := GetReqID(ctx)
	debugResult, ok := debugRes.Result.(string)
	if !ok {
		log.Error("Failed to decode debugResult", "method", method, "debugResult", debugResult, "req_id", reqID, "result", debugRes.Result)
	}
	defaultResult, ok := defaultRes.Result.(string)
	if !ok {
		log.Error("Failed to decode defaultResult", "method", method, "defaultResult", defaultResult, "req_id", reqID, "result", defaultRes.Result)
	}
	if debugResult != defaultResult {
		log.Error("Found difference", "method", method, "debugResult", debugResult, "defaultResult", defaultResult, "req_id", reqID)
	} else {
		log.Debug("Response matches", "method", method, "result", debugResult, "req_id", reqID)
	}
}

func debugLogs(ctx context.Context, method string, defaultRes *RPCRes, debugRes *RPCRes) {
	if defaultRes.Result == nil && debugRes.Result == nil {
		return
	}
	reqID := GetReqID(ctx)
	var debugLogs *types.Log
	var defaultLogs *types.Log
	debugLogs, ok := debugRes.Result.(*types.Log)
	if !ok {
		log.Error("Failed to decode debugLogs", "method", method, "debugLogs", debugLogs, "req_id", reqID, "result", debugRes.Result)
	}
	defaultLogs, ok = defaultRes.Result.(*types.Log)
	if !ok {
		log.Error("Failed to decode defaultLogs", "method", method, "defaultLogs", defaultLogs, "req_id", reqID, "result", defaultRes.Result)
	}
	if !reflect.DeepEqual(debugLogs, defaultLogs) {
		log.Error("Found difference", "method", method, "debugLogs", debugLogs, "defaultLogs", defaultLogs, "req_id", reqID)
	} else {
		log.Debug("Response matches", "method", method, "result", debugLogs, "req_id", reqID)
	}
}
