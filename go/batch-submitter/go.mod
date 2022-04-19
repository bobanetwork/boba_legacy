module github.com/ethereum-optimism/optimism/go/batch-submitter

go 1.16

require (
	github.com/aws/aws-sdk-go v1.42.6
	github.com/aws/aws-sdk-go-v2 v1.2.0
	github.com/btcsuite/btcd/btcec/v2 v2.1.2 // indirect
	github.com/decred/dcrd/dcrec/secp256k1 v1.0.3 // indirect
	github.com/decred/dcrd/hdkeychain/v3 v3.0.0
	github.com/ethereum-optimism/optimism/go/bss-core v0.0.0
	github.com/ethereum-optimism/optimism/l2geth v1.0.0
	github.com/ethereum/go-ethereum v1.10.12
	github.com/getsentry/sentry-go v0.11.0
	github.com/prometheus/client_golang v1.11.0
	github.com/stretchr/testify v1.7.0
	github.com/tyler-smith/go-bip39 v1.0.1-0.20181017060643-dbb3b84ba2ef
	github.com/urfave/cli v1.22.5
	github.com/welthee/go-ethereum-aws-kms-tx-signer v0.0.0-20211013075913-ca566ae7abeb
	golang.org/x/crypto v0.0.0-20210322153248-0c34fe9e7dc2 // indirect
)

replace github.com/ethereum-optimism/optimism/l2geth => ../../l2geth

replace github.com/ethereum-optimism/optimism/go/bss-core => ../bss-core
