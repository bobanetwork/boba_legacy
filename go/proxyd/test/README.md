1. make proxyd
2. docker compose pull
3. NO_PULL=1 BUILD=0 DAEMON=1 ./up_local.sh
4.
```
inomurko@Inos-MacBook-Pro:~/opt/optimism-v2$ git diff go/proxyd/proxyd.toml
diff --git a/go/proxyd/proxyd.toml b/go/proxyd/proxyd.toml
index 112f7673..ea8d9fff 100644
--- a/go/proxyd/proxyd.toml
+++ b/go/proxyd/proxyd.toml
@@ -86,7 +86,7 @@ max_body_size_bytes = 10485760

 [redis]
 # URL to a Redis instance.
-url = "redis://REDIS:6379"
+url = "redis://127.0.0.1:6379"

 [metrics]
 # Whether or not to enable Prometheus metrics.
@@ -110,9 +110,9 @@ out_of_service_seconds = 5
 # A map of backends by name.
 [backends.mainnet]
 # The URL to contact the backend at.
-rpc_url = "MAINNET_RPC"
+rpc_url = "http://127.0.0.1:8545"
 # The WS URL to contact the backend at.
-ws_url = "MAINNET_RPC_WS"
+ws_url = "ws://127.0.0.1:8546"
 username = ""
 password = ""
 # default max_rps = 3
@@ -122,8 +122,8 @@ max_ws_conns = 10000

 [backends.alchemy]
 # The URL to contact the backend at.
-rpc_url = "ALCHEMY_RPC"
-ws_url = "ALCHEMY_RPC_WS"
+rpc_url = "http://127.0.0.1:8545"
+ws_url = "ws://127.0.0.1:8546"
 username = ""
 password = ""
 max_rps = 30000000000
```
5. inomurko@Inos-MacBook-Pro:~/opt/optimism-v2/go/proxyd$ ./bin/proxyd proxyd.toml

6. node test.js http://127.0.0.1:8547
