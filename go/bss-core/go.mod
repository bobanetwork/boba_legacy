module github.com/ethereum-optimism/optimism/go/bss-core

go 1.16

require (
	github.com/decred/dcrd/hdkeychain/v3 v3.0.0
	github.com/ethereum-optimism/optimism/l2geth v1.0.0
	github.com/ethereum/go-ethereum v1.12.1
	github.com/getsentry/sentry-go v0.18.0
	github.com/prometheus/client_golang v1.14.0
	github.com/stretchr/testify v1.8.1
	github.com/tyler-smith/go-bip39 v1.1.0
)

replace github.com/ethereum-optimism/optimism/l2geth => ../../l2geth

replace github.com/ethereum-optimism/optimism/go/bss-core/boba => ./boba
