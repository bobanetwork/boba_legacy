module github.com/ethereum-optimism/optimism/go/batch-submitter

go 1.16

require (
	github.com/andybalholm/brotli v1.0.4
	github.com/aws/aws-sdk-go v1.42.6
	github.com/ethereum-optimism/optimism/go/bss-core v0.0.0
	github.com/ethereum-optimism/optimism/l2geth v1.0.0
	github.com/ethereum/go-ethereum v1.12.1
	github.com/getsentry/sentry-go v0.18.0
	github.com/stretchr/testify v1.8.1
	github.com/urfave/cli v1.22.5
	github.com/welthee/go-ethereum-aws-kms-tx-signer v0.0.0-20211013075913-ca566ae7abeb
)

replace github.com/ethereum-optimism/optimism/l2geth => ../../l2geth

replace github.com/ethereum-optimism/optimism/go/bss-core => ../bss-core
