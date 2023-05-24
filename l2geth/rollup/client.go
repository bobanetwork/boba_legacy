package rollup

import (
	"errors"
	"fmt"
	"math/big"
	"strconv"

	"github.com/ethereum-optimism/optimism/l2geth/common"
	"github.com/ethereum-optimism/optimism/l2geth/common/hexutil"
	"github.com/ethereum-optimism/optimism/l2geth/core/types"
	"github.com/ethereum-optimism/optimism/l2geth/crypto"
	"github.com/ethereum-optimism/optimism/l2geth/log"
	"github.com/go-resty/resty/v2"
)

// Constants that are used to compare against values in the deserialized JSON
// fetched by the RollupClient
const (
	sequencer = "sequencer"
	l1        = "l1"
)

// errElementNotFound represents the error case of the remote element not being
// found. It applies to transactions, queue elements and batches
var errElementNotFound = errors.New("element not found")

// errHttpError represents the error case of when the remote server
// returns a 400 or greater error
var errHTTPError = errors.New("http error")

// Batch represents the data structure that is submitted with
// a series of transactions to layer one
type Batch struct {
	Index             uint64         `json:"index"`
	Root              common.Hash    `json:"root,omitempty"`
	Size              uint32         `json:"size,omitempty"`
	PrevTotalElements uint32         `json:"prevTotalElements,omitempty"`
	ExtraData         hexutil.Bytes  `json:"extraData,omitempty"`
	BlockNumber       uint64         `json:"blockNumber"`
	Timestamp         uint64         `json:"timestamp"`
	Submitter         common.Address `json:"submitter"`
}

// EthContext represents the L1 EVM context that is injected into
// the OVM at runtime. It is updated with each `enqueue` transaction
// and needs to be fetched from a remote server to be updated when
// too much time has passed between `enqueue` transactions.
type EthContext struct {
	BlockNumber uint64      `json:"blockNumber"`
	BlockHash   common.Hash `json:"blockHash"`
	Timestamp   uint64      `json:"timestamp"`
}

// SyncStatus represents the state of the remote server. The SyncService
// does not want to begin syncing until the remote server has fully synced.
type SyncStatus struct {
	Syncing                      bool   `json:"syncing"`
	HighestKnownTransactionIndex uint64 `json:"highestKnownTransactionIndex"`
	CurrentTransactionIndex      uint64 `json:"currentTransactionIndex"`
}

// L1GasPrice represents the gas price of L1. It is used as part of the gas
// estimatation logic.
type L1GasPrice struct {
	GasPrice string `json:"gasPrice"`
}

// transaction represents the return result of the remote server.
// It either came from a batch or was replicated from the sequencer.
type transaction struct {
	Index       uint64          `json:"index"`
	BatchIndex  uint64          `json:"batchIndex"`
	BlockNumber uint64          `json:"blockNumber"`
	Timestamp   uint64          `json:"timestamp"`
	Value       *hexutil.Big    `json:"value"`
	GasLimit    uint64          `json:"gasLimit,string"`
	Target      common.Address  `json:"target"`
	Origin      *common.Address `json:"origin"`
	Data        hexutil.Bytes   `json:"data"`
	QueueOrigin string          `json:"queueOrigin"`
	QueueIndex  *uint64         `json:"queueIndex"`
	Decoded     *decoded        `json:"decoded"`
	Turing      hexutil.Bytes   `json:"turing"`
}

// Enqueue represents an `enqueue` transaction or a L1 to L2 transaction.
type Enqueue struct {
	Index       *uint64         `json:"ctcIndex"`
	Target      *common.Address `json:"target"`
	Data        *hexutil.Bytes  `json:"data"`
	GasLimit    *uint64         `json:"gasLimit,string"`
	Origin      *common.Address `json:"origin"`
	BlockNumber *uint64         `json:"blockNumber"`
	Timestamp   *uint64         `json:"timestamp"`
	QueueIndex  *uint64         `json:"index"`
	Turing      *hexutil.Bytes  `json:"turing"`
}

// signature represents a secp256k1 ECDSA signature
type signature struct {
	R hexutil.Bytes `json:"r"`
	S hexutil.Bytes `json:"s"`
	V uint          `json:"v"`
}

// decoded represents the decoded transaction from the batch.
// When this struct exists in other structs and is set to `nil`,
// it means that the decoding failed.
type decoded struct {
	Signature signature       `json:"sig"`
	Value     *hexutil.Big    `json:"value"`
	GasLimit  uint64          `json:"gasLimit,string"`
	GasPrice  uint64          `json:"gasPrice,string"`
	Nonce     uint64          `json:"nonce,string"`
	Target    *common.Address `json:"target"`
	Data      hexutil.Bytes   `json:"data"`
}

// RollupClient is able to query for information
// that is required by the SyncService
type RollupClient interface {
	GetEnqueue(index uint64) (*types.Transaction, error)
	GetLatestEnqueue() (*types.Transaction, error)
	GetLatestEnqueueIndex() (*uint64, error)
	GetTransaction(uint64, Backend) (*types.Transaction, error)
	GetLatestTransaction(Backend) (*types.Transaction, error)
	GetLatestTransactionIndex(Backend) (*uint64, error)
	GetEthContext(uint64) (*EthContext, error)
	GetLatestEthContext() (*EthContext, error)
	GetLastConfirmedEnqueue() (*types.Transaction, error)
	GetLatestTransactionBatch() (*Batch, []*types.Transaction, error)
	GetLatestTransactionBatchIndex() (*uint64, error)
	GetTransactionBatch(uint64) (*Batch, []*types.Transaction, error)
	SyncStatus(Backend) (*SyncStatus, error)
}

// Client is an HTTP based RollupClient
type Client struct {
	client  *resty.Client
	chainID *big.Int
}

// TransactionResponse represents the response from the remote server when
// querying transactions.
type TransactionResponse struct {
	Transaction *transaction `json:"transaction"`
	Batch       *Batch       `json:"batch"`
}

// TransactionBatchResponse represents the response from the remote server
// when querying batches.
type TransactionBatchResponse struct {
	Batch        *Batch         `json:"batch"`
	Transactions []*transaction `json:"transactions"`
}

// NewClient create a new Client given a remote HTTP url and a chain id
func NewClient(url string, chainID *big.Int) *Client {
	client := resty.New()
	client.SetHostURL(url)
	client.SetHeader("User-Agent", "sequencer")
	client.OnAfterResponse(func(c *resty.Client, r *resty.Response) error {
		statusCode := r.StatusCode()
		if statusCode >= 400 {
			method := r.Request.Method
			url := r.Request.URL
			return fmt.Errorf("%d cannot %s %s: %w", statusCode, method, url, errHTTPError)
		}
		return nil
	})

	return &Client{
		client:  client,
		chainID: chainID,
	}
}

// GetEnqueue fetches an `enqueue` transaction by queue index
func (c *Client) GetEnqueue(index uint64) (*types.Transaction, error) {
	str := strconv.FormatUint(index, 10)
	response, err := c.client.R().
		SetPathParams(map[string]string{
			"index": str,
		}).
		SetResult(&Enqueue{}).
		Get("/enqueue/index/{index}")

	if err != nil {
		return nil, fmt.Errorf("cannot fetch enqueue: %w", err)
	}
	enqueue, ok := response.Result().(*Enqueue)
	if !ok {
		return nil, fmt.Errorf("Cannot fetch enqueue %d", index)
	}
	if enqueue == nil {
		return nil, fmt.Errorf("Cannot deserialize enqueue %d", index)
	}
	tx, err := enqueueToTransaction(enqueue)
	if err != nil {
		return nil, err
	}
	return tx, nil
}

// enqueueToTransaction turns an Enqueue into a types.Transaction
// so that it can be consumed by the SyncService
func enqueueToTransaction(enqueue *Enqueue) (*types.Transaction, error) {
	if enqueue == nil {
		return nil, errElementNotFound
	}
	// When the queue index is nil, is means that the enqueue'd transaction
	// does not exist.
	if enqueue.QueueIndex == nil {
		return nil, errElementNotFound
	}
	// The queue index is the nonce
	nonce := *enqueue.QueueIndex

	if enqueue.Target == nil {
		return nil, errors.New("Target not found for enqueue tx")
	}
	target := *enqueue.Target

	if enqueue.GasLimit == nil {
		return nil, errors.New("Gas limit not found for enqueue tx")
	}
	gasLimit := *enqueue.GasLimit
	if enqueue.Origin == nil {
		return nil, errors.New("Origin not found for enqueue tx")
	}
	origin := *enqueue.Origin
	if enqueue.BlockNumber == nil {
		return nil, errors.New("Blocknumber not found for enqueue tx")
	}
	blockNumber := new(big.Int).SetUint64(*enqueue.BlockNumber)
	if enqueue.Timestamp == nil {
		return nil, errors.New("Timestamp not found for enqueue tx")
	}
	timestamp := *enqueue.Timestamp

	if enqueue.Data == nil {
		return nil, errors.New("Data not found for enqueue tx")
	}
	data := *enqueue.Data

	turing := hexutil.Bytes([]byte{0})
	if enqueue.Turing == nil {
		log.Trace("TURING: rollup/client.go Enqueue tx with nil Turing")
	} else {
		log.Info("TURING: rollup/client.go Enqueue tx with non-nil Turing", "enqueue_turing", enqueue.Turing)
		turing = *enqueue.Turing
	}

	// enqueue transactions have no value
	value := big.NewInt(0)
	tx := types.NewTransaction(nonce, target, value, gasLimit, big.NewInt(0), data)

	// The index does not get a check as it is allowed to be nil in the context
	// of an enqueue transaction that has yet to be included into the CTC
	txMeta := types.NewTransactionMeta(
		blockNumber,
		timestamp,
		turing,
		&origin,
		types.QueueOriginL1ToL2,
		enqueue.Index,
		enqueue.QueueIndex,
		data,
	)
	tx.SetTransactionMeta(txMeta)

	return tx, nil
}

// GetLatestEnqueue fetches the latest `enqueue`, meaning the `enqueue`
// transaction with the greatest queue index.
func (c *Client) GetLatestEnqueue() (*types.Transaction, error) {
	response, err := c.client.R().
		SetResult(&Enqueue{}).
		Get("/enqueue/latest")

	if err != nil {
		return nil, fmt.Errorf("cannot fetch latest enqueue: %w", err)
	}
	enqueue, ok := response.Result().(*Enqueue)
	if !ok {
		return nil, errors.New("Cannot fetch latest enqueue")
	}
	tx, err := enqueueToTransaction(enqueue)
	if err != nil {
		return nil, fmt.Errorf("Cannot parse enqueue tx: %w", err)
	}
	return tx, nil
}

// GetLatestEnqueueIndex returns the latest `enqueue()` index
func (c *Client) GetLatestEnqueueIndex() (*uint64, error) {
	tx, err := c.GetLatestEnqueue()
	if err != nil {
		return nil, err
	}
	index := tx.GetMeta().QueueIndex
	if index == nil {
		return nil, errors.New("Latest queue index is nil")
	}
	return index, nil
}

// GetLatestTransactionIndex returns the latest CTC index that has been batch
// submitted or not, depending on the backend
func (c *Client) GetLatestTransactionIndex(backend Backend) (*uint64, error) {
	tx, err := c.GetLatestTransaction(backend)
	if err != nil {
		return nil, err
	}
	index := tx.GetMeta().Index
	if index == nil {
		return nil, errors.New("Latest index is nil")
	}
	return index, nil
}

// GetLatestTransactionBatchIndex returns the latest transaction batch index
func (c *Client) GetLatestTransactionBatchIndex() (*uint64, error) {
	batch, _, err := c.GetLatestTransactionBatch()
	if err != nil {
		return nil, err
	}
	index := batch.Index
	return &index, nil
}

// batchedTransactionToTransaction converts a transaction into a
// types.Transaction that can be consumed by the SyncService
func batchedTransactionToTransaction(res *transaction, chainID *big.Int) (*types.Transaction, error) {
	// `nil` transactions are not found
	if res == nil {
		return nil, errElementNotFound
	}
	// The queue origin must be either sequencer of l1, otherwise
	// it is considered an unknown queue origin and will not be processed
	var queueOrigin types.QueueOrigin
	switch res.QueueOrigin {
	case sequencer:
		queueOrigin = types.QueueOriginSequencer
	case l1:
		queueOrigin = types.QueueOriginL1ToL2
	default:
		return nil, fmt.Errorf("Unknown queue origin: %s", res.QueueOrigin)
	}
	// Transactions that have been decoded are
	// Queue Origin Sequencer transactions
	if res.Decoded != nil {
		nonce := res.Decoded.Nonce
		to := res.Decoded.Target
		value := (*big.Int)(res.Decoded.Value)
		// Note: there are two gas limits, one top level and
		// another on the raw transaction itself. Maybe maxGasLimit
		// for the top level?
		gasLimit := res.Decoded.GasLimit
		gasPrice := new(big.Int).SetUint64(res.Decoded.GasPrice)
		data := res.Decoded.Data

		var tx *types.Transaction
		if to == nil {
			tx = types.NewContractCreation(nonce, value, gasLimit, gasPrice, data)
		} else {
			tx = types.NewTransaction(nonce, *to, value, gasLimit, gasPrice, data)
		}

		txMeta := types.NewTransactionMeta(
			new(big.Int).SetUint64(res.BlockNumber),
			res.Timestamp,
			res.Turing,
			res.Origin,
			queueOrigin,
			&res.Index,
			res.QueueIndex,
			res.Data,
		)
		tx.SetTransactionMeta(txMeta)

		r, s := res.Decoded.Signature.R, res.Decoded.Signature.S
		sig := make([]byte, crypto.SignatureLength)
		copy(sig[32-len(r):32], r)
		copy(sig[64-len(s):64], s)

		var signer types.Signer
		if res.Decoded.Signature.V == 27 || res.Decoded.Signature.V == 28 {
			signer = types.HomesteadSigner{}
			sig[64] = byte(res.Decoded.Signature.V - 27)
		} else {
			signer = types.NewEIP155Signer(chainID)
			sig[64] = byte(res.Decoded.Signature.V)
		}

		tx, err := tx.WithSignature(signer, sig[:])
		if err != nil {
			return nil, fmt.Errorf("Cannot add signature to transaction: %w", err)
		}

		return tx, nil
	}

	// The transaction is  either an L1 to L2 transaction or it does not have a
	// known deserialization
	nonce := uint64(0)
	if res.QueueOrigin == l1 {
		if res.QueueIndex == nil {
			return nil, errors.New("Queue origin L1 to L2 without a queue index")
		}
		nonce = *res.QueueIndex
	}
	target := res.Target
	gasLimit := res.GasLimit
	data := res.Data
	origin := res.Origin
	value := (*big.Int)(res.Value)
	tx := types.NewTransaction(nonce, target, value, gasLimit, big.NewInt(0), data)
	txMeta := types.NewTransactionMeta(
		new(big.Int).SetUint64(res.BlockNumber),
		res.Timestamp,
		res.Turing,
		origin,
		queueOrigin,
		&res.Index,
		res.QueueIndex,
		res.Data,
	)
	tx.SetTransactionMeta(txMeta)
	return tx, nil
}

// GetTransaction will get a transaction by Canonical Transaction Chain index
func (c *Client) GetTransaction(index uint64, backend Backend) (*types.Transaction, error) {
	str := strconv.FormatUint(index, 10)
	response, err := c.client.R().
		SetPathParams(map[string]string{
			"index": str,
		}).
		SetQueryParams(map[string]string{
			"backend": backend.String(),
		}).
		SetResult(&TransactionResponse{}).
		Get("/transaction/index/{index}")

	if err != nil {
		return nil, fmt.Errorf("cannot fetch transaction: %w", err)
	}
	res, ok := response.Result().(*TransactionResponse)
	if !ok {
		return nil, fmt.Errorf("could not get tx with index %d", index)
	}
	return batchedTransactionToTransaction(res.Transaction, c.chainID)
}

// GetLatestTransaction will get the latest transaction, meaning the transaction
// with the greatest Canonical Transaction Chain index
func (c *Client) GetLatestTransaction(backend Backend) (*types.Transaction, error) {
	response, err := c.client.R().
		SetResult(&TransactionResponse{}).
		SetQueryParams(map[string]string{
			"backend": backend.String(),
		}).
		Get("/transaction/latest")

	if err != nil {
		return nil, fmt.Errorf("cannot fetch latest transactions: %w", err)
	}
	res, ok := response.Result().(*TransactionResponse)
	if !ok {
		return nil, errors.New("Cannot get latest transaction")
	}

	return batchedTransactionToTransaction(res.Transaction, c.chainID)
}

// GetEthContext will return the EthContext by block number
func (c *Client) GetEthContext(blockNumber uint64) (*EthContext, error) {
	str := strconv.FormatUint(blockNumber, 10)
	response, err := c.client.R().
		SetPathParams(map[string]string{
			"blocknumber": str,
		}).
		SetResult(&EthContext{}).
		Get("/eth/context/blocknumber/{blocknumber}")

	if err != nil {
		return nil, err
	}

	context, ok := response.Result().(*EthContext)
	if !ok {
		return nil, errors.New("Cannot parse EthContext")
	}
	return context, nil
}

// GetLatestEthContext will return the latest EthContext
func (c *Client) GetLatestEthContext() (*EthContext, error) {
	response, err := c.client.R().
		SetResult(&EthContext{}).
		Get("/eth/context/latest")

	if err != nil {
		return nil, fmt.Errorf("Cannot fetch eth context: %w", err)
	}

	context, ok := response.Result().(*EthContext)
	if !ok {
		return nil, errors.New("Cannot parse EthContext")
	}

	return context, nil
}

// GetLastConfirmedEnqueue will get the last `enqueue` transaction that has been
// batched up
func (c *Client) GetLastConfirmedEnqueue() (*types.Transaction, error) {
	enqueue, err := c.GetLatestEnqueue()
	if err != nil {
		return nil, fmt.Errorf("Cannot get latest enqueue: %w", err)
	}
	// This should only happen if there are no L1 to L2 transactions yet
	if enqueue == nil {
		return nil, errElementNotFound
	}
	// Work backwards looking for the first enqueue
	// to have an index, which means it has been included
	// in the canonical transaction chain.
	for {
		meta := enqueue.GetMeta()
		// The enqueue has an index so it has been confirmed
		if meta.Index != nil {
			return enqueue, nil
		}
		// There is no queue index so this is a bug
		if meta.QueueIndex == nil {
			return nil, fmt.Errorf("queue index is nil")
		}
		// No enqueue transactions have been confirmed yet
		if *meta.QueueIndex == uint64(0) {
			return nil, errElementNotFound
		}
		next, err := c.GetEnqueue(*meta.QueueIndex - 1)
		if err != nil {
			return nil, fmt.Errorf("cannot get enqueue %d: %w", *meta.Index, err)
		}
		enqueue = next
	}
}

// SyncStatus will query the remote server to determine if it is still syncing
func (c *Client) SyncStatus(backend Backend) (*SyncStatus, error) {
	response, err := c.client.R().
		SetResult(&SyncStatus{}).
		SetQueryParams(map[string]string{
			"backend": backend.String(),
		}).
		Get("/eth/syncing")

	if err != nil {
		return nil, fmt.Errorf("Cannot fetch sync status: %w", err)
	}

	status, ok := response.Result().(*SyncStatus)
	if !ok {
		return nil, fmt.Errorf("Cannot parse sync status")
	}

	return status, nil
}

// GetLatestTransactionBatch will return the latest transaction batch
func (c *Client) GetLatestTransactionBatch() (*Batch, []*types.Transaction, error) {
	response, err := c.client.R().
		SetResult(&TransactionBatchResponse{}).
		Get("/batch/transaction/latest")

	if err != nil {
		return nil, nil, errors.New("Cannot get latest transaction batch")
	}
	txBatch, ok := response.Result().(*TransactionBatchResponse)
	if !ok {
		return nil, nil, fmt.Errorf("Cannot parse transaction batch response")
	}
	return parseTransactionBatchResponse(txBatch, c.chainID)
}

// GetTransactionBatch will return the transaction batch by batch index
func (c *Client) GetTransactionBatch(index uint64) (*Batch, []*types.Transaction, error) {
	str := strconv.FormatUint(index, 10)
	response, err := c.client.R().
		SetResult(&TransactionBatchResponse{}).
		SetPathParams(map[string]string{
			"index": str,
		}).
		Get("/batch/transaction/index/{index}")

	if err != nil {
		return nil, nil, fmt.Errorf("Cannot get transaction batch %d: %w", index, err)
	}
	txBatch, ok := response.Result().(*TransactionBatchResponse)
	if !ok {
		return nil, nil, fmt.Errorf("Cannot parse transaction batch response")
	}
	return parseTransactionBatchResponse(txBatch, c.chainID)
}

// parseTransactionBatchResponse will turn a TransactionBatchResponse into a
// Batch and its corresponding types.Transactions
func parseTransactionBatchResponse(txBatch *TransactionBatchResponse, chainID *big.Int) (*Batch, []*types.Transaction, error) {
	if txBatch == nil || txBatch.Batch == nil {
		return nil, nil, errElementNotFound
	}
	batch := txBatch.Batch
	txs := make([]*types.Transaction, len(txBatch.Transactions))
	for i, tx := range txBatch.Transactions {
		transaction, err := batchedTransactionToTransaction(tx, chainID)
		if err != nil {
			return nil, nil, fmt.Errorf("Cannot parse transaction batch: %w", err)
		}
		txs[i] = transaction
	}
	return batch, txs, nil
}
