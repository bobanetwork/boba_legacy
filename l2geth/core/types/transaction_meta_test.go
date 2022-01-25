package types

import (
	"bytes"
	"math/big"
	"reflect"
	"testing"

	"github.com/ethereum/go-ethereum/common"
)

var (
	addr          = common.HexToAddress("095e7baea6a6c7c4c2dfeb977efac326af552d87")
	l1BlockNumber = big.NewInt(0)

	txMetaSerializationTests = []struct {
		l1BlockNumber  *big.Int
		l1Timestamp    uint64
		l1Turing       []byte
		msgSender      *common.Address
		queueOrigin    QueueOrigin
		rawTransaction []byte
	}{
		{
			l1BlockNumber:  l1BlockNumber,
			l1Timestamp:    100,
			l1Turing:       []byte{},
			msgSender:      &addr,
			queueOrigin:    QueueOriginL1ToL2,
			rawTransaction: []byte{255, 255, 255, 255},
		},
		{
			l1BlockNumber:  nil,
			l1Timestamp:    45,
			l1Turing:       []byte{1},
			msgSender:      &addr,
			queueOrigin:    QueueOriginL1ToL2,
			rawTransaction: []byte{42, 69, 42, 69},
		},
		// example of legacy format without l1Turing
		{
			l1BlockNumber:  l1BlockNumber,
			l1Timestamp:    0,
			msgSender:      nil,
			queueOrigin:    QueueOriginSequencer,
			rawTransaction: []byte{8, 8, 8, 8},
		},
		// edge case of l1Turing = nil
		{
			l1BlockNumber:  l1BlockNumber,
			l1Timestamp:    0,
			l1Turing:       nil,
			msgSender:      nil,
			queueOrigin:    QueueOriginSequencer,
			rawTransaction: []byte{0, 0, 0, 0},
		},
		{
			l1BlockNumber:  l1BlockNumber,
			l1Timestamp:    0,
			l1Turing:       []byte{42, 69, 42, 69},
			msgSender:      &addr,
			queueOrigin:    QueueOriginSequencer,
			rawTransaction: []byte{0, 0, 0, 0},
		},
		{
			l1BlockNumber:  nil,
			l1Timestamp:    0,
			l1Turing:       []byte{3},
			msgSender:      nil,
			queueOrigin:    QueueOriginL1ToL2,
			rawTransaction: []byte{7, 8, 9, 10},
		},
		{
			l1BlockNumber:  l1BlockNumber,
			l1Timestamp:    0,
			l1Turing:       []byte{0, 1, 2, 3, 4, 5},
			msgSender:      &addr,
			queueOrigin:    QueueOriginL1ToL2,
			rawTransaction: []byte{0, 0, 0, 0},
		},
	}
)

func TestTransactionMetaEncode(t *testing.T) {
	for _, test := range txMetaSerializationTests {

		txmeta := NewTransactionMeta(test.l1BlockNumber, test.l1Timestamp, test.l1Turing, test.msgSender, test.queueOrigin, nil, nil, test.rawTransaction)

		encoded := TxMetaEncode(txmeta)
		decoded, err := TxMetaDecode(encoded)

		if err != nil {
			t.Fatal(err)
		}

		if !isTxMetaEqual(txmeta, decoded) {
			t.Fatal("Encoding/decoding mismatch")
		}
	}
}

func isTxMetaEqual(meta1 *TransactionMeta, meta2 *TransactionMeta) bool {
	// Maybe can just return this
	if !reflect.DeepEqual(meta1, meta2) {
		return false
	}

	if meta1.L1Timestamp != meta2.L1Timestamp {
		return false
	}

	if meta1.L1MessageSender == nil || meta2.L1MessageSender == nil {
		if meta1.L1MessageSender != meta2.L1MessageSender {
			return false
		}
	} else {
		if !bytes.Equal(meta1.L1MessageSender.Bytes(), meta2.L1MessageSender.Bytes()) {
			return false
		}
	}

	if meta1.L1BlockNumber == nil || meta2.L1BlockNumber == nil {
		if meta1.L1BlockNumber != meta2.L1BlockNumber {
			return false
		}
	} else {
		if !bytes.Equal(meta1.L1BlockNumber.Bytes(), meta2.L1BlockNumber.Bytes()) {
			return false
		}
	}

	if meta1.QueueOrigin != meta2.QueueOrigin {
		return false
	}

	return true
}
