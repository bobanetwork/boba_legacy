package proxyd

import "github.com/ethereum/go-ethereum/log"

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
