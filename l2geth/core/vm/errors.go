// Copyright 2014 The go-ethereum Authors
// This file is part of the go-ethereum library.
//
// The go-ethereum library is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// The go-ethereum library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with the go-ethereum library. If not, see <http://www.gnu.org/licenses/>.

package vm

import "errors"

// List execution errors
var (
	ErrOutOfGas                 = errors.New("out of gas")
	ErrCodeStoreOutOfGas        = errors.New("contract creation code storage out of gas")
	ErrDepth                    = errors.New("max call depth exceeded")
	ErrTraceLimitReached        = errors.New("the number of logs reached the specified limit")
	ErrInsufficientBalance      = errors.New("insufficient balance for transfer")
	ErrContractAddressCollision = errors.New("contract address collision")
	ErrNoCompatibleInterpreter  = errors.New("no compatible interpreter")
	ErrTuringDepth              = errors.New("turing call depth exceeded")
	ErrTuringEmpty              = errors.New("turing replay data not found")
	ErrTuringWrongState         = errors.New("turing wrong state (rType not equal to 1)")
	ErrTuringCallDataShort      = errors.New("turing calldata too short")
	ErrTuringRNError            = errors.New("turing random number generation failed")
	ErrTuringMissCache          = errors.New("turing missing cache entry")
	ErrTuringUrlInvalid         = errors.New("turing bobaTuringCall:URL is longer than 64")
	ErrTuringClientError        = errors.New("turing client error")
	ErrTuringRawResponseTooLong = errors.New("turing raw response too long (more than 322)")
	ErrTuringDecodeError        = errors.New("turing error decoding responseString")
	ErrTuringResponseTooLong    = errors.New("turing response too big (more than 160 bytes)")
	ErrTuringClientFail         = errors.New("turing failed to create client for off-chain request ")
	ErrGasUintOverflow          = errors.New("gas uint64 overflow")
)
