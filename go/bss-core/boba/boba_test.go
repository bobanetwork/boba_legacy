package boba_test

import (
	"context"
	"errors"
	"math/big"
	"testing"
	"time"

	"github.com/ethereum-optimism/optimism/go/bss-core/boba"
	"github.com/ethereum-optimism/optimism/go/bss-core/drivers"
	"github.com/ethereum-optimism/optimism/go/bss-core/mock"
	"github.com/stretchr/testify/require"
)

var (
	testGasPrice         = big.NewInt(1000000000) // 1 GWEI
	errGasPriceTooHigh   = errors.New("Gas price is higher than gas price")
	errBatchSizeTooSmall = errors.New("Batch size too small or max submission timeout not reached")
)

type Service struct {
	bobaService boba.BobaServiceManager
}

func NewService(
	context context.Context, MinTxSize uint64, MaxL1GasPrice uint64,
	MaxBatchSubmissionTime time.Duration, L1Client drivers.L1Client) *Service {
	bobaService := boba.NewBobaService(
		"Test", context, MinTxSize, MaxL1GasPrice,
		MaxBatchSubmissionTime, L1Client,
	)

	return &Service{bobaService: bobaService}
}

func TestVerifyCondition(t *testing.T) {
	L1Client := MockL1Client()
	// MinTxSize = 20, MaxL1GasPrice = 2 GWEI
	s := NewService(
		context.Background(), 20, 2, time.Duration(5)*time.Millisecond, L1Client)

	s.bobaService.SetLastBatchSubmissionTime()
	err := s.bobaService.VerifyCondition(10)
	require.Equal(t, err, errBatchSizeTooSmall)

	// Wait for a while
	time.Sleep(time.Duration(5) * time.Millisecond)
	err = s.bobaService.VerifyCondition(10)
	require.Equal(t, err, nil)

	// Increase L1 gas price to 10 GWei
	testGasPrice = big.NewInt(10000000000)
	err = s.bobaService.VerifyCondition(10)
	require.Equal(t, err, errGasPriceTooHigh)
}

func TestSetLastBatchSubmissionTime(t *testing.T) {
	L1Client := MockL1Client()
	s := NewService(
		context.Background(), 20, 2, time.Duration(10)*time.Millisecond, L1Client)

	s.bobaService.SetLastBatchSubmissionTime()
	lastBatchSubmissionTime := s.bobaService.GetLastBatchSubmissionTime()
	require.Equal(t, lastBatchSubmissionTime.IsZero(), false)
}

func MockL1Client() *mock.L1Client {
	l1Client := mock.NewL1Client(mock.L1ClientConfig{
		SuggestGasPrice: func(ctx context.Context) (*big.Int, error) {
			return testGasPrice, nil
		},
	})
	return l1Client
}
