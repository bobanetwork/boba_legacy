package batchsubmitter

import (
	"context"
	"os"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/kms"
	"github.com/ethereum-optimism/optimism/go/batch-submitter/drivers/proposer"
	"github.com/ethereum-optimism/optimism/go/batch-submitter/drivers/sequencer"
	bsscore "github.com/ethereum-optimism/optimism/go/bss-core"
	"github.com/ethereum-optimism/optimism/go/bss-core/dial"
	"github.com/ethereum-optimism/optimism/go/bss-core/metrics"
	"github.com/ethereum-optimism/optimism/go/bss-core/txmgr"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/log"
	"github.com/getsentry/sentry-go"
	"github.com/urfave/cli"
	ethawskmssigner "github.com/welthee/go-ethereum-aws-kms-tx-signer"
)

// Main is the entrypoint into the batch submitter service. This method returns
// a closure that executes the service and blocks until the service exits. The
// use of a closure allows the parameters bound to the top-level main package,
// e.g. GitVersion, to be captured and used once the function is executed.
func Main(gitVersion string) func(ctx *cli.Context) error {
	return func(cliCtx *cli.Context) error {
		cfg, err := NewConfig(cliCtx)
		if err != nil {
			return err
		}

		// The call to defer is done here so that any errors logged from
		// this point on are posted to Sentry before exiting.
		if cfg.SentryEnable {
			defer sentry.Flush(2 * time.Second)
		}

		log.Info("Initializing batch submitter")

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		// Set up our logging. If Sentry is enabled, we will use our custom log
		// handler that logs to stdout and forwards any error messages to Sentry
		// for collection. Otherwise, logs will only be posted to stdout.
		var logHandler log.Handler
		if cfg.SentryEnable {
			err := sentry.Init(sentry.ClientOptions{
				Dsn:              cfg.SentryDsn,
				Environment:      cfg.EthNetworkName,
				Release:          "batch-submitter@" + gitVersion,
				TracesSampleRate: bsscore.TraceRateToFloat64(cfg.SentryTraceRate),
				Debug:            false,
			})
			if err != nil {
				return err
			}

			logHandler = bsscore.SentryStreamHandler(os.Stdout, log.JSONFormat())
		} else if cfg.LogTerminal {
			logHandler = log.StreamHandler(os.Stdout, log.TerminalFormat(true))
		} else {
			logHandler = log.StreamHandler(os.Stdout, log.JSONFormat())
		}

		logLevel, err := log.LvlFromString(cfg.LogLevel)
		if err != nil {
			return err
		}

		log.Root().SetHandler(log.LvlFilterHandler(logLevel, logHandler))

		// Parse  CTC contract address.
		ctcAddress, err := bsscore.ParseContractAddr("Sequencer", cfg.CTCAddress)
		if err != nil {
			return err
		}

		// Parse and SCC contract address.
		sccAddress, err := bsscore.ParseContractAddr("Proposer", cfg.SCCAddress)
		if err != nil {
			return err
		}

		// Connect to L1 and L2 providers. Perform these last since they are the
		// most expensive.
		l1Client, err := dial.L1EthClientWithTimeout(ctx, cfg.L1EthRpc, cfg.DisableHTTP2)
		if err != nil {
			return err
		}

		l2Client, err := dial.L2EthClientWithTimeout(ctx, cfg.L2EthRpc, cfg.DisableHTTP2)
		if err != nil {
			return err
		}

		if cfg.MetricsServerEnable {
			go metrics.RunServer(cfg.MetricsHostname, cfg.MetricsPort)
		}

		chainID, err := l1Client.ChainID(ctx)
		if err != nil {
			return err
		}

		txManagerConfig := txmgr.Config{
			ResubmissionTimeout:  cfg.ResubmissionTimeout,
			ReceiptQueryInterval: time.Second,
			NumConfirmations:     cfg.NumConfirmations,
		}
		sess, _ := session.NewSession(&aws.Config{
			Credentials: credentials.NewEnvCredentials(),
			Region:      aws.String(cfg.KmsRegion),
			Endpoint:    aws.String(cfg.KmsEndpoint)},
		)
		// AWS uses IAM role for task
		if cfg.BuildEnv == "production" {
			sess, _ = session.NewSession(&aws.Config{
				Region: aws.String(cfg.KmsRegion)},
			)
		}
		svc := kms.New(sess)
		var services []*bsscore.Service
		if cfg.RunTxBatchSubmitter {
			pubkey, err := ethawskmssigner.GetPubKey(svc, cfg.SequencerKeyId)
			if err != nil {
				return err
			}
			keyAddr := crypto.PubkeyToAddress(*pubkey)
			log.Info("Batch submitter sequencer account address", "keyAddr", keyAddr)
			batchTxDriver, err := sequencer.NewDriver(sequencer.Config{
				Name:        "Sequencer",
				L1Client:    l1Client,
				L2Client:    l2Client,
				BlockOffset: cfg.BlockOffset,
				MaxTxSize:   cfg.MaxL1TxSize,
				CTCAddr:     ctcAddress,
				ChainID:     chainID,
				KeyId:       cfg.SequencerKeyId,
				KeyAddress:  keyAddr,
				KMS:         *svc,
			})
			if err != nil {
				return err
			}

			services = append(services, bsscore.NewService(bsscore.ServiceConfig{
				Context:                ctx,
				Driver:                 batchTxDriver,
				PollInterval:           cfg.PollInterval,
				ClearPendingTx:         cfg.ClearPendingTxs,
				L1Client:               l1Client,
				TxManagerConfig:        txManagerConfig,
				MinTxSize:              cfg.MinL1TxSize,
				MaxBatchSubmissionTime: cfg.MaxBatchSubmissionTime,
				MaxL1GasPrice:          cfg.MaxL1GasPrice,
			}))
		}

		if cfg.RunStateBatchSubmitter {
			pubkey, err := ethawskmssigner.GetPubKey(svc, cfg.ProposerKeyId)
			if err != nil {
				return err
			}
			keyAddr := crypto.PubkeyToAddress(*pubkey)
			log.Info("Batch submitter proposer account address", "keyAddr", keyAddr)
			batchStateDriver, err := proposer.NewDriver(proposer.Config{
				Name:        "Proposer",
				L1Client:    l1Client,
				L2Client:    l2Client,
				BlockOffset: cfg.BlockOffset,
				MaxTxSize:   cfg.MaxL1TxSize,
				SCCAddr:     sccAddress,
				CTCAddr:     ctcAddress,
				ChainID:     chainID,
				KeyId:       cfg.ProposerKeyId,
				KeyAddress:  keyAddr,
				KMS:         *svc,
			})
			if err != nil {
				return err
			}

			services = append(services, bsscore.NewService(bsscore.ServiceConfig{
				Context:                ctx,
				Driver:                 batchStateDriver,
				PollInterval:           cfg.PollInterval,
				ClearPendingTx:         cfg.ClearPendingTxs,
				L1Client:               l1Client,
				TxManagerConfig:        txManagerConfig,
				MinTxSize:              cfg.MinL1TxSize,
				MaxBatchSubmissionTime: cfg.MaxBatchSubmissionTime,
				MaxL1GasPrice:          cfg.MaxL1GasPrice,
			}))
		}

		batchSubmitter, err := bsscore.NewBatchSubmitter(ctx, cancel, services)
		if err != nil {
			log.Error("Unable to create batch submitter", "error", err)
			return err
		}

		log.Info("Starting batch submitter")

		if err := batchSubmitter.Start(); err != nil {
			return err
		}
		defer batchSubmitter.Stop()

		log.Info("Batch submitter started")

		<-(chan struct{})(nil)

		return nil
	}
}
