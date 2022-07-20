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
	ID      json.RawMessage `json:"id"`
}

type RPCRes struct {
	JSONRPC string          `json:"jsonrpc"`
	Result  interface{}     `json:"result,omitempty"`
	Error   *RPCErr         `json:"error,omitempty"`
	ID      json.RawMessage `json:"id"`
}

func (s *RPCReq) UnmarshalJSON(data []byte) error {
	type Alias RPCReq
	aux := &struct {
		*Alias
	}{
		Alias: (*Alias)(s),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		auxAlt := &struct {
			ID json.RawMessage `json:"id"`
			*Alias
		}{
			Alias: (*Alias)(s),
		}
		if err := json.Unmarshal(data, &auxAlt); err == nil {
			s.ID = auxAlt.ID
		}
	}
	return nil
}

func (s *RPCRes) UnmarshalJSON(data []byte) error {
	type Alias RPCRes
	aux := &struct {
		*Alias
	}{
		Alias: (*Alias)(s),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		auxAlt := &struct {
			ID json.RawMessage `json:"id"`
			*Alias
		}{
			Alias: (*Alias)(s),
		}
		if err := json.Unmarshal(data, &auxAlt); err == nil {
			s.ID = auxAlt.ID
		}
	}
	return nil
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

func ParseRPCReq(r io.Reader) ([]RPCReq, bool, error) {
	body, err := ioutil.ReadAll(r)
	if err != nil {
		return nil, true, wrapErr(err, "error reading request body")
	}
	if isBatch(body) {
		var arr []RPCReq
		err := json.Unmarshal(body, &arr)
		if err != nil {
			return nil, true, wrapErr(err, "failed to parse JSON batch request: ")
		}
		for _, t := range arr {
			if t.JSONRPC != JSONRPCVersion {
				return nil, true, ErrInvalidRequest
			}

			if t.Method == "" {
				return nil, true, ErrInvalidRequest
			}
		}
		return arr, true, nil
	} else {

		req := new(RPCReq)
		if err := json.Unmarshal(body, req); err != nil {
			return nil, false, ErrParseErr
		}

		if req.JSONRPC != JSONRPCVersion {
			return nil, false, ErrInvalidRequest
		}

		if req.Method == "" {
			return nil, false, ErrInvalidRequest
		}
		arr := make([]RPCReq, 1)
		arr[0] = *req
		return arr, false, nil
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

func NewRPCErrorRes(id json.RawMessage, err error) *RPCRes {
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
