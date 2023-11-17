import sys
import json
from hc_getCAPTCHA import hc_getCAPTCHA

# EVERYTHING you print here will be directly returned to TypeScript
print(json.dumps(hc_getCAPTCHA(json.loads(sys.argv[1]), None)))
