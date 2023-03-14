package batchsubmitter_test

import (
	"fmt"
	"testing"

	batchsubmitter "github.com/ethereum-optimism/optimism/go/batch-submitter"
	"github.com/stretchr/testify/require"
)

var validateConfigTests = []struct {
	name   string
	cfg    batchsubmitter.Config
	expErr error
}{
	{
		name: "bad log level",
		cfg: batchsubmitter.Config{
			LogLevel: "unknown",
		},
		expErr: fmt.Errorf("unknown level: unknown"),
	},
	{
		name: "sequencer key id or proposer id not set",
		cfg: batchsubmitter.Config{
			LogLevel: "info",

			SequencerKeyId: "",
			ProposerKeyId:  "",
		},
		expErr: batchsubmitter.ErrSequencerKeyIdNotSet,
	},
	{
		name: "sequencer key id or proposer id not set",
		cfg: batchsubmitter.Config{
			LogLevel: "info",

			SequencerKeyId: "a",
			ProposerKeyId:  "a",
		},
		expErr: batchsubmitter.ErrSameSequencerAndProposerKeyId,
	},
	{
		name: "endpoint not set",
		cfg: batchsubmitter.Config{
			LogLevel: "info",

			SequencerKeyId: "a",
			ProposerKeyId:  "b",
		},
		expErr: batchsubmitter.ErrKmsEndpointNotSet,
	},
	{
		name: "kms region not set",
		cfg: batchsubmitter.Config{
			LogLevel: "info",

			SequencerKeyId: "a",
			ProposerKeyId:  "b",
			KmsEndpoint:    "c",
		},
		expErr: batchsubmitter.ErrKmsRegionNotSet,
	},

	{
		name: "sentry-dsn not set when sentry-enable is true",
		cfg: batchsubmitter.Config{
			LogLevel:       "info",
			SequencerKeyId: "a",
			ProposerKeyId:  "b",
			KmsEndpoint:    "c",
			KmsRegion:      "d",
			SentryEnable:   true,
			SentryDsn:      "",
		},
		expErr: batchsubmitter.ErrSentryDSNNotSet,
	},
	// Valid configs
	{
		name: "valid config with privkeys and no sentry",
		cfg: batchsubmitter.Config{
			LogLevel:       "info",
			SequencerKeyId: "a",
			ProposerKeyId:  "b",
			KmsEndpoint:    "c",
			KmsRegion:      "d",
			SentryEnable:   false,
			SentryDsn:      "",
		},
		expErr: nil,
	},

	{
		name: "valid config with privkeys and sentry",
		cfg: batchsubmitter.Config{
			LogLevel:       "info",
			SequencerKeyId: "a",
			ProposerKeyId:  "b",
			KmsEndpoint:    "c",
			KmsRegion:      "d",
			SentryEnable:   true,
			SentryDsn:      "batch-submitter",
		},
		expErr: nil,
	},
	{
		name: "valid config with mnemonic and sentry",
		cfg: batchsubmitter.Config{
			LogLevel:       "info",
			SequencerKeyId: "a",
			ProposerKeyId:  "b",
			KmsEndpoint:    "c",
			KmsRegion:      "d",
			SentryEnable:   true,
			SentryDsn:      "batch-submitter",
		},
		expErr: nil,
	},
}

// TestValidateConfig asserts the behavior of ValidateConfig by testing expected
// error and success configurations.
func TestValidateConfig(t *testing.T) {
	for _, test := range validateConfigTests {
		t.Run(test.name, func(t *testing.T) {
			err := batchsubmitter.ValidateConfig(&test.cfg)
			require.Equal(t, err, test.expErr)
		})
	}
}
