# Instruction

- Create an account at https://thegraph.com/hosted-service/ and get an access token

- Set access token

```bash
npx graph auth --product hosted-service <access_token>
```

- Deploy 

```bash
npx graph deploy --product hosted-service <username>/<subgraph-name>    
```