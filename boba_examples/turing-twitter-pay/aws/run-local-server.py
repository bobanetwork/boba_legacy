import sys
import json
from twitter_pay import lambda_handler

# EVERYTHING you print here will be directly returned to TypeScript
print(json.dumps(lambda_handler(json.loads(sys.argv[1]), None)))
