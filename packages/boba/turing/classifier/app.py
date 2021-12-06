import predict
import sys
import requests
from io import BytesIO
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/api',methods=['POST'])
def prediction():
    data = request.get_json(force=True)
    image = BytesIO(requests.get(data['url']).content)
    output = predict.predict(image)
    return jsonify(output)

if __name__ == '__main__':
    try:
        app.run(port=int(sys.argv[1]), debug=False)
    except:
        app.run(port=8123,debug=False)
