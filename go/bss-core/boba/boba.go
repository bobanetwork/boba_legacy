package boba

import (
	"context"
	"errors"
	"math/big"
	"time"

	"github.com/ethereum-optimism/optimism/go/bss-core/drivers"
	"github.com/ethereum/go-ethereum/log"
	"github.com/ethereum/go-ethereum/params"
)

var (
	errGasPriceTooHigh   = errors.New("Gas price is higher than gas price")
	errBatchSizeTooSmall = errors.New("Batch size too small or max submission timeout not reached")
)

// Config houses parameters for altering the behavior of a BobaService.
type Config struct {
	// Name is an identifier used to prefix logs for a particular service.
	Name                   string
	Context                context.Context
	L1Client               drivers.L1Client
	MinTxSize              uint64
	MaxBatchSubmissionTime time.Duration
	MaxL1GasPrice          uint64
}

// BobaServiceManager is an interface that allows callers to save gas if
// the batch doesn't meet multiple conditions
type BobaServiceManager interface {
	// VerifyCondition verifies the batch size and l1 gas price.
	// If l1 gas price is larger than MaxL1GasPrice, it returns the errGasPriceTooHigh
	// as the error message
	// If batch size is under MinTxSize and waiting time is below MaxBatchSubmissionTime,
	// it return errBatchSizeTooSmall as the error message
	VerifyCondition(batchSize uint64) error
	// Set the last bacth submission time outside boba service
	SetLastBatchSubmissionTime()
	// Get the last batch submission time
	GetLastBatchSubmissionTime() time.Time
}

type BobaService struct {
	cfg                     Config
	lastBatchSubmissionTime time.Time
}

func NewBobaService(
	name string, context context.Context, MinTxSize uint64,
	MaxL1GasPrice uint64, MaxBatchSubmissionTime time.Duration,
	L1Client drivers.L1Client) *BobaService {
	return &BobaService{
		cfg: Config{
			Name:                   name,
			Context:                context,
			MinTxSize:              MinTxSize,
			MaxL1GasPrice:          MaxL1GasPrice,
			MaxBatchSubmissionTime: MaxBatchSubmissionTime,
			L1Client:               L1Client,
		},
		lastBatchSubmissionTime: time.Now(),
	}
}

func (s *BobaService) VerifyCondition(batchSize uint64) error {
	L1GasPrice, err := s.cfg.L1Client.SuggestGasPrice(s.cfg.Context)
	if err == nil {
		// Check L1 Gas Price
		MaxL1GasPriceWei := new(big.Int).SetUint64(s.cfg.MaxL1GasPrice)
		MaxL1GasPrice := new(big.Int).Mul(MaxL1GasPriceWei, big.NewInt(params.GWei))
		if MaxL1GasPrice.Cmp(big.NewInt(0)) > 0 && MaxL1GasPrice.Cmp(L1GasPrice) < 0 {
			log.Info(
				s.cfg.Name+" gas price is higher than gas price threshold; aborting batch submission",
				"MaxL1GasPrice", MaxL1GasPrice,
				"L1GasPrice", L1GasPrice,
			)
			return errGasPriceTooHigh
		}
	} else {
		log.Info(s.cfg.Name + " can't get L1 gas Price; skipping the gas price check")
	}
	// Check the batch size
	// Submit the tx batch if batchSize > MinTxSize or timeDuration > MaxBatchSubmissionTime
	timeSinceLastSubmission := time.Since(s.lastBatchSubmissionTime)
	if batchSize < s.cfg.MinTxSize && timeSinceLastSubmission < s.cfg.MaxBatchSubmissionTime {
		log.Info(s.cfg.Name+" skip bacth submission. Batch too small or max submission timeout not reached.",
			"batchSize", batchSize,
			"MinTxSize", s.cfg.MinTxSize,
			"timeSinceLastSubmission", timeSinceLastSubmission,
			"MaxBatchSubmissionTime", s.cfg.MaxBatchSubmissionTime,
		)
		return errBatchSizeTooSmall
	} else {
		log.Info(s.cfg.Name+" proceeding with bacth submission.",
			"batchSize", batchSize,
			"MinTxSize", s.cfg.MinTxSize,
			"timeSinceLastSubmission", timeSinceLastSubmission,
			"MaxBatchSubmissionTime", s.cfg.MaxBatchSubmissionTime,
		)
	}

	return nil
}

func (s *BobaService) SetLastBatchSubmissionTime() {
	s.lastBatchSubmissionTime = time.Now()
}

func (s *BobaService) GetLastBatchSubmissionTime() time.Time {
	return s.lastBatchSubmissionTime
}
