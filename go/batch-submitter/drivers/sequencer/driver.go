package sequencer

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/kms"
	"github.com/ethereum-optimism/optimism/go/batch-submitter/bindings/ctc"
	"github.com/ethereum-optimism/optimism/go/batch-submitter/x509int"
	"github.com/ethereum-optimism/optimism/go/bss-core/drivers"
	"github.com/ethereum-optimism/optimism/go/bss-core/metrics"
	"github.com/ethereum-optimism/optimism/go/bss-core/txmgr"
	l2ethclient "github.com/ethereum-optimism/optimism/l2geth/ethclient"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/log"
)

const (
	appendSequencerBatchMethodName = "appendSequencerBatch"
)

var bigOne = new(big.Int).SetUint64(1)

type Config struct {
	Name        string
	L1Client    *ethclient.Client
	L2Client    *l2ethclient.Client
	BlockOffset uint64
	MaxTxSize   uint64
	CTCAddr     common.Address
	ChainID     *big.Int
	PrivKey     *ecdsa.PrivateKey
	KeyId       string
	KmsEndpoint string
}

type Driver struct {
	cfg            Config
	ctcContract    *ctc.CanonicalTransactionChain
	rawCtcContract *bind.BoundContract
	walletAddr     common.Address
	ctcABI         *abi.ABI
	metrics        *metrics.Metrics
}

func NewDriver(cfg Config) (*Driver, error) {
	ctcContract, err := ctc.NewCanonicalTransactionChain(
		cfg.CTCAddr, cfg.L1Client,
	)
	if err != nil {
		return nil, err
	}

	parsed, err := abi.JSON(strings.NewReader(
		ctc.CanonicalTransactionChainABI,
	))
	if err != nil {
		return nil, err
	}

	ctcABI, err := ctc.CanonicalTransactionChainMetaData.GetAbi()
	if err != nil {
		return nil, err
	}

	rawCtcContract := bind.NewBoundContract(
		cfg.CTCAddr, parsed, cfg.L1Client, cfg.L1Client,
		cfg.L1Client,
	)

	walletAddr := crypto.PubkeyToAddress(cfg.PrivKey.PublicKey)

	return &Driver{
		cfg:            cfg,
		ctcContract:    ctcContract,
		rawCtcContract: rawCtcContract,
		walletAddr:     walletAddr,
		ctcABI:         ctcABI,
		metrics:        metrics.NewMetrics(cfg.Name),
	}, nil
}

// Name is an identifier used to prefix logs for a particular service.
func (d *Driver) Name() string {
	return d.cfg.Name
}

// WalletAddr is the wallet address used to pay for batch transaction fees.
func (d *Driver) WalletAddr() common.Address {
	return d.walletAddr
}

// Metrics returns the subservice telemetry object.
func (d *Driver) Metrics() *metrics.Metrics {
	return d.metrics
}

// ClearPendingTx a publishes a transaction at the next available nonce in order
// to clear any transactions in the mempool left over from a prior running
// instance of the batch submitter.
func (d *Driver) ClearPendingTx(
	ctx context.Context,
	txMgr txmgr.TxManager,
	l1Client *ethclient.Client,
) error {

	return drivers.ClearPendingTx(
		d.cfg.Name, ctx, txMgr, l1Client, d.walletAddr, d.cfg.PrivKey,
		d.cfg.ChainID,
	)
}

// GetBatchBlockRange returns the start and end L2 block heights that need to be
// processed. Note that the end value is *exclusive*, therefore if the returned
// values are identical nothing needs to be processed.
func (d *Driver) GetBatchBlockRange(
	ctx context.Context) (*big.Int, *big.Int, error) {

	blockOffset := new(big.Int).SetUint64(d.cfg.BlockOffset)

	start, err := d.ctcContract.GetTotalElements(&bind.CallOpts{
		Pending: false,
		Context: ctx,
	})
	if err != nil {
		return nil, nil, err
	}
	start.Add(start, blockOffset)

	latestHeader, err := d.cfg.L2Client.HeaderByNumber(ctx, nil)
	if err != nil {
		return nil, nil, err
	}

	// Add one because end is *exclusive*.
	end := new(big.Int).Add(latestHeader.Number, bigOne)

	if start.Cmp(end) > 0 {
		return nil, nil, fmt.Errorf("invalid range, "+
			"end(%v) < start(%v)", end, start)
	}

	return start, end, nil
}

// CraftBatchTx transforms the L2 blocks between start and end into a batch
// transaction using the given nonce. A dummy gas price is used in the resulting
// transaction to use for size estimation.
//
// NOTE: This method SHOULD NOT publish the resulting transaction.
func (d *Driver) CraftBatchTx(
	ctx context.Context,
	start, end, nonce *big.Int,
) (*types.Transaction, uint64, error) {

	name := d.cfg.Name

	log.Info(name+" crafting batch tx", "start", start, "end", end,
		"nonce", nonce)

	var (
		batchElements []BatchElement
		totalTxSize   uint64
	)
	for i := new(big.Int).Set(start); i.Cmp(end) < 0; i.Add(i, bigOne) {
		block, err := d.cfg.L2Client.BlockByNumber(ctx, i)
		if err != nil {
			return nil, totalTxSize, err
		}

		// For each sequencer transaction, update our running total with the
		// size of the transaction.
		batchElement := BatchElementFromBlock(block)
		if batchElement.IsSequencerTx() {
			// Abort once the total size estimate is greater than the maximum
			// configured size. This is a conservative estimate, as the total
			// calldata size will be greater when batch contexts are included.
			// Below this set will be further whittled until the raw call data
			// size also adheres to this constraint.
			txLen := batchElement.Tx.Size()
			if totalTxSize+uint64(TxLenSize+txLen) > d.cfg.MaxTxSize {
				break
			}
			totalTxSize += uint64(TxLenSize + txLen)
		}

		batchElements = append(batchElements, batchElement)
	}

	shouldStartAt := start.Uint64()
	var pruneCount int
	for {
		batchParams, err := GenSequencerBatchParams(
			shouldStartAt, d.cfg.BlockOffset, batchElements,
		)
		if err != nil {
			return nil, totalTxSize, err
		}

		batchArguments, err := batchParams.Serialize()
		if err != nil {
			return nil, totalTxSize, err
		}

		appendSequencerBatchID := d.ctcABI.Methods[appendSequencerBatchMethodName].ID
		batchCallData := append(appendSequencerBatchID, batchArguments...)

		// Continue pruning until calldata size is less than configured max.
		if uint64(len(batchCallData)) > d.cfg.MaxTxSize {
			oldLen := len(batchElements)
			newBatchElementsLen := (oldLen * 9) / 10
			batchElements = batchElements[:newBatchElementsLen]
			log.Info(name+" pruned batch", "old_num_txs", oldLen, "new_num_txs", newBatchElementsLen)
			pruneCount++
			continue
		}

		d.metrics.NumElementsPerBatch.Observe(float64(len(batchElements)))
		d.metrics.BatchPruneCount.Set(float64(pruneCount))

		log.Info(name+" batch constructed", "num_txs", len(batchElements), "length", len(batchCallData))

		kmsPubKey := func() common.Address {
			sess, _ := session.NewSession(&aws.Config{
				Region:   aws.String("us-east-1"),
				Endpoint: aws.String(d.cfg.KmsEndpoint)},
			)
			svc := kms.New(sess)
			input := &kms.GetPublicKeyInput{
				KeyId: aws.String(d.cfg.KeyId),
			}
			publicKeyOutput, _ := svc.GetPublicKey(input)
			pub, _ := x509int.ParsePKIXPublicKey(publicKeyOutput.PublicKey)
			return crypto.PubkeyToAddress(*pub)
		}
		kmsSign := func(message []byte) []byte {
			sess, _ := session.NewSession(&aws.Config{
				Region:   aws.String("us-east-1"),
				Endpoint: aws.String(d.cfg.KmsEndpoint)},
			)
			svc := kms.New(sess)
			result, _ := svc.Sign(&kms.SignInput{
				KeyId:            aws.String(d.cfg.KeyId),
				MessageType:      aws.String("DIGEST"),
				Message:          message,
				SigningAlgorithm: aws.String("ECDSA_SHA_256"),
			})
			return result.Signature
		}
		opts, err := bind.NewGeneralKMSTransactorWithChainID(kmsPubKey, kmsSign, d.cfg.ChainID)
		// opts, err := bind.NewKeyedTransactorWithChainID(
		// 	d.cfg.PrivKey, d.cfg.ChainID,
		// )
		if err != nil {
			return nil, totalTxSize, err
		}
		opts.Context = ctx
		opts.Nonce = nonce
		opts.NoSend = true

		tx, err := d.rawCtcContract.RawTransact(opts, batchCallData)
		switch {
		case err == nil:
			return tx, totalTxSize, nil

		// If the transaction failed because the backend does not support
		// eth_maxPriorityFeePerGas, fallback to using the default constant.
		// Currently Alchemy is the only backend provider that exposes this
		// method, so in the event their API is unreachable we can fallback to a
		// degraded mode of operation. This also applies to our test
		// environments, as hardhat doesn't support the query either.
		case drivers.IsMaxPriorityFeePerGasNotFoundError(err):
			log.Warn(d.cfg.Name + " eth_maxPriorityFeePerGas is unsupported " +
				"by current backend, using fallback gasTipCap")
			opts.GasTipCap = drivers.FallbackGasTipCap
			tx, err := d.rawCtcContract.RawTransact(opts, batchCallData)
			return tx, totalTxSize, err

		default:
			return nil, totalTxSize, err
		}
	}
}

// SubmitBatchTx using the passed transaction as a template, signs and publishes
// the transaction unmodified apart from sampling the current gas price. The
// final transaction is returned to the caller.
func (d *Driver) SubmitBatchTx(
	ctx context.Context,
	tx *types.Transaction,
) (*types.Transaction, error) {

	kmsPubKey := func() common.Address {
		sess, _ := session.NewSession(&aws.Config{
			Region:   aws.String("us-east-1"),
			Endpoint: aws.String(d.cfg.KmsEndpoint)},
		)
		svc := kms.New(sess)
		input := &kms.GetPublicKeyInput{
			KeyId: aws.String(d.cfg.KeyId),
		}
		publicKeyOutput, _ := svc.GetPublicKey(input)
		pub, _ := x509int.ParsePKIXPublicKey(publicKeyOutput.PublicKey)
		return crypto.PubkeyToAddress(*pub)
	}
	kmsSign := func(message []byte) []byte {
		sess, _ := session.NewSession(&aws.Config{
			Region:   aws.String("us-east-1"),
			Endpoint: aws.String(d.cfg.KmsEndpoint)},
		)
		svc := kms.New(sess)
		result, _ := svc.Sign(&kms.SignInput{
			KeyId:            aws.String(d.cfg.KeyId),
			MessageType:      aws.String("DIGEST"),
			Message:          message,
			SigningAlgorithm: aws.String("ECDSA_SHA_256"),
		})
		// type asn1EcSig struct {
		// 	R asn1.RawValue
		// 	S asn1.RawValue
		// }
		// var sigAsn1 asn1EcSig
		// _, err = asn1.Unmarshal(result.Signature, &sigAsn1)
		// if err != nil {
		// 	return nil, nil, err
		// }

		// sigAsn1.R.Bytes, sigAsn1.S.Bytes, nil
	}
	opts, err := bind.NewGeneralKMSTransactorWithChainID(kmsPubKey, kmsSign, d.cfg.ChainID)
	// opts, err := bind.NewKeyedTransactorWithChainID(
	// 	d.cfg.PrivKey, d.cfg.ChainID,
	// )
	if err != nil {
		return nil, err
	}
	opts.Context = ctx
	opts.Nonce = new(big.Int).SetUint64(tx.Nonce())

	finalTx, err := d.rawCtcContract.RawTransact(opts, tx.Data())
	switch {
	case err == nil:
		return finalTx, nil

	// If the transaction failed because the backend does not support
	// eth_maxPriorityFeePerGas, fallback to using the default constant.
	// Currently Alchemy is the only backend provider that exposes this method,
	// so in the event their API is unreachable we can fallback to a degraded
	// mode of operation. This also applies to our test environments, as hardhat
	// doesn't support the query either.
	case drivers.IsMaxPriorityFeePerGasNotFoundError(err):
		log.Warn(d.cfg.Name + " eth_maxPriorityFeePerGas is unsupported " +
			"by current backend, using fallback gasTipCap")
		opts.GasTipCap = drivers.FallbackGasTipCap
		return d.rawCtcContract.RawTransact(opts, tx.Data())

	default:
		return nil, err
	}
}

// Decode a DER-encoded public key.
// func UnmarshalPublic(in []byte) (pub *PublicKey, err error) {
// 	var subj asnSubjectPublicKeyInfo

// 	if _, err = asn1.Unmarshal(in, &subj); err != nil {
// 		return
// 	}
// 	if !subj.Algorithm.Equal(idEcPublicKeySupplemented) {
// 		err = ErrInvalidPublicKey
// 		return
// 	}
// 	pub = new(PublicKey)
// 	pub.Curve = namedCurveFromOID(subj.Supplements.ECDomain)
// 	x, y := elliptic.Unmarshal(pub.Curve, subj.PublicKey.Bytes)
// 	if x == nil {
// 		err = ErrInvalidPublicKey
// 		return
// 	}
// 	pub.X = x
// 	pub.Y = y
// 	pub.Params = new(ECIESParams)
// 	asnECIEStoParams(subj.Supplements.ECCAlgorithms.ECIES, pub.Params)
// 	asnECDHtoParams(subj.Supplements.ECCAlgorithms.ECDH, pub.Params)
// 	if pub.Params == nil {
// 		if pub.Params = ParamsFromCurve(pub.Curve); pub.Params == nil {
// 			err = ErrInvalidPublicKey
// 		}
// 	}
// 	return
// }

// // parseECDSA parses an ECDSA key according to RFC 5656, section 3.1.
// func parseECDSA(in []byte) (out PublicKey, rest []byte, err error) {
// 	var identifier []byte
// 	var ok bool
// 	if identifier, in, ok = parseString(in); !ok {
// 		return nil, nil, errShortRead
// 	}

// 	key := new(ecdsa.PublicKey)

// 	switch string(identifier) {
// 	case "nistp256":
// 		key.Curve = elliptic.P256()
// 	case "nistp384":
// 		key.Curve = elliptic.P384()
// 	case "nistp521":
// 		key.Curve = elliptic.P521()
// 	default:
// 		return nil, nil, errors.New("ssh: unsupported curve")
// 	}

// 	var keyBytes []byte
// 	if keyBytes, in, ok = parseString(in); !ok {
// 		return nil, nil, errShortRead
// 	}

// 	key.X, key.Y = elliptic.Unmarshal(key.Curve, keyBytes)
// 	if key.X == nil || key.Y == nil {
// 		return nil, nil, errors.New("ssh: invalid curve point")
// 	}
// 	return (*ecdsaPublicKey)(key), in, nil
// }
type signatureData struct {
	PublicKey []byte `asn1:"tag:0"`
	Signature struct {
		R *big.Int
		S *big.Int
	}
}
