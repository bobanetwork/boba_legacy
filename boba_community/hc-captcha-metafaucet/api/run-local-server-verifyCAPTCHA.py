import sys
import json
from hc_verifyCAPTCHA import hc_verifyCAPTCHA

# EVERYTHING you print here will be directly returned to TypeScript
print(json.dumps(hc_verifyCAPTCHA(json.loads(sys.argv[1]), None)))
