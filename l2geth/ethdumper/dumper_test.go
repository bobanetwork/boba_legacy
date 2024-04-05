package ethdumper

import (
	"io"
	"os"
	"testing"

	"github.com/ethereum-optimism/optimism/l2geth/common"
)

func TestFileEthDumper(t *testing.T) {
	f, err := os.CreateTemp("", "")
	if err != nil {
		t.Fatalf("error creating file: %v", err)
	}
	err = os.Setenv("L2GETH_ETH_DUMP_PATH", f.Name())
	if err != nil {
		t.Fatalf("error setting env file: %v", err)
	}
	dumper := NewEthDumper()
	addr := common.Address{19: 0x01}
	dumper.Write(addr)
	data, err := io.ReadAll(f)
	if err != nil {
		t.Fatalf("error reading: %v", err)
	}
	dataStr := string(data)
	if dataStr != `{"addresses":["0x0000000000000000000000000000000000000001"]}` {
		t.Fatalf("invalid data. got: %s", dataStr)
	}
}
