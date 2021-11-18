package proxyd

import (
	"encoding/json"
	"io"
	"io/ioutil"
)

type RPCReq struct {
	JSONRPC string          `json:"jsonrpc"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params"`
	ID      *int            `json:"id"`
}

type RPCRes struct {
	JSONRPC string      `json:"jsonrpc"`
	Result  interface{} `json:"result,omitempty"`
	Error   *RPCErr     `json:"error,omitempty"`
	ID      *int        `json:"id"`
}

func (r *RPCRes) IsError() bool {
	return r.Error != nil
}

type RPCErr struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (r *RPCErr) Error() string {
	return r.Message
}

func ParseRPCReq(r io.Reader) ([]RPCReq, error) {
	body, err := ioutil.ReadAll(r)
	if err != nil {
		return nil, wrapErr(err, "error reading request body")
	}
	var arr []RPCReq
	if isBatch(body) {
		err := json.Unmarshal(body, &arr)
		if err != nil {
			return nil, wrapErr(err, "failed to parse JSON batch request: ")
		}
		for _, t := range arr {
			if t.JSONRPC != JSONRPCVersion {
				return nil, ErrInvalidRequest
			}

			if t.Method == "" {
				return nil, ErrInvalidRequest
			}
			// methods = append(methods, t.Method)
			// res = append(res, ModifiedRequest{
			// 	ID:         t.ID,
			// 	Path:       t.Method,
			// 	RemoteAddr: ip,
			// 	Params:     t.Params,
			// })
		}
		return arr, nil
	} else {
		req := new(RPCReq)
		if err := json.Unmarshal(body, req); err != nil {
			return nil, ErrParseErr
		}

		if req.JSONRPC != JSONRPCVersion {
			return nil, ErrInvalidRequest
		}

		if req.Method == "" {
			return nil, ErrInvalidRequest
		}
		arr[0] = *req
		return arr, nil
	}
}

func isBatch(msg []byte) bool {
	for _, c := range msg {
		if c == 0x20 || c == 0x09 || c == 0x0a || c == 0x0d {
			continue
		}
		return c == '['
	}
	return false
}

func ParseRPCRes(r io.Reader) (*RPCRes, error) {
	body, err := ioutil.ReadAll(r)
	if err != nil {
		return nil, wrapErr(err, "error reading RPC response")
	}

	res := new(RPCRes)
	if err := json.Unmarshal(body, res); err != nil {
		return nil, wrapErr(err, "error unmarshaling RPC response")
	}

	return res, nil
}

func NewRPCErrorRes(id *int, err error) *RPCRes {
	var rpcErr *RPCErr
	if rr, ok := err.(*RPCErr); ok {
		rpcErr = rr
	} else {
		rpcErr = &RPCErr{
			Code:    JSONRPCErrorInternal,
			Message: err.Error(),
		}
	}

	return &RPCRes{
		JSONRPC: JSONRPCVersion,
		Error:   rpcErr,
		ID:      id,
	}
}
