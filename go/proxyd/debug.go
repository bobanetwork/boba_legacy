package proxyd

import (
	"context"
	"encoding/json"
	"reflect"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/log"
)

func debugResult(ctx context.Context, method string, rpcReqs *RPCReq, defaultRes *RPCRes, debugRes *RPCRes) {
	reqID := GetReqID(ctx)
	body := mustMarshalJSON(rpcReqs)
	var bodyReader interface{}
	if err := json.Unmarshal(body, &bodyReader); err != nil {
		log.Error("Failed to decode body", "method", method, "body", body, "req_id", reqID, "err", err)
	}
	if reflect.DeepEqual(defaultRes.Result, debugRes.Result) {
		log.Debug("Response matches", "method", method, "result", debugResult, "req_id", reqID, "req", bodyReader)
		return
	}
	debugResult, ok := debugRes.Result.(string)
	if !ok {
		log.Error("Failed to decode debugResult", "method", method, "debugResult", debugResult, "req_id", reqID, "result", debugRes.Result, "req", bodyReader)
	}
	defaultResult, ok := defaultRes.Result.(string)
	if !ok {
		log.Error("Failed to decode defaultResult", "method", method, "defaultResult", defaultResult, "req_id", reqID, "result", defaultRes.Result, "req", bodyReader)
	}
	if debugResult != defaultResult {
		log.Error("Found difference", "method", method, "debugResult", debugResult, "defaultResult", defaultResult, "req_id", reqID, "req", bodyReader)
	} else {
		log.Debug("Response matches", "method", method, "result", debugResult, "req_id", reqID, "req", bodyReader)
	}
}

func debugLogs(ctx context.Context, method string, rpcReqs *RPCReq, defaultRes *RPCRes, debugRes *RPCRes) {
	reqID := GetReqID(ctx)
	body := mustMarshalJSON(rpcReqs)
	var bodyReader interface{}
	if err := json.Unmarshal(body, &bodyReader); err != nil {
		log.Error("Failed to decode body", "method", method, "body", body, "req_id", reqID, "err", err)
	}
	if reflect.DeepEqual(defaultRes.Result, debugRes.Result) {
		log.Debug("Response matches", "method", method, "result", debugLogs, "req_id", reqID, "req", bodyReader)
		return
	}
	var debugLogs *types.Log
	var defaultLogs *types.Log
	debugLogs, ok := debugRes.Result.(*types.Log)
	if !ok {
		log.Error("Failed to decode debugLogs", "method", method, "debugLogs", debugLogs, "req_id", reqID, "result", debugRes.Result, "req", bodyReader)
	}
	defaultLogs, ok = defaultRes.Result.(*types.Log)
	if !ok {
		log.Error("Failed to decode defaultLogs", "method", method, "defaultLogs", defaultLogs, "req_id", reqID, "result", defaultRes.Result, "req", bodyReader)
	}
	if !reflect.DeepEqual(debugLogs, defaultLogs) {
		log.Error("Found difference", "method", method, "debugLogs", debugLogs, "defaultLogs", defaultLogs, "req_id", reqID, "req", bodyReader)
	} else {
		log.Debug("Response matches", "method", method, "result", debugLogs, "req_id", reqID, "req", bodyReader)
	}
}
