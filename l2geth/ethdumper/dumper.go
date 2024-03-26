package ethdumper

import (
	"encoding/json"
	"io"
	"os"
	"sync"

	"github.com/ethereum-optimism/optimism/l2geth/common"
	"github.com/ethereum-optimism/optimism/l2geth/log"
)

type EthAddress struct {
	Addresses []common.Address `json:"addresses"`
}

type EthDumper interface {
	Write(address common.Address)
}

var DefaultEthDumper EthDumper

func NewEthDumper() EthDumper {
	path := os.Getenv("L2GETH_ETH_DUMP_PATH")
	if path == "" {
		return &noopEthDumper{}
	}

	f, err := os.Open(path)
	if err != nil {
		panic(err)
	}

	byteFile, err := io.ReadAll(f)
	if err != nil {
		panic(err)
	}
	if len(byteFile) == 0 {
		return &FileStateDumper{
			ethAddress: EthAddress{},
			ethCache:   make(map[common.Address]bool),
		}
	}
	ethAddres := EthAddress{}
	err = json.Unmarshal(byteFile, &ethAddres)
	if err != nil {
		panic(err)
	}
	ethCache := make(map[common.Address]bool)
	for _, address := range ethAddres.Addresses {
		ethCache[address] = true
	}
	return &FileStateDumper{
		ethAddress: ethAddres,
		ethCache:   ethCache,
	}
}

type FileStateDumper struct {
	ethAddress EthAddress
	ethCache   map[common.Address]bool
	mtx        sync.Mutex
}

func (s *FileStateDumper) Write(address common.Address) {
	s.mtx.Lock()
	defer s.mtx.Unlock()
	if s.ethCache[address] {
		return
	}
	s.ethCache[address] = true

	s.ethAddress.Addresses = append(s.ethAddress.Addresses, address)

	log.Info("Found eth address", "address", address, "total", len(s.ethAddress.Addresses))

	content, err := json.Marshal(s.ethAddress)
	if err != nil {
		panic(err)
	}
	err = os.WriteFile(os.Getenv("L2GETH_ETH_DUMP_PATH"), content, 0644)
	if err != nil {
		panic(err)
	}
}

type noopEthDumper struct {
}

func (n *noopEthDumper) Write(address common.Address) {
}

func init() {
	DefaultEthDumper = NewEthDumper()
}

func Write(address common.Address) {
	DefaultEthDumper.Write(address)
}
